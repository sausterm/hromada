# Session Context — Hromada

**Date**: 2026-02-19
**Branch**: `v2-payment-processing`
**Status**: Security hardened, audit trail built, Amplify deploy fixing in progress, trust center controls written

---

## Summary

Hromada is a Next.js platform connecting American donors with Ukrainian municipalities for infrastructure rebuilding. Fiscal sponsor: POCACITO Network (501(c)(3), EIN 99-0392258).

Donors support projects via Wire Transfer, DAF Grant, or Check. When they confirm a contribution, a donor account is auto-created. Nonprofit managers track donations and outbound wire transfers to Ukraine via a separate dashboard.

---

## Payment Flow Architecture

### Current Flow (Manual Confirmation)
```
Donor → Views project → Clicks "Support This Project" →
Chooses payment method (Wire/DAF/Check) → Sees instructions →
Sends payment externally → Returns to site →
Clicks "I've Sent My Contribution" → Fills form →
Account auto-created → Welcome email sent →
Tracks donation in /donor dashboard
```

### Future Flow (With Plaid)
```
Donor → Enters email → Sends payment →
Plaid detects payment in BoA → Auto-matches to project →
Account auto-created → Receipt email with login →
Tracks donation in /donor dashboard
```

---

## Money Flow

```
Donor sends funds
       ↓
Bank of America (POCACITO Network 501(c)(3) account)
       ↓
Plaid detects payment (future)
       ↓
Nonprofit Manager reviews in dashboard
       ↓
Initiates transfer via Wise or Bank Wire
       ↓
Ukrainian municipal bank account
       ↓
Donor receives "Funds Delivered" update
```

---

## Key Systems Built

### Security (v2-cyber-security merge, 2026-02-18)
- **JWT sessions** (`src/lib/auth.ts`) — jose/HS256, httpOnly cookies, DB session validation, session versioning
- **Rate limiting** (`src/lib/rate-limit.ts`) — in-memory, per-IP, 50K entry cap, per-endpoint limits
- **CSRF protection** (`src/middleware.ts`) — Origin header verification on state-changing requests
- **Security headers** (`src/lib/security-headers.ts`) — CSP, X-Frame-Options, HSTS, X-Content-Type-Options
- **Input validation** (`src/lib/validations.ts`) — Zod schemas on all public API routes with `parseBody()` helper
- **Magic bytes validation** (`src/app/api/upload/public/route.ts`) — validates file content matches declared MIME type
- **HMAC site access cookies** — replaces raw password storage in cookies
- **Geoblocking** — middleware blocks requests from RU/BY
- **Sentry error monitoring** — client + server, `@sentry/nextjs` v10

### Financial Audit Trail (2026-02-18)
- **TransactionEvent model** (`prisma/schema.prisma`) — append-only table for financial audit logging
  - Fields: transactionType, transactionId, action, previousStatus, newStatus, amount, currency, paymentMethod, referenceNumber, actorId, actorRole, ipAddress, metadata (Json)
  - Indexes on transactionType+transactionId, action, actorId, createdAt
- **logTransactionEvent()** (`src/lib/audit.ts`) — fire-and-forget audit logging
- **buildTransactionEventCreate()** (`src/lib/audit.ts`) — returns Prisma operation for use inside `$transaction` (atomic with status changes)
- **TransactionAction constants** — DONATION_CREATED, DONATION_STATUS_CHANGED, WIRE_CREATED, etc.
- **Wired into** `src/app/api/donations/confirm/route.ts` — structured logging replaces old text-based `logAuditEvent()`

### Payment & Donations
- **SupportProjectCard** (`src/components/projects/SupportProjectCard.tsx`) — fully internationalized, 3 payment methods with copy buttons and confirmation form
- **Donation confirmation API** (`src/app/api/donations/confirm/route.ts`) — validates input, creates donor accounts, sends welcome emails, logs audit event
- **Donor dashboard** (`src/app/[locale]/(public)/donor/page.tsx`) — stats, donation list, status timeline
- **Nonprofit dashboard** (`src/app/[locale]/(public)/nonprofit/page.tsx`) — pending actions, mark received, wire transfer tracking

### Translation & i18n
- **DeepL API** (`src/lib/translate.ts`) — migrated from Google Cloud Translation, better Ukrainian quality
- **Batch translation** — all 66 projects have Ukrainian translations (facilityNameUk, municipalityNameUk, briefDescriptionUk, fullDescriptionUk)
- **Admin translate-all endpoint** (`src/app/api/admin/translate-all/route.ts`)
- **Batch script** (`scripts/translate-projects.ts`)
- **SupportProjectCard** — all ~40 hardcoded strings converted to locale keys in both en.json and uk.json

