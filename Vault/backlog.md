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
- [ ] Connect nonprofit dashboard APIs (currently returns mock data) #p1
- [x] Donor password reset flow #p2
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

- [x] Add `Cache-Control` headers to public API routes (`/api/projects`, etc.) #p1
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

- [x] Decompose homepage (`src/app/[locale]/(public)/page.tsx` — 754 lines) #p2
- [ ] Consolidate InquiryForm and ContactForm (near-duplicates) #p2
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

## Infrastructure #p2

- [ ] CI/CD pipeline with automated testing (GitHub Actions) #p2
- [x] Error monitoring — Sentry integrated (client + server + global error boundary) #p2 @sloan
- [ ] Staging environment on AWS Amplify #p2
- [ ] Database backup automation #p2
- [ ] Uptime monitoring #p3
- [ ] Log aggregation #p3
