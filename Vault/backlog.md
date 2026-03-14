# Backlog

Prioritized upcoming work. Items move from here into [[current-sprint]] during planning.

Sources: [[specs/payment-processing]], [Codebase Analysis](../docs/CODEBASE_ANALYSIS_SUMMARY.md), ongoing work.

---

## Fiscal Sponsorship / Legal #p0

- [x] Research FSA models (Model A vs Model C), templates, and standard language #p0 @sloan
- [x] Draft Fiscal Sponsorship Agreement — first draft for POCACITO + attorney review #p0 @sloan @tom
- [/] POCACITO board review (board meets March 27) #p0 @tom
- [x] Attorney review and finalization of FSA #p0 @tom
- [ ] Sign FSA with POCACITO Network #p0
- [ ] Obtain real bank details from POCACITO (routing, account, SWIFT) #p0 @sloan
- [ ] Verify tax-deductibility language for donor receipts matches FSA terms #p1
- [ ] Confirm insurance/liability requirements from FSA #p2
- [ ] Document fund disbursement process (how money moves from POCACITO → Ukraine) #p1

## Security #p0

- [x] Fix session token vulnerability — migrated to JWT (jose/HS256) with SESSION_SECRET, httpOnly cookies #p0 @sloan
- [x] Remove default password fallback ('admin') in `/api/admin/verify` #p0 @sloan
- [ ] Replace placeholder bank details with real POCACITO account info (blocked by FSA) #p0 @sloan
- [x] Add rate limiting to public file upload (`/api/upload/public`) — 10 req/hr per IP #p1 @sloan
- [x] Audit all API endpoints for proper auth checks — edge JWT + role-based route protection #p1 @sloan
- [x] Add CSRF protection to all mutation endpoints — Origin header verification in middleware #p2 @sloan
- [x] Implement Content Security Policy headers — full CSP + HSTS + X-Frame-Options #p2 @sloan
- [x] Review Zod schemas — `validations.ts` with `parseBody` across all public API routes #p2 @sloan
- [ ] Add account lockout notification emails #p3

## Payment Processing #p0

- [x] Financial transaction audit trail — append-only TransactionEvent table for donation/wire lifecycle #p1 @sloan
- [ ] Plaid integration — auto-detect incoming wire transfers #p1
- [ ] Wise API integration — track outbound transfers to Ukraine #p1
- [x] Connect nonprofit dashboard APIs — already wired to real Prisma queries #p1
- [x] Donor password reset flow #p2
- [x] Receipt/tax documentation generation (PDF) — @react-pdf/renderer, IRS-compliant #p2 @tom
- [ ] Email notifications on donation status changes #p2
- [ ] ACH payment method support #p3
- [ ] Donation matching campaigns #p3

## Soft Launch Prep (Wednesday March 18, 10am ET) #p0

- [ ] Create LinkedIn company page #p0 @tom
- [ ] Draft launch post — Hromada + mission + Ecoaction as first partner + first projects (one combined post) #p0 @tom
- [ ] Draft press release for soft launch — Shank to review and circulate #p1 @tom
- [x] Remove site password for open access #p0 @tom
- [x] Hide/disable donation flow — SupportProjectCard stripped to Calendly CTA only #p0
- [x] Remove POCACITO/FSA branding — footer, about, How It Works, privacy policy, locale strings #p1
- [x] Hide Ecoclub/Greenpeace partners — carousel, about, case study, project detail config #p1
- [x] Hide Municipal Partnership Program from header nav #p1
- [x] CTA button: "How It Works" → "About Us" at bottom of homepage #p2
- [x] Remove transparency page and submit-project page for directory mode #p1
- [x] Merge v2-payment-processing into directory-mode branch #p0 @tom
- [/] Ensure Ecoaction projects are submitted, approved, and browsable — Lychkove + Samar docs in repo (Mar 4) #p0 @tom
- [ ] Remove SITE_PASSWORD env var from Amplify branch (via console, NOT CLI) #p0 @tom
- [ ] Bulk project upload script — read Partner_Project_Template.csv, create projects via API #p1 @tom
- [x] Move EventBridge cron target back to hromadaproject.org #p1 @tom

## Post-Soft-Launch Content Cadence #p1

- [ ] LinkedIn post: Ecoclub Rivne second partner + new batch of projects (when Natalia ready) #p1 @tom
- [ ] LinkedIn post: Greenpeace Ukraine third partner + new projects #p1 @tom
- [ ] LinkedIn post: FSA secured, payment processing coming soon (~end of March) #p1 @tom
- [ ] LinkedIn post: payment processing live, projects can now be funded #p1 @tom
- [ ] Newsletter first edition #p2 @tom
- [ ] Project funded / project built announcements #p2 @tom

## Communications & Outreach #p1

**Policy:** Hromada is not a content-producing organization. Strictly mission-focused.