### Document System
- **Schema**: `ProjectDocument` model — url, filename, documentType (COST_ESTIMATE, ENGINEERING_ASSESSMENT, ITEMIZED_BUDGET, SITE_SURVEY, OTHER), extracted text, translation status
- **Upload API** (`src/app/api/projects/[id]/documents/route.ts`) — multipart upload to Supabase Storage, background PDF text extraction + translation
- **Admin UI** (`src/components/admin/DocumentUpload.tsx`) — drag-and-drop with type selector, status polling
- **Public display** — DocumentCard on project detail page: download original PDF link + expandable translated text inline
- **PDF extraction** (`src/lib/pdf-extract.ts`) — pdf-parse library, chunked translation for long documents

### Homepage
- **"See It Happen" case study** — School #7, Novohrodivka (NGO Ecoaction partner showcase). 5-step timeline, partner attribution badge, impact stats card. Uses real project from database as example of partner track record.
- **Featured projects** — admin-managed 4-slot system with fallback to newest projects
- **Photo strip** — scrolling completed project photos
- **FAQ** — 5 expandable questions
- **Email capture** — newsletter signup with Resend welcome email
- **Hero** — full-viewport with parallax, entrance animations, promise badge

### Other
- **Municipal Partnership Program** — landing page, inquiry form, API, PartnershipInquiry model
- **Password reset flow** — forgot-password page, reset-password API
- **OFAC compliance policy page** (`/ofac-policy`)
- **Supabase Storage** — project photos migrated from local to CDN
- **RLS enabled** on all 14 tables (no policies = deny all via PostgREST, Prisma bypasses)
- **Site access show/hide password toggle** — added eye icon button to site-access page

---

## Role-Based Dashboards

| Role | Dashboard | Purpose |
|------|-----------|---------|
| ADMIN | `/admin` | Full system access, user management |
| PARTNER | `/partner` | Submit projects for approval |
| NONPROFIT_MANAGER | `/nonprofit` | Track donations, manage wire transfers |
| DONOR | `/donor` | Track personal donations and updates |

---

## Environment Variables

```bash
# Configured
RESEND_API_KEY=re_...        # Sending emails
ADMIN_EMAIL=admin@...        # Receives donation notifications
DEEPL_API_KEY=...            # Translation (DeepL free tier, 500K chars/month)
SITE_PASSWORD=hromadav2!2026 # Site access gate

# Production (AWS Amplify)
# All vars configured in Amplify console including:
# NEXT_PUBLIC_SENTRY_DSN, DATABASE_URL, DIRECT_URL, SESSION_SECRET, etc.

# Needed before launch
# Real POCACITO Network bank details (currently placeholders in SupportProjectCard)

# Future
PLAID_CLIENT_ID=...          # Bank transaction monitoring
PLAID_SECRET=...
WISE_API_KEY=...             # Outbound transfer tracking
```

---

## Business Context

- **Fiscal Sponsor**: POCACITO Network, 501(c)(3), EIN 99-0392258
- **Candid Profile**: Platinum Seal — https://app.candid.org/profile/16026326/pocacito-network/
- **Receiving Bank**: Bank of America
- **Outbound Transfers**: Wise (cheaper for most amounts) or Bank Wire (very large)
- **Target Donors**: Wealthy individuals, corporations, foundations
- **Credit cards/Stripe**: Intentionally excluded — 3% fee too high for large donations
- **Sprinto Trust Center**: Free plan (Trust Center only, no API access). 8 controls written and ready to paste.

---

## Team

- Thomas Protzman (Director)
- Kostiantyn Krynytskyi (Director - Ukraine, handles municipal bank details)
- Sloan Austermann (Director - Technology & Operations)

---

## Design System

