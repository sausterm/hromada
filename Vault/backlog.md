# Backlog

Prioritized upcoming work. Items move from here into [[current-sprint]] during planning.

Sources: [[specs/payment-processing]], [Codebase Analysis](../docs/CODEBASE_ANALYSIS_SUMMARY.md), ongoing work.

---

## Fiscal Sponsorship / Legal #p0

- [ ] Research FSA models (Model A vs Model C), templates, and standard language #p0 @sloan
- [ ] Draft Fiscal Sponsorship Agreement — first draft for POCACITO + attorney review #p0 @sloan @tom
- [ ] Review FSA draft with POCACITO board #p0 @tom
- [ ] Attorney review and finalization of FSA #p0 @tom
- [ ] Sign FSA with POCACITO Network #p0
- [ ] Obtain real bank details from POCACITO (routing, account, SWIFT) #p0 @sloan
- [ ] Verify tax-deductibility language for donor receipts matches FSA terms #p1
- [ ] Confirm insurance/liability requirements from FSA #p2
- [ ] Document fund disbursement process (how money moves from POCACITO → Ukraine) #p1

## Security #p0

- [ ] Fix session token vulnerability — base64 is encoding, not encryption; use `crypto.randomBytes()` #p0 @sloan
- [ ] Remove default password fallback ('admin') in `/api/admin/verify` #p0 @sloan
- [ ] Replace placeholder bank details with real POCACITO account info #p0 @sloan
- [ ] Add rate limiting to public file upload (`/api/upload/public`) #p1
- [ ] Audit all API endpoints for proper auth checks (some routes may be unprotected) #p1
- [ ] Add CSRF protection to all mutation endpoints #p2
- [ ] Implement Content Security Policy headers #p2
- [ ] Review Zod schemas — ensure all user input is validated at API boundary #p2
- [ ] Add account lockout notification emails #p3

## Payment Processing #p0

- [ ] Plaid integration — auto-detect incoming wire transfers #p1
- [ ] Wise API integration — track outbound transfers to Ukraine #p1
- [ ] Connect nonprofit dashboard APIs (currently returns mock data) #p1
- [ ] Donor password reset flow #p2
- [ ] Receipt/tax documentation generation (PDF) #p2
- [ ] Email notifications on donation status changes #p2
- [ ] ACH payment method support #p3
- [ ] Donation matching campaigns #p3

## Municipal Partnerships #p1

- [ ] Partnership matching system (US city ↔ Ukrainian hromada) #p2
- [ ] Partner onboarding workflow #p2
- [ ] Joint project creation between partner communities #p3
- [ ] Partnership progress tracking and reporting #p3
- [ ] Case studies and success stories page #p3

## Performance #p1

- [ ] Add `Cache-Control` headers to public API routes (`/api/projects`, etc.) #p1
- [ ] Replace native `<img>` with Next.js `<Image>` component (multiple files) #p1
- [ ] Viewport-based map loading — currently loads ALL projects, won't scale past ~100 #p1
- [ ] Hybrid SSR/CSR for homepage — improve SEO and initial load #p2
- [ ] Add database indexes review (Prisma schema has some, verify coverage) #p2
- [ ] API response compression #p3

## Accessibility #p1

- [ ] Mobile map view — currently shows "coming soon" placeholder #p1
- [ ] Skip-to-content navigation links #p2
- [ ] ARIA labels on all form elements (contact, donation, partnership forms) #p2
- [ ] Keyboard navigation for Leaflet map component #p2
- [ ] Color contrast audit against WCAG 2.1 AA #p3
- [ ] Screen reader testing pass #p3

## Code Quality #p2

- [ ] Decompose homepage (`src/app/[locale]/(public)/page.tsx` — 754 lines) #p2
- [ ] Consolidate InquiryForm and ContactForm (near-duplicates) #p2
- [ ] Fix remaining TypeScript errors (3) #p3
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

## Infrastructure #p2

- [ ] CI/CD pipeline with automated testing (GitHub Actions) #p2
- [ ] Error monitoring — Sentry or similar #p2
- [ ] Staging environment on Vercel #p2
- [ ] Database backup automation #p2
- [ ] Uptime monitoring #p3
- [ ] Log aggregation #p3