Emails:
- [x] Design donor lifecycle emails (confirmation, forwarded/receipt, project update, completion) #p1 @tom
- [x] Occasional member newsletter template (#16) #p2 @tom
- [x] Project update email (triggered by partner status updates) #p2 @tom
- [x] Press release template — project completed (#18) #p2 @tom
- [x] Admin newsletter compose page — write, preview, send to subscribers #p2 @tom
- [x] Email system production-ready — SES credentials, recipient routing, newsletter sending all working #p0 @tom
- [x] Fix newsletter double-logo bug (campaign sender double-wrapping emailLayout) #p2 @tom
- [ ] Request SES production access (exit sandbox) — currently can only send to verified addresses #p1 @tom
- [ ] Auto-send project completed press release (#18) on COMPLETED status — pulls all data from DB, sends to all subscribers #p2 @tom

Press releases (only):
- [x] Project constructed / connected to grid announcement (template #18, auto on COMPLETED)

Social media (only):
- New project posted
- Success story / project completion
- Partner featured in press

Materials:
- [x] 1-pager for Scott Sklar — completed in Figma, Mar 8 #p0 @tom
- [/] 2-pager explainer handout (Figma) — visual overview for in-person meetings #p1 @tom
- [/] 6-pager detailed explainer (Figma) — deeper dive for donors/partners #p1 @tom
- [ ] May 20 Cannon Building event materials — invitations, program, handouts #p1 @tom @max
- [ ] Director's letter template (as-needed basis) #p3 @tom

## Events #p1

- [/] May 20 Cannon Building Room 340 — morning event. Max booked. #p1 @tom @max
  - [ ] Confirm Lloyd Doggett speaking
  - [ ] Confirm Kostia speaking
  - [ ] Confirm Natalia attending
  - [ ] Invite Ukrainian mayors
  - [ ] Invite Svitlana Romanko, Clarence Edwards, Romina Bandura
  - [ ] Event program and run-of-show
  - [ ] Printed materials for attendees

## External Partnerships #p2

- [/] EOPA partnership evaluation — joint call, data use terms, community consent model #p2 @tom
- [/] Scott Sklar — 1-pager then conference call to his network #p1 @tom
- [x] Michael Shank — met Mar 11. Follow-ups: FCNL head intro, press release, Doggett Dear Colleague letter #p1 @tom

## Municipal Partnerships #p1

- [ ] Sister city matching — lookup table mapping Ukrainian cities to US sister city partners, flag new projects from sister cities for outreach #p1 @tom
- [ ] Sister city banner on project detail page (e.g. "Kharkiv is a sister city of Cincinnati, OH") #p2
- [ ] Admin dashboard: partnership inquiry management (list, status, respond) #p1
- [ ] Partnership matching system (US city ↔ Ukrainian hromada) #p2
- [ ] Partner onboarding workflow #p2
- [ ] Joint project creation between partner communities #p3
- [ ] Partnership progress tracking and reporting #p3
- [ ] Case studies and success stories page #p3

## Performance #p1

- [x] Add `Cache-Control` headers to public API routes (`/api/projects`, etc.) #p1
- [x] MapTiler vector tiles with Ukrainian labels — MapLibre GL rendered inside Leaflet container, parallel flyTo sync, OSM fallback #p1
- [x] Replace native `<img>` with Next.js `<Image>` component — all React components migrated, only HTML email templates remain as native #p1
- [x] Viewport-based map loading — bounds-based API filtering, client-side region caching, debounced fetch, composite DB index #p1
- [x] Hybrid SSR/CSR for homepage — server component with client-side hydration for interactive elements #p2
- [x] Add database indexes review — comprehensive indexing across all tables (category, status, coordinates, foreign keys, ~30+ indexes) #p2
- [x] API response compression — handled by Next.js (gzip default) + CloudFront (gzip+brotli), no additional config needed #p3

## Accessibility #p1

- [x] Mobile map view — dual-map pattern with list/map toggle #p1
- [x] Skip-to-content navigation link — locale-aware, visually hidden until focused, targets `<main id="main-content">` on all pages #p2
- [x] ARIA labels on all form elements — Input/Textarea components auto-add `aria-invalid` + `aria-describedby` linking error messages, EmailCaptureForm labeled #p2
- [x] Keyboard navigation for Leaflet map component — `role="region"`, `aria-label`, `keyboard={true}`, built-in arrow/+/- keys #p2
- [x] Color contrast audit against WCAG 2.1 AA — 26 failures fixed (darkened text/category/badge colors) #p3
- [x] Screen reader testing pass — `<main>` landmarks on all pages, `<h1>` everywhere, `scope="col"` on tables, `aria-expanded` on FAQ, `role="alert"` on errors, heading hierarchy fixed #p3

## Code Quality #p2

- [x] Decompose homepage (`src/app/[locale]/(public)/page.tsx` — 754 lines) #p2
- [x] Calendly integration — scheduling with auto-mailing-list enrollment #p1 @tom
- [x] Consolidate InquiryForm and ContactForm (near-duplicates) — InquiryForm deleted, ContactForm is the single form #p2
- [x] Fix remaining TypeScript errors (3) #p3
- [ ] Add missing type definitions for Leaflet marker clustering #p3
- [ ] Increase test coverage from ~70% to 85% #p2
- [ ] Add E2E tests for critical flows: donate, browse projects, admin CRUD #p2
- [ ] Clean up SESSION_CONTEXT.md — migrate relevant content to Vault specs #p3

## Features — Donor Experience #p2

- [ ] Donor profiles with giving history and impact summary #p2
- [ ] Project update notifications (email + in-app) #p3
- [ ] Impact reporting with progress photos and before/after comparisons #p3
- [ ] Social sharing for projects #p3
- [ ] Recurring donation support #p3

## Features — Municipal Tools #p3

- [ ] Municipal dashboard for project management #p3
- [ ] Progress reporting tools with photo evidence #p3
- [ ] Budget tracking and transparency reports #p3
- [ ] Automated status updates to donors #p3

## Analytics #p1

- [ ] AWS Pinpoint setup — user analytics, donor funnel tracking, event segmentation #p1 @sloan
- [ ] KPI dashboard (CloudWatch or QuickSight) — visitor→project view→support click→donation conversion #p2 @sloan

## Infrastructure #p2

- [ ] CI/CD pipeline with automated testing (GitHub Actions) #p2
- [x] Error monitoring — Sentry integrated (client + server + global error boundary) #p2 @sloan
- [ ] Staging environment on AWS Amplify #p2
- [ ] Database backup automation #p2
- [ ] Uptime monitoring #p3
- [ ] Log aggregation #p3