### Color Palette
- **Backgrounds**: `var(--cream-100)` (page bg), `var(--cream-200)`, `var(--cream-300)` (dividers)
- **Text**: `var(--navy-700)` (headings), `var(--navy-600)` (body), `var(--navy-500)` (secondary)
- **Accent**: `var(--ukraine-blue)` (#0057B8)
- **Category colors**: teal (#5B8FA8), sage (#7B9E6B), amber (#D4954A), terracotta (#C75B39), taupe (#8B7355)

### Partner Logos
Two variants in `public/partners/`: `Logo.png` (cream bg) and `Logo-white.png` (white bg). Match variant to section background.

### Page Layout
- Container: `max-w-3xl mx-auto px-4 py-12`
- Hamburger menu: Projects → About → Municipal Partnership → Contact → divider → Dashboard/Login

---

## Git Branch State

- **main**: Mobile bug fixes, about page, login password toggle
- **v2-payment-processing**: All of main + payment processing, MPP, homepage redesign, i18n, document system, DeepL migration, case study, security hardening, audit trail
- When merging v2 into main, expect conflicts in: `globals.css`, `Header.tsx`, locale files, homepage

---

## FSA Status

Fiscal Sponsorship Agreement drafted and under review. Key points:
- 0% fee guaranteed through March 2027 or independent 501(c)(3)
- POCACITO retains variance power (protects tax-deductibility)
- All IP belongs to Hromada/Thomas
- OFAC/sanctions compliance required before first international disbursement
- Governing law: Virginia

---

## Amplify Deploy Status

- **App ID**: `d3lasyv0tebbph`
- **Last successful deploy**: #67 (`eaa4eaf` — security hardening, 2026-02-18)
- **Deploys #68-78 failed**: Two issues:
  1. `package-lock.json` out of sync (Next.js 16.1.4→16.1.6, missing `@swc/helpers@0.5.18`) — **FIXED** in commit `d45252b`
  2. Build output exceeds 230MB Amplify limit (Sentry adds ~90MB of source maps) — **IN PROGRESS**, need to disable source maps via `next.config.ts`
- **AWS CLI available**: `aws amplify list-jobs --app-id d3lasyv0tebbph --branch-name v2-payment-processing`

---

## Cybersecurity Rating: 7.5/10

### What's done
- JWT sessions, bcrypt(12), httpOnly cookies
- Rate limiting on all public endpoints
- CSRF protection (Origin header)
- CSP + security headers
- Zod validation on all API routes
- Magic bytes file validation
- Sentry error monitoring
- Geoblocking (RU/BY)
- HMAC site access cookies
- Financial audit trail (TransactionEvent)

### What's needed for Plaid/Wise
1. Webhook signature verification (Plaid/Wise send HMAC signatures)
2. Idempotency keys (prevent duplicate processing)
3. Secrets management (currently env vars, need rotation plan)
4. Audit trail — DONE

### Remaining security items
- Account lockout notification emails (#p3, low priority)
- Bank details page blocked on FSA signing

---

## Technical Notes

- **Resend emails**: Currently using `onboarding@resend.dev` (test). Need to verify `hromadaproject.org` domain in Resend for production sends.
- **Placeholder bank details**: Still in SupportProjectCard — blocked on FSA signing and real POCACITO account info.
- **Site password**: `hromadav2!2026`
- **Admin login**: Use `HROMADA_ADMIN_SECRET` from `.env.local`
- **Hosting**: AWS Amplify (NOT Vercel). Push to branch triggers build automatically.
- **DNS**: Managed through Cloudflare for `hromadaproject.org`
- **Prisma**: Using `db push` (not `migrate dev`) due to migration drift. Schema applied directly to Supabase.
- **Tests**: 80 suites, 1463 passing, 0 failures, 5 skipped. All test failures from Zod migration fixed.
- **Source maps**: Need to disable in production build to stay under Amplify's 230MB artifact limit. Sentry's `withSentryConfig` adds ~90MB.

---

## Sprinto Trust Center Controls (ready to paste)

8 controls written for Hromada's trust center:
- **Product Security**: Role Based Access Controls
- **Data Security**: Audit Logging, Encrypting Data At Rest, Production Database Access Restriction
- **Network Security**: Transmission Confidentiality, Limit Network Connections, Centralized Collection of Security Event Logs
- **App Security**: Secure System Modification, Approval of Changes

MOU template for NGO partners discussed — lightweight 2-3 page memorandum preferred over formal contract (enforcement jurisdiction issue in Ukraine).

---

## Partner MoU (drafted 2026-02-19)

`Partner_MoU_Template.md` / `Partner_MoU_Template.docx` committed to repo. Covers:
- Project verification (municipality legitimacy, official identity, scope/cost accuracy, conflict-of-interest disclosure)
- Fund-use monitoring (partner must monitor that funds go to stated project, report misuse immediately)
- Reporting (monthly progress updates with photos, completion photos, structured closure report, 14-day response SLA)
- OFAC sanctions cooperation ("not knowingly" standard — Hromada owns the screening, partners cooperate and report)
- Anti-corruption and anti-diversion (no bribes, no military diversion, no unauthorized fees, maintain expenditure records)
- Brand use restrictions
- Indemnification for sanctions/corruption breaches
- 1-year term, 30-day termination notice, surviving obligations for in-progress projects
- Not enforceable against Ukrainian NGOs in practice — functions as behavioral framework, due diligence artifact, and basis for terminating partnerships

---

## Next Task: Set Up Sentry API Access

Sentry is installed and reporting errors (`@sentry/nextjs` v10), but there's no API auth token for querying issues, events, or releases from the CLI.

**What's needed from Tom:**
1. Go to `https://sentry.io/settings/auth-tokens/`
2. Create new token with scopes: `project:read`, `org:read`, `event:read`, `issue:admin`
3. Copy the token (starts with `sntrys_`, shown only once)
4. Provide the org slug and project slug (visible in Sentry dashboard URL)

**Once provided, Claude will:**
- Add `SENTRY_AUTH_TOKEN` to `.env.local`
- Add `SENTRY_ORG` and `SENTRY_PROJECT` to `.env.local`
- Add Sentry API section to `CLAUDE.md` for persistent access across sessions
- Test API access (list recent issues, check error rates)
- Optionally wire auth token into Amplify for release tracking and source map uploads
