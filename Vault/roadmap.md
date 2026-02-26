# Hromada Roadmap

> Connecting American donors with Ukrainian municipalities for infrastructure rebuilding.

## Vision

A trusted, transparent platform where donors can discover Ukrainian community projects, contribute directly, and track real impact. Fiscally sponsored by POCACITO Network (501c3, EIN 99-0392258).

## Team

- **Sloan** — Technical lead, full-stack development
- **Tom** — Co-founder, partnerships, strategy. Board connections at POCACITO.
- **Kostiantyn Krynytskyi** — Director (Ukraine), handles municipal relationships and bank details

## Fiscal Sponsorship — POCACITO Network

**Status:** FSA drafted, attorney-reviewed, ready to send to POCACITO (Feb 19, 2026).

- POCACITO Network has agreed to serve as fiscal sponsor at **0% fee**
- Tom has relationships with half the POCACITO board — they are actively helping get Hromada going
- ✅ FSA drafted and reviewed by lawyers (Feb 19)
- **Next step:** Send FSA to POCACITO for board review (Feb 20)
- Bank details (routing, account, SWIFT) available from POCACITO immediately upon FSA signing
- See: [[specs/fiscal-sponsorship]]

---

## Phase Overview

```
Phase 0: Foundation        █████████████████████  ~95% ← nearly complete
Phase 1: Launch Readiness  ██████████████░░░░░░░  ~70% ← blocked by FSA signing only
Phase 2: Automation        ███░░░░░░░░░░░░░░░░░░  ~15% ← Sentry, CSRF, password reset done
Phase 3: Growth            ████░░░░░░░░░░░░░░░░░  ~20% ← some items done early
Phase 4: Scale             █░░░░░░░░░░░░░░░░░░░░   ~5% ← CI/CD, Candid done
```

### Dependency Chain

```
Phase 0 (code) ──────────────────────────────→ Phase 2 (automation)
                                                    ↓
FSA (legal) ──→ Phase 1 (launch) ──→ LAUNCH ──→ Phase 3 (growth)
                                                    ↓
                                               Phase 4 (scale)
```

**Key insight:** Phase 0 (code) and the FSA (legal) can proceed in parallel. The only thing that blocks launch is the FSA signing + security fixes. All other code work can continue independent of the legal process.

---

## Phase 0: Foundation (Current — ~95% Complete)

**Goal:** Build the core platform: projects, map, donations, dashboards, auth.
**Timeline:** Jan–Feb 2026 (mostly done)

### What's Done
- [x] Next.js 16 app with App Router, TypeScript strict mode
- [x] PostgreSQL database via Prisma on Supabase
- [x] Role-based auth (Admin, Partner, Nonprofit Manager, Donor) with JWT sessions
- [x] Internationalization (EN/UK) with next-intl
- [x] Interactive Leaflet map with project markers and clustering
- [x] Mobile map view with list/map toggle
- [x] Project CRUD with admin dashboard
- [x] Project submission workflow (partner submits → admin approves)
- [x] Photo upload to Supabase Storage
- [x] Edge middleware: geo-blocking (RU/BY), password protection, security headers
- [x] Contact form with email notifications (AWS SES)
- [x] Transparency page with TI Ukraine pre-screening criteria
- [x] Privacy policy, terms of service, OFAC sanctions policy pages
- [x] ~75% test coverage (Jest + React Testing Library)
- [x] Earth-tone humanitarian design system (cream/navy/ukraine-blue palette)
- [x] Donation database model (PENDING → RECEIVED → ALLOCATED → FORWARDED → COMPLETED)
- [x] Support Project Card with payment instructions (Wire, DAF, Check)
- [x] "I've Sent My Contribution" confirmation flow with auto donor account creation
- [x] Donor dashboard (`/donor`) — donations, status timeline, updates
- [x] Nonprofit Manager dashboard (`/nonprofit`) — mark received, manage wire transfers
- [x] Welcome email to new donors via AWS SES
- [x] WireTransfer model for outbound transfers to Ukraine
- [x] Fee comparison display (Wise vs Bank Wire)
- [x] POCACITO Network fiscal sponsor branding throughout
- [x] Partnership landing page (`/partner-with-us`)
- [x] Partnership inquiry form with email notifications
- [x] PartnershipInquiry database model
- [x] Obsidian planning vault
- [x] CI/CD pipeline (GitHub Actions)

### What Remains in Phase 0
- [ ] Connect nonprofit dashboard to real donation/wire-transfer APIs (currently mock data) #p1 @sloan
- [x] Decompose 754-line homepage into components #p2 @sloan
- [x] Add `Cache-Control` headers to public API routes #p2

