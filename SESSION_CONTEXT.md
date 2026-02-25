# Session Context — Hromada

**Date**: 2026-02-25
**Branch**: `v2-payment-processing`
**Status**: Tax receipt PDF infrastructure built, donation lifecycle wired end-to-end, email formats next

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
- **Donation confirmation API** (`src/app/api/donations/confirm/route.ts`) — validates input, creates donor accounts, sends lightweight confirmation email, logs audit event
- **Donation status API** (`src/app/api/donations/[id]/status/route.ts`) — PATCH endpoint for status transitions (PENDING→RECEIVED→FORWARDED→COMPLETED). FORWARDED triggers tax receipt PDF generation, Supabase upload, and receipt email with PDF attachment.
- **Tax receipt PDF** (`src/lib/tax-receipt.ts`) — `@react-pdf/renderer`, POCACITO branding, IRS compliance language, Inter/Outfit fonts
- **Donor dashboard** (`src/app/[locale]/(public)/donor/page.tsx`) — stats, donation list, status timeline
- **Nonprofit dashboard** (`src/app/[locale]/(public)/nonprofit/page.tsx`) — real API calls, pending actions with Mark Received/Mark Forwarded buttons, wire transfer tracking
- **Donation lifecycle**: PENDING_CONFIRMATION → RECEIVED → FORWARDED (triggers receipt + email) → COMPLETED. ALLOCATED step removed (no batching needed).

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
- **Email capture** — newsletter signup with AWS SES welcome email
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
AWS_SES_REGION=us-east-1     # SES region
AWS_SES_FROM_EMAIL=noreply@hromadaproject.org  # Verified sender
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

**Lawyer meeting (2026-02-19):** Met with lawyers about FSA. They were skeptical/dismissive ("interesting and uphill battle"). Tom plans to form a personal LLC to absorb liability during the fiscal sponsorship transition period before getting own 501(c)(3). Will rely on POCACITO's lawyers for the FSA itself — interests are mostly aligned given 0% fee and friendly relationship. Key remaining question: donor data ownership on exit from POCACITO.

---

## Amplify Deploy Status

- **App ID**: `d3lasyv0tebbph`
- **Deploys #81-84 succeeding** — build issues resolved
- **Deploys #68-80 failed** (package-lock sync + source map size) — both fixed
- **Deploy #84**: Triggered 2026-02-19 to pick up env var fixes
- **Env vars restored**: All env vars from `.env.local` are now in Amplify (DATABASE_URL, DIRECT_URL, DEEPL_API_KEY, SITE_PASSWORD, SESSION_SECRET, HROMADA_ADMIN_SECRET, NEXT_PUBLIC_* vars). Previously only a subset was configured.
- **SITE_PASSWORD**: Was missing from Amplify, causing "Site access is not configured" on hromadaproject.org. Now set.
- **AWS CLI available**: `aws amplify list-jobs --app-id d3lasyv0tebbph --branch-name v2-payment-processing`
- **Warning**: `aws amplify update-app --environment-variables` REPLACES all env vars, not just the ones specified. Always include all vars when updating. Use `--cli-input-json file://` with a JSON file to avoid shell escaping issues with special characters (!, @, etc.).

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

- **AWS SES emails**: Need to verify `hromadaproject.org` domain in SES and move out of sandbox for production sends. IAM role on Amplify needs `ses:SendEmail` permission.
- **Placeholder bank details**: Still in SupportProjectCard — blocked on FSA signing and real POCACITO account info.
- **Site password**: `hromadav2!2026`
- **Admin login**: Use `HROMADA_ADMIN_SECRET` from `.env.local`
- **Hosting**: AWS Amplify (NOT Vercel). Push to branch triggers build automatically.
- **DNS**: Managed through Cloudflare for `hromadaproject.org`
- **Prisma**: Using `db push` (not `migrate dev`) due to migration drift. Schema applied directly to Supabase.
- **Tests**: 107 suites, 1792 passing, 5 skipped. Login page tests have 4 pre-existing failures (unrelated to donation flow).
- **Source maps**: Disabled in production build (`sourcemaps.disable: true` in `next.config.ts`). Source map files deleted post-build in `amplify.yml`.

---

## Sprinto Trust Center Controls (ready to paste)

8 controls written for Hromada's trust center:
- **Product Security**: Role Based Access Controls
- **Data Security**: Audit Logging, Encrypting Data At Rest, Production Database Access Restriction
- **Network Security**: Transmission Confidentiality, Limit Network Connections, Centralized Collection of Security Event Logs
- **App Security**: Secure System Modification, Approval of Changes

MOU template for NGO partners drafted and committed — see Partner MoU section below.

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

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

---

## Figma MCP Server (Code to Canvas)

**Status:** Installed and authenticated (2026-02-24).

**Setup:** `claude mcp add --transport http figma https://mcp.figma.com/mcp --scope user`
Config in `/Users/thomasprotzmann/.claude.json`.

**What it does:** "Code to Canvas" — sends browser-rendered UI (local or production) to Figma as editable layers with preserved structure. Requires Claude Code restart to load the MCP tools into a session.

**Use case — PDF documents:** The 2-page donor leave-behind and 6-page institutional deep-dive should be built as HTML/CSS files with proper typography (Inter/Outfit from Google Fonts, CSS Grid, print stylesheets). Then pushed to Figma via the MCP for final editing and PDF export. This produces far better results than reportlab.

