# Amplify Build Fix & Password Reset Deployment

**Date:** 2026-03-04
**Author:** Sloan (via Claude Code — Opus session)
**Branch:** `v2-payment-processing`
**Status:** Deployed to demo.hromadaproject.org — build succeeds, one blocker remaining

---

## What We Did

### Problem
Amplify couldn't deploy Next.js 16 properly. Two previous sessions (2026-03-03) attempted a full downgrade to Next.js 15 — both failed due to OOM kills and cascading compatibility issues.

### Root Cause
Next.js 16 defaults to **Turbopack** for builds. Turbopack creates symlinks in `.next/node_modules/` that Amplify's compute bundler can't handle (`EEXIST` errors). This is a [known Amplify bug](https://github.com/aws-amplify/amplify-hosting/issues/4074).

### Fix (4 files, no downgrade needed)
| File | Change |
|------|--------|
| `package.json` | `next build` → `next build --webpack` |
| `amplify.yml` | Added `NODE_OPTIONS=--max-old-space-size=8192` to build command |
| `src/app/[locale]/layout.tsx` | Removed invalid `"cyrillic" as "latin"` Outfit font subset (webpack catches this, Turbopack ignored it) |
| `src/app/api/admin/test-receipt/route.ts` | Wrapped `Buffer` in `new Uint8Array()` for webpack compatibility |

Also ran `npx prisma generate` — the Prisma client was stale after schema changes.

### Commit
```
964f6f4 fix: use webpack bundler for Amplify-compatible builds
```

### Amplify Build
- **Job 171:** SUCCEED (our push, ~5 min build)
- **Job 172:** SUCCEED (redeploy after adding SES_REGION env var)

---

## What's Working
- Build succeeds on Amplify with Next.js 16.1.6 + `--webpack`
- All API routes registered (including `/api/auth/forgot-password` and `/api/auth/reset-password`)
- Password reset flow works **locally** end-to-end (email delivered, OTP generated, password changed)
- `demo.hromadaproject.org` serves the site correctly
- Sloan's Gmail verified in SES on Thomas's AWS account

## What's NOT Working (Blocker for Thomas)

### SES emails don't send from Amplify compute

**Symptom:** Password reset API returns 200 on demo site, but no email arrives.

**Cause:** The Amplify app has **no IAM service role** attached. The serverless compute function has no AWS credentials, so the SES client fails silently (the API catches the error and still returns `{"success":true}` to avoid revealing whether the email exists).

**Fix — Thomas needs to do these 2 steps (~2 minutes):**

#### Step 1: Update trust policy on `Hromada-LambdaExecRole`
1. AWS Console → IAM → Roles → `Hromada-LambdaExecRole`
2. Click "Trust relationships" tab → "Edit trust policy"
3. Replace with:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": ["lambda.amazonaws.com", "amplify.amazonaws.com"]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```
4. Click "Update policy"

#### Step 2: Attach role to Amplify app
1. AWS Console → AWS Amplify → hromada app
2. App settings → General → Edit
3. Under "Service role", select `Hromada-LambdaExecRole`
4. Save
5. Trigger a redeploy (push an empty commit or click "Redeploy this version" in Amplify)

The `Hromada-LambdaExecRole` already has `ses:SendEmail`, `ses:SendRawEmail`, and `ses:SendTemplatedEmail` permissions.

---

## Other Findings

### SES Sandbox Mode
Thomas's AWS account SES is in **sandbox mode** — can only send to verified email addresses. Verified identities:
- `hromadaproject.org` (domain)
- `thomasprotzman@proton.me`
- `tprotzmant+test1@gmail.com`
- `sloanaustermann@proton.me`
- `sloantaustermann@gmail.com` (added this session)

**For production:** Thomas should request SES production access:
- AWS Console → SES → Account dashboard → "Request production access"
- Mail type: Transactional
- Use case: "Transactional emails for a nonprofit platform (password resets, donation receipts, project updates). Low volume (<1000/month). All recipients opt-in."
- Approval takes 24-48 hours

### AWS CLI Profile
Configured `hromada` AWS CLI profile for Sloan on Thomas's account:
- `aws configure --profile hromada` (credentials from Thomas's IAM setup)
- Use `--profile hromada` for all Amplify/SES commands against Thomas's account
- Sloan's own AWS profile (default) is separate and untouched

### Amplify Environment Variables
All env vars confirmed on `v2-payment-processing` branch:
- `SES_REGION=us-east-1` (added this session — was missing, caused email failures)
- `DATABASE_URL`, `DIRECT_URL`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `SESSION_SECRET`, `HROMADA_ADMIN_SECRET`, `SITE_PASSWORD`
- `NEXT_PUBLIC_APP_URL=https://demo.hromadaproject.org`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_EMAIL`, `RESEND_API_KEY`, `CALENDLY_API_TOKEN`, `DEEPL_API_KEY`, `CRON_SECRET`

**Warning (repeated from SESSION_CONTEXT):** `aws amplify update-branch --environment-variables` REPLACES all env vars. Always include all vars.

### Backup Branch
`v2-payment-processing-backup` — snapshot of branch state before pulling Thomas's changes.

---

## Key Takeaway

The Next.js 15 downgrade was never needed. The actual fix was `next build --webpack` — one flag that tells Next.js 16 to use webpack instead of Turbopack, producing output Amplify can handle. The password reset code was always correct; only the deployment pipeline was broken.
