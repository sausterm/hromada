# Hromada Roadmap

> Connecting American donors with Ukrainian municipalities for infrastructure rebuilding.

## Vision

A trusted, transparent platform where donors can discover Ukrainian community projects, contribute directly, and track real impact. Fiscally sponsored by POCACITO Network (501c3, EIN 99-0392258).

## Team

- **Sloan** — Technical lead, full-stack development
- **Tom** — Co-founder, partnerships, strategy. Board connections at POCACITO.
- **Kostiantyn Krynytskyi** — Director (Ukraine), handles municipal relationships and bank details

## Fiscal Sponsorship — POCACITO Network

**Status:** Verbal agreement secured (Feb 2026). FSA drafting in progress.

- POCACITO Network has agreed to serve as fiscal sponsor at **0% fee**
- Tom has relationships with half the POCACITO board — they are actively helping get Hromada going
- **Next step:** Draft the Fiscal Sponsorship Agreement (FSA), then finalize with POCACITO and an attorney
- Bank details (routing, account, SWIFT) available from POCACITO immediately upon FSA signing
- See: [[specs/fiscal-sponsorship]]

---

## Phase Overview

```
Phase 0: Foundation        ████████████████████░░  ~85% ← current code work
Phase 1: Launch Readiness  ████████░░░░░░░░░░░░░  ~40% ← blocked by FSA
Phase 2: Automation        ░░░░░░░░░░░░░░░░░░░░░   0% ← post-launch
Phase 3: Growth            ░░░░░░░░░░░░░░░░░░░░░   0% ← post-traction
Phase 4: Scale             ░░░░░░░░░░░░░░░░░░░░░   0% ← future
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

## Phase 0: Foundation (Current — ~85% Complete)

**Goal:** Build the core platform: projects, map, donations, dashboards, auth.
**Timeline:** Jan–Feb 2026 (mostly done)

### What's Done
- [x] Next.js 16 app with App Router, TypeScript strict mode
- [x] PostgreSQL database via Prisma on Supabase
- [x] Role-based auth (Admin, Partner, Nonprofit Manager, Donor)
- [x] Internationalization (EN/UK) with next-intl
- [x] Interactive Leaflet map with project markers and clustering
- [x] Project CRUD with admin dashboard
- [x] Project submission workflow (partner submits → admin approves)
- [x] Photo upload to Supabase Storage
- [x] Edge middleware: geo-blocking (RU/BY), password protection, security headers
- [x] Contact form with email notifications (Resend)
- [x] Transparency page, privacy policy, terms of service
- [x] ~70% test coverage (Jest + React Testing Library)
- [x] Earth-tone humanitarian design system (cream/navy/ukraine-blue palette)
- [x] Donation database model (PENDING → RECEIVED → ALLOCATED → FORWARDED → COMPLETED)
- [x] Support Project Card with payment instructions (Wire, DAF, Check)
- [x] "I've Sent My Contribution" confirmation flow with auto donor account creation
- [x] Donor dashboard (`/donor`) — donations, status timeline, updates
- [x] Nonprofit Manager dashboard (`/nonprofit`) — mark received, manage wire transfers
- [x] Welcome email to new donors via Resend
- [x] WireTransfer model for outbound transfers to Ukraine
- [x] Fee comparison display (Wise vs Bank Wire)
- [x] POCACITO Network fiscal sponsor branding throughout
- [x] Partnership landing page (`/partner-with-us`)
- [x] Partnership inquiry form with email notifications
- [x] PartnershipInquiry database model
- [x] Obsidian planning vault

### What Remains in Phase 0
- [ ] Connect nonprofit dashboard to real donation/wire-transfer APIs (currently mock data) #p1 @sloan
- [ ] Decompose 754-line homepage into components #p2 @sloan
- [ ] Add `Cache-Control` headers to public API routes #p2
- [ ] Replace native `<img>` with Next.js `<Image>` component #p2

---

## Phase 1: Launch Readiness (Active — Target: March/April 2026)

**Goal:** Everything needed to accept the first real donation.
**Blocked by:** FSA signing (legal) + security fixes (technical)
**See:** [[specs/launch-readiness]], [[specs/security-hardening]], [[specs/fiscal-sponsorship]]

### Track A: Security Hardening (Technical — @sloan)

Can start immediately. ~4 hours of focused work.

- [ ] Fix session token vulnerability (base64 → `crypto.randomBytes`) #p0
- [ ] Remove default password fallback (`'admin'`) in `/api/admin/verify` #p0
- [ ] Move hardcoded site password to `SITE_PASSWORD` env var #p0
- [ ] Set `httpOnly: true` on site access cookie #p0
- [ ] Add rate limiting to `/api/upload/public` #p0
- [ ] Update Next.js to patched version (DoS CVE) #p1
- [ ] Sanitize user input in email templates #p1

### Track B: Fiscal Sponsorship (Legal — @tom @sloan)

Parallel to Track A. ~6-8 weeks total.

- [ ] Research FSA models/templates #p0 @sloan
- [ ] Draft Fiscal Sponsorship Agreement #p0 @sloan @tom
- [ ] POCACITO board review #p0 @tom
- [ ] Attorney review and finalization #p0 @tom
- [ ] Sign FSA #p0 @tom
- [ ] Obtain real bank details #p0 @sloan
- [ ] Replace placeholder bank details in `SupportProjectCard.tsx` #p0 @sloan

### Track C: Operational Readiness (Technical — @sloan)

Can start after Track A, before FSA is signed.

- [ ] Connect nonprofit dashboard to real APIs #p1
- [ ] Test full donation flow end-to-end #p1
- [ ] Verify email delivery in production #p1
- [ ] Set production environment variables in Vercel #p1
- [ ] Configure custom domain with SSL #p1
- [ ] Review Terms of Service against FSA terms #p1 @tom
- [ ] Review Privacy Policy for donor data coverage #p1 @tom
- [ ] Verify all POCACITO references are accurate #p1

### Launch Gate

All three tracks must be complete. Then:

- [ ] Remove site password (or convert to soft-launch invite list)
- [ ] Test donation flow on production URL
- [ ] Confirm admin and nonprofit manager access
- [ ] **GO LIVE**

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

### Donor Quality of Life
- [ ] Donor password reset flow #p2 @sloan
- [ ] Receipt/tax documentation generation (PDF) #p2 @sloan
- [ ] Email notifications on donation status changes #p2
- [ ] ACH payment method support (lower-cost for smaller donations) #p3

### Platform Hardening
- [ ] CSRF protection on all mutation endpoints #p2
- [ ] Redis-based rate limiting (replace in-memory) #p2
- [ ] Sentry error monitoring #p2
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
- [ ] Case studies and success stories page #p3

### Donor Experience
- [ ] Donor profiles with giving history and impact summary #p2
- [ ] Project update notifications (email + in-app) #p3
- [ ] Impact reporting with progress photos and before/after #p3
- [ ] Social sharing for projects #p3
- [ ] Recurring donation support #p3
- [ ] Donation matching campaigns #p3

### Performance & Accessibility
- [ ] Viewport-based map loading (won't scale past ~100 projects) #p1
- [ ] Mobile map view (currently shows "coming soon") #p1
- [ ] Skip-to-content navigation links #p2
- [ ] ARIA labels on all form elements #p2
- [ ] Keyboard navigation for Leaflet map #p2
- [ ] Color contrast audit against WCAG 2.1 AA #p3

### Code Quality
- [ ] Consolidate InquiryForm and ContactForm (near-duplicates) #p2
- [ ] Increase test coverage from ~70% to 85% #p2
- [ ] Add E2E tests for browse projects, admin CRUD #p2
- [ ] Fix remaining TypeScript errors (3) #p3

---

## Phase 4: Scale & Trust (Month 6+)

**Goal:** Build the infrastructure for growth and institutional confidence.
**Depends on:** Meaningful donor/partner traction

### Trust & Verification
- [ ] Third-party verification system for municipalities
- [ ] Candid/GuideStar integration (already Platinum seal)
- [ ] Analytics and impact metrics dashboard
- [ ] Budget tracking and transparency reports per project

### Municipal Tools
- [ ] Municipal dashboard for project management
- [ ] Progress reporting tools with photo evidence
- [ ] Automated status updates to donors
- [ ] Multi-project management for larger hromadas

### Infrastructure
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Staging environment on Vercel
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

| Phase | Focus | Target | Depends On |
|-------|-------|--------|------------|
| **Phase 0** | Foundation (code) | Feb 2026 | — |
| **Phase 1** | Launch readiness | Mar–Apr 2026 | Phase 0 + FSA |
| **LAUNCH** | First real donation | Apr 2026 (est.) | Phase 1 |
| **Phase 2** | Automation | May–Jun 2026 | Launch |
| **Phase 3** | Growth | Jul–Oct 2026 | Traction |
| **Phase 4** | Scale | Nov 2026+ | Growth |

> **The critical path is the FSA.** All technical work can proceed in parallel with the legal process. The moment the FSA is signed and bank details are in hand, launch is days away — not weeks.

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
| [[specs/security-hardening]] | In Progress |
| [[specs/launch-readiness]] | In Progress |