**Files:**
- `docs/hromada_2pager.html` — 2-page leave-behind (to be created)
- `docs/hromada_6pager.html` — 6-page deep-dive (to be created)
- `docs/fonts/` — Inter and Outfit TTF files already downloaded
- `scripts/generate_pdfs.py` — old reportlab version (superseded by HTML approach)
- Plan spec: `.claude/plans/noble-bouncing-knuth.md`

**Brand assets for PDFs:**
- Partner logos: `public/partners/` — use `-white.png` variants on white/light backgrounds
- Hromada logo: `src/app/icon.png`
- POCACITO logo: `public/partners/pocacitologo-white.png`
- Candid seal: `public/partners/candidseal.png`
- Colors, fonts, content spec: see plan file above

---

## Next Task: Calendly + Plaid API Integrations

### Priority 1: Calendly Free-Tier Integration

**Goal:** Automatically capture donor name + email when they book a Calendly call, and add them to the admin dashboard mailing list.

**Constraint:** We're on the **Calendly free plan** — NO webhooks. Free plan gives read access to most API endpoints (GET scheduled events, invitees, event types). Webhooks require a paid plan ($10+/mo) which we don't want.

**Solution:** Build a polling cron that checks Calendly for new invitees periodically and upserts them into the newsletter/mailing list.

**What to build:**
1. **API route: `/api/cron/calendly-sync`** — polls Calendly API v2 for recent invitees, compares against last poll timestamp, upserts new ones into the mailing list
2. **Store last poll timestamp** — either in DB or a simple key-value (check if there's a Settings model in Prisma, or add one)
3. **Calendly API v2 docs:** https://developer.calendly.com/api-docs (v1 deprecated Aug 2025)
4. **Auth:** Personal Access Token stored in `CALENDLY_API_TOKEN` env var — ask Tom for this
5. **Mailing list:** Check `src/lib/ses.ts` for the existing subscriber/campaign system. Check Prisma schema for `NewsletterSubscriber` or `Subscriber` model.
6. **Cron trigger:** For now, expose as an API route that can be called by an external cron service (e.g., cron-job.org) or eventually AWS EventBridge. Protect with a shared secret in the `Authorization` header.
7. **Custom questions:** Calendly lets you add custom questions to booking forms. Suggest Tom adds "Which project are you interested in?" so we can capture project intent alongside name/email.

**Calendly API flow:**
```
GET /scheduled_events?organization={org_uri}&min_start_time={last_poll}&status=active
→ for each event: GET /scheduled_events/{event_id}/invitees
→ extract invitee.name, invitee.email, invitee.questions_and_answers
→ upsert into mailing list
→ update last_poll timestamp
```

### Priority 2: Plaid Bank Monitoring

**Goal:** Monitor POCACITO's Bank of America account for incoming wire transfers. When a wire lands, push a notification to the admin dashboard so Tom/Sloan know a donation arrived without manually checking the bank.

**Key facts:**
- Plaid "Transactions" product monitors linked bank accounts and sends webhooks on new transactions
- Free tier: 200 API calls (sufficient for current volume)
- Someone with POCACITO bank access (Sloan or board member) needs to authorize the Plaid Link one-time
- Match incoming wires to pending donations by **amount + reference number**
- This automates the "Confirmation" step (step 1 in the donor welcome email's "What Happens Next" flow)

**What to build:**
1. **Plaid Link page** — admin-only page to connect bank account (one-time setup). Uses Plaid Link SDK.
2. **Store Plaid access token** — encrypted in DB or env var. This is sensitive — treat like a password.
3. **Webhook endpoint: `/api/webhooks/plaid`** — receives `TRANSACTIONS: DEFAULT_UPDATE` webhooks
4. **Matching logic** — when a wire deposit arrives, compare amount + reference number against pending donations in the database
5. **Admin notification** — show "Wire received" notification in admin dashboard, optionally send email to ADMIN_EMAIL
6. **Env vars needed:** `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV` (sandbox → production)
7. **Plaid docs:** https://plaid.com/docs/

**Important:** Start with Plaid Sandbox for development. Don't connect real bank accounts until Tom/Sloan are ready.

### Existing infrastructure to build on
- **Email system:** `src/lib/email.ts` (transactional), `src/lib/ses.ts` (campaigns/subscribers), `src/lib/email-template.ts` (branded templates), `src/lib/drip.ts` (drip sequences), `src/lib/campaign-sender.ts`
- **Audit trail:** `src/lib/audit.ts` — use `logTransactionEvent()` for Plaid transaction events
- **Webhook security:** Plaid sends webhook verification headers. Validate them. See `src/lib/security.ts` for existing patterns.
- **Admin dashboard:** `src/app/[locale]/(dashboard)/admin/` — add notification UI here
- **Donation model:** Check Prisma schema — donations tracked with status, amount, paymentMethod, referenceNumber

### Files to read first
1. `prisma/schema.prisma` — all database models
2. `src/lib/ses.ts` — campaign/subscriber system
3. `src/lib/audit.ts` — audit trail pattern
4. `src/app/api/` — existing API route patterns
5. `CLAUDE.md` — project conventions (READ THIS FIRST)

---

## Also: Set Up Sentry API Access

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