---

## Phase 1: Launch Readiness (Active — Target: March/April 2026)

**Goal:** Everything needed to accept the first real donation.
**Blocked by:** FSA signing (legal only — security fixes complete)
**See:** [[specs/launch-readiness]], [[specs/security-hardening]], [[specs/fiscal-sponsorship]]

### Track A: Security Hardening (Technical — @sloan) ✅ COMPLETE

All critical and high-priority security items resolved.

- [x] Fix session token vulnerability — now using JWT with jose (not base64)
- [x] Remove default password fallback — `ADMIN_PASSWORD` env var required
- [x] Move hardcoded site password to `SITE_PASSWORD` env var
- [x] Set `httpOnly: true` on site access cookie
- [x] Add rate limiting to `/api/upload/public`
- [x] Update Next.js to 16.1.6 (latest, patched)
- [x] Sanitize user input in email templates (`sanitizeInput` from security lib)

### Track B: Fiscal Sponsorship (Legal — @tom @sloan)

**Status:** FSA ready to send to POCACITO (Feb 20, 2026)

- [x] Research FSA models/templates #p0 @sloan
- [x] Draft Fiscal Sponsorship Agreement #p0 @sloan @tom
- [x] Attorney review and finalization #p0 @tom ← completed Feb 19
- [ ] POCACITO board review #p0 @tom ← **NEXT: sending Feb 20**
- [ ] Sign FSA #p0 @tom
- [ ] Obtain real bank details #p0 @sloan
- [ ] Replace placeholder bank details in `SupportProjectCard.tsx` #p0 @sloan

### Track C: Operational Readiness (Technical — @sloan)

Can start after Track A, before FSA is signed.

- [ ] Connect nonprofit dashboard to real APIs #p1
- [ ] Test full donation flow end-to-end #p1
- [ ] Verify email delivery in production #p1
- [ ] Set production environment variables in Amplify #p1
- [ ] Configure custom domain with SSL #p1
- [ ] Review Terms of Service against FSA terms #p1 @tom
- [ ] Review Privacy Policy for donor data coverage #p1 @tom
- [ ] Verify all POCACITO references are accurate #p1

### Track D: Partnerships & Outreach (@tom)

Partner ecosystem and messaging strategy.

#### Partner MoUs
- [x] Draft Partner MoU template (Feb 2026)
- [ ] EcoAction Ukraine MoU — finalize and sign #p1
- [ ] Additional Ukrainian NGO partners — identify and outreach #p2
- [ ] US municipal partnership outreach (sister city programs) #p3

#### Messaging & Storytelling
- [ ] Core messaging framework (value prop, donor personas, key messages) #p1
- [ ] Project storytelling template (before/after, impact metrics) #p1
- [ ] Launch announcement draft (press release, social media) #p2
- [ ] Donor testimonial collection process #p2
- [ ] Case study: first successful project funding #p3

### Launch Gate

Tracks A (security) complete. Tracks B, C, D in progress. Then:

- [ ] FSA signed and bank details in hand
- [ ] Remove site password (or convert to soft-launch invite list)
- [ ] Test donation flow on production URL with real bank details
- [ ] Confirm admin and nonprofit manager access
- [ ] Launch messaging ready (announcement, social)
- [ ] **GO LIVE**

> **Current status:** Security done, FSA going to POCACITO Feb 20. Once signed, launch is ~1 week away.

---

## Phase 2: Automation (Post-Launch — Month 1-2)

**Goal:** Reduce manual work, improve donor experience, add financial tracking.
**Depends on:** Launched platform with real donations flowing
**See:** [[specs/payment-processing]] (Phase 2)

### Payment Automation
- [ ] Plaid integration — auto-detect incoming wire transfers #p1 @sloan
- [ ] Wise API integration — track outbound transfers to Ukraine #p1 @sloan
- [ ] Remove manual "I've Sent My Contribution" step (Plaid replaces it) #p1
- [ ] Auto-update donation status when Wise confirms delivery #p1
- [ ] Add `Cache-Control: private, no-store` to Plaid/Wise webhook and authenticated API routes #p2

### Donor Quality of Life
- [x] Donor password reset flow #p2 @sloan
- [ ] Receipt/tax documentation generation (PDF) #p2 @sloan
- [ ] Email notifications on donation status changes #p2
- [ ] ACH payment method support (lower-cost for smaller donations) #p3

### Platform Hardening
- [x] CSRF protection on all mutation endpoints (origin verification in edge middleware) #p2
- [ ] Redis-based rate limiting (replace in-memory) #p2
- [x] Sentry error monitoring (configured, production-only due to Next.js 16 compat)
- [ ] E2E tests for critical donation flow #p2
- [ ] Legacy auth path deprecation #p2

