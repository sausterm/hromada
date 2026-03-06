# Handoff: Partner Document Analysis Pipeline

**From:** Sloan
**To:** Thomas
**Date:** 2026-03-06
**Branch:** `directory-mode` (pushed to origin)

---

## What This Is

A pipeline that automatically analyzes partner-submitted project documents (PDFs, DOCX) stored in S3. When a partner uploads a cost estimate, engineering report, or design package, this pipeline:

1. Extracts text (PDF via PyMuPDF, DOCX via python-docx)
2. Classifies the document type (cost estimate, technical report, design package, contract, invoice, etc.)
3. Extracts cost signals (UAH, USD, EUR amounts with regex)
4. Extracts project info (partner, location, facility type, power capacity)
5. Runs a verification checklist based on the Hromada Verification Framework
6. Writes structured `.analysis.json` back to S3

---

## What's Built

### 1. S3 Client (`src/lib/s3.ts`)
- Staging/production bucket pattern: `hromada-partner-docs-staging` -> `hromada-partner-docs`
- `uploadDocumentToStaging()` — partner uploads go to staging
- `promoteDocuments()` — copy staging -> production on approval, delete from staging
- `deleteFromStaging()` — clean up on rejection
- `getProductionUrl()` — public URL for production docs
- `buildDocumentKey()` — sanitized key like `ecoaction/lychkove/1709578000-cost-estimate.pdf`

### 2. Upload Endpoint (`src/app/api/upload/document/route.ts`)
- POST with partner auth required
- PDF-only, 20MB max, magic byte validation
- Rate limited: 20 uploads/hour/IP
- Uploads to staging bucket via `uploadDocumentToStaging()`

### 3. PDF Extract + Translate (`src/lib/pdf-extract.ts`)
- Runs in Next.js (not the Lambda) — used for the existing Supabase-based document flow
- Extracts text via `pdf-parse`, detects language, translates UK->EN via DeepL
- Stores results in `ProjectDocument` model (`originalTextUk`, `translatedTextEn`, `extractionStatus`)

### 4. Lambda Analyzer (`infra/lambda/doc-analyzer/handler.py`) — THE NEW PIECE
- **Trigger:** S3 PutObject events on `hromada-partner-docs` bucket
- **Text extraction:** PyMuPDF for PDF, python-docx for DOCX
- **Classification rules:** keyword matching on filename + first 1000 chars of text (Ukrainian keywords like "кошторис", "технічний звіт", etc.)
- **Cost extraction:** regex patterns for UAH/USD/EUR, deduplication, totals
- **Project info extraction:** partner/project from S3 key path, location regex, power (kW) regex
- **Verification checklist** (10 items from Hromada Verification Framework):
  - Cost estimate provided
  - Design/engineering package provided
  - Technical inspection report provided
  - Project verification summary provided
  - AVK-5 software used for cost estimate
  - Location identified
  - Facility identified
  - USD cost available
  - Co-financing stated
  - Engineer/firm identified
- **Cross-references sibling docs** in the same project folder for holistic scoring
- **Output:** writes `_analysis/<key>.analysis.json` to the same bucket
- **Batch mode:** `python handler.py [bucket] [prefix]` to analyze everything in a bucket

### 5. Deploy Script (`infra/lambda/doc-analyzer/deploy.sh`)
- Builds zip with linux x86_64 deps for Lambda
- `./deploy.sh --create` for first deploy, `./deploy.sh` for updates
- Uses AWS profile `hromada`, region `us-east-1`
- Requires `LAMBDA_ROLE_ARN` env var for creation

### 6. Prisma Model (`ProjectDocument`)
- Already exists with `url`, `filename`, `documentType`, `originalTextUk`, `translatedTextEn`, `extractionStatus`
- Does NOT yet have fields for S3 analysis results (classification, verification score, cost signals)

---

## What Still Needs to Be Done

