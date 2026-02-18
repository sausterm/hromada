# Session Context — Hromada

**Date**: 2026-02-18
**Branch**: `v2-payment-processing`
**Status**: Payment processing complete, i18n complete (DeepL), document system built, homepage case study live, FSA drafted, RLS enabled

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

### Payment & Donations
- **SupportProjectCard** (`src/components/projects/SupportProjectCard.tsx`) — fully internationalized, 3 payment methods with copy buttons and confirmation form
- **Donation confirmation API** (`src/app/api/donations/confirm/route.ts`) — validates input, creates donor accounts, sends welcome emails
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

# Production (AWS Amplify)
# Same vars must be added in Amplify console → Environment variables

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

---

## Team

- Thomas Protzmann (Director)
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
- **v2-payment-processing**: All of main + payment processing, MPP, homepage redesign, i18n, document system, DeepL migration, case study
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

## Technical Notes

- **Resend emails**: Currently using `onboarding@resend.dev` (test). Need to verify `hromadaproject.org` domain in Resend for production sends.
- **Placeholder bank details**: Still in SupportProjectCard — blocked on FSA signing and real POCACITO account info.
- **Site password**: `hromada!2026`
- **Admin login**: Use `HROMADA_ADMIN_SECRET` from `.env.local`
- **Hosting**: AWS Amplify (NOT Vercel). Push to branch triggers build automatically.
- **DNS**: Managed through Cloudflare for `hromadaproject.org`