---

## Phase 3: Growth (Post-Launch — Month 3-6)

**Goal:** Expand capabilities to attract more donors and partners. Build trust and transparency features.
**Depends on:** Stable platform with proven donation flow

### Municipal Partnerships
- [ ] Partnership matching system (US city ↔ Ukrainian hromada) #p2
- [ ] Partner onboarding workflow #p2
- [ ] Joint project creation between partner communities #p3
- [ ] Partnership progress tracking and reporting #p3
- [/] Case studies and success stories page (Kharkiv case study on homepage; dedicated page not yet built) #p3

### Donor Experience
- [x] Donor profiles with giving history and impact summary #p2
- [x] Project update notifications (email + in-app) #p3
- [ ] Impact reporting with progress photos and before/after #p3
- [ ] Social sharing for projects #p3
- [ ] Recurring donation support #p3
- [ ] Donation matching campaigns #p3

### Performance & Accessibility
- [ ] Viewport-based map loading (won't scale past ~100 projects) #p1
- [x] Mobile map view (dual-map pattern with list/map toggle) #p1
- [ ] Skip-to-content navigation links #p2
- [/] ARIA labels on all form elements (semantic label associations in place, sparse aria-label attributes) #p2
- [ ] Keyboard navigation for Leaflet map #p2
- [ ] Color contrast audit against WCAG 2.1 AA #p3

### Code Quality
- [ ] Consolidate InquiryForm and ContactForm (near-duplicates) #p2
- [/] Increase test coverage to 85% (currently at ~75%, up from ~63%) #p2
- [ ] Add E2E tests for browse projects, admin CRUD #p2
- [x] Fix remaining TypeScript errors (0 errors, `tsc --noEmit` clean) #p3

---

## Phase 4: Scale & Trust (Month 6+)

**Goal:** Build the infrastructure for growth and institutional confidence.
**Depends on:** Meaningful donor/partner traction

### Trust & Verification
- [ ] Third-party verification system for municipalities
- [x] Candid/GuideStar integration (Platinum seal linked in footer, about page, and homepage)
- [ ] Analytics and impact metrics dashboard
- [ ] Budget tracking and transparency reports per project

### Municipal Tools
- [ ] Municipal dashboard for project management
- [ ] Progress reporting tools with photo evidence
- [ ] Automated status updates to donors
- [ ] Multi-project management for larger hromadas

### Infrastructure
- [x] CI/CD pipeline with GitHub Actions
- [ ] Staging environment on Amplify
- [ ] Database backup automation
- [ ] Uptime monitoring
- [ ] Log aggregation

### Expansion
- [ ] Multi-language expansion beyond EN/UK
- [ ] API for partner integrations
- [ ] Stripe integration for smaller donations
- [ ] 2FA for admin accounts
- [ ] OAuth2/OIDC for donor login

---

## Timeline Summary

| Phase | Focus | Target | Status |
|-------|-------|--------|--------|
| **Phase 0** | Foundation (code) | Feb 2026 | ✅ ~95% complete |
| **Phase 1** | Launch readiness | Mar 2026 | 🔄 ~70% — awaiting FSA |
| **LAUNCH** | First real donation | Mar 2026 (est.) | ⏳ Blocked by FSA signing |
| **Phase 2** | Automation | Apr–May 2026 | ~15% — Sentry, CSRF, password reset |
| **Phase 3** | Growth | Jun–Sep 2026 | ~20% — mobile map, donor dashboard, test coverage |
| **Phase 4** | Scale | Oct 2026+ | ~5% — CI/CD, Candid done |

> **The critical path is the FSA.** Security hardening is complete. FSA is attorney-reviewed and going to POCACITO Feb 20. The moment the FSA is signed and bank details are in hand, launch is days away — not weeks.

---

## Decision Records

| ADR | Decision | Status |
|-----|----------|--------|
| [[decisions/001-obsidian-planning-hub]] | Use Obsidian vault in git for planning | Accepted |
| [[decisions/002-payment-architecture]] | Manual confirmation + planned Plaid/Wise automation | Accepted |
| [[decisions/003-supabase-storage-migration]] | Photos to Supabase Storage CDN | Accepted (Implemented) |

## Specs

| Spec | Status |
|------|--------|
| [[specs/payment-processing]] | In Progress |
| [[specs/fiscal-sponsorship]] | In Progress |
| [[specs/security-hardening]] | Complete |
| [[specs/launch-readiness]] | In Progress |