### AWS Infrastructure (must do)
- [ ] Create IAM role for Lambda with S3 read/write permissions on both buckets
- [ ] Deploy Lambda function: `LAMBDA_ROLE_ARN=arn:aws:iam::... ./deploy.sh --create`
- [ ] Create S3 event notification on `hromada-partner-docs` bucket -> Lambda trigger (PutObject, suffix `.pdf` and `.docx`)
- [ ] Verify the S3 buckets exist (`hromada-partner-docs-staging` and `hromada-partner-docs`)
- [ ] Test with a real partner document upload

### Connect Analysis Results to the App (should do)
- [ ] Add fields to `ProjectDocument` model for analysis results:
  - `s3Key` (String?) — the S3 key for cross-referencing
  - `classification` (String?) — doc type from analyzer
  - `verificationScore` (Int?) — passed count from checklist
  - `verificationTotal` (Int?) — total checklist items
  - `costSignals` (Json?) — extracted amounts
  - `analysisJson` (Json?) — full analysis blob
- [ ] Build an API route or cron that reads `_analysis/*.json` from S3 and syncs results into the DB
- [ ] Surface verification scores in admin UI (e.g., on the project approval page)

### Admin UI (nice to have)
- [ ] Show per-project verification dashboard: which checklist items pass/fail, with evidence
- [ ] Show extracted cost signals alongside the project's stated budget
- [ ] Allow admin to view the full analysis JSON for any document
- [ ] Color-code projects by verification completeness in the admin project list

### Future Enhancements
- [ ] OCR for scanned PDFs (Textract or Tesseract layer)
- [ ] LLM-based extraction for unstructured documents (Claude API call from Lambda)
- [ ] Auto-translate extracted text in the Lambda (currently only in Next.js)
- [ ] SNS notification to admin when a new analysis completes

---

## How to Test Locally

```bash
cd infra/lambda/doc-analyzer

# Install deps locally
pip3 install -r requirements.txt

# Run batch analysis on a bucket (needs AWS credentials)
python handler.py hromada-partner-docs ecoaction/

# Or test with a fake S3 event
python -c "
from handler import handler
result = handler({
    'Records': [{
        's3': {
            'bucket': {'name': 'hromada-partner-docs'},
            'object': {'key': 'ecoaction/lychkove/cost-estimate.pdf'}
        }
    }]
}, None)
print(result)
"
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/s3.ts` | S3 client (staging/production buckets) |
| `src/app/api/upload/document/route.ts` | Partner document upload endpoint |
| `src/lib/pdf-extract.ts` | In-app PDF extraction + translation |
| `infra/lambda/doc-analyzer/handler.py` | Lambda analyzer (classification, costs, verification) |
| `infra/lambda/doc-analyzer/deploy.sh` | Lambda deployment script |
| `infra/lambda/doc-analyzer/requirements.txt` | Python deps (pymupdf, python-docx) |
| `prisma/schema.prisma` | `ProjectDocument` model (line 557) |
| `Hromada-Verification-Framework.md` | The verification checklist source doc |
| `Vault/specs/Hromada-Verification-Framework.md` | Same, in Vault |

---

## Architecture Diagram

```
Partner Upload (Next.js)
    |
    v
[hromada-partner-docs-staging]  (S3 bucket)
    |
    | (on approval: promoteDocuments())
    v
[hromada-partner-docs]  (S3 bucket)
    |
    | (S3 PutObject event trigger)
    v
[hromada-doc-analyzer]  (Lambda)
    |
    | (writes analysis JSON)
    v
[hromada-partner-docs/_analysis/]  (S3 prefix)
    |
    | (TODO: sync to DB)
    v
[ProjectDocument table]  (Prisma/Postgres)
    |
    v
Admin UI  (verification dashboard)
```

---

## Notes

- The Lambda writes analysis to the SAME bucket under `_analysis/` prefix. The handler skips files with this prefix to avoid infinite loops.
- Classification is keyword-based (not ML). Works well for standardized Ukrainian construction docs. May need tuning for edge cases.
- The verification checklist cross-references ALL docs in a project folder, not just the current doc. So uploading a cost estimate improves the score for the whole project.
- `function.zip` is in the repo (gitignored? check) — it's the built Lambda package. Rebuild with `deploy.sh` before deploying.
