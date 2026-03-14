# Hromada Roadmap

> Connecting American donors with Ukrainian municipalities for infrastructure rebuilding.

## Vision

A trusted, transparent platform where donors can discover Ukrainian community projects, contribute directly, and track real impact. Fiscally sponsored by POCACITO Network (501c3, EIN 99-0392258).

## Team

- **Sloan** — Technical lead, full-stack development
- **Tom** — Co-founder, partnerships, strategy. Board connections at POCACITO.
- **Kostiantyn Krynytskyi** — Founding Partner (Ecoaction), handles municipal relationships and bank details
- **Natalia** — Founding Partner (Ecoclub Rivne)
- **Polina** — Founding Partner (Greenpeace Ukraine)

## Fiscal Sponsorship — POCACITO Network

**Status:** FSA attorney-reviewed. POCACITO board meets **March 27**, signing expected **March 28**.

- POCACITO Network has agreed to serve as fiscal sponsor at **0% fee**
- Tom has relationships with half the POCACITO board — they are actively helping get Hromada going
- ✅ FSA drafted and reviewed by lawyers (Feb 19)
- ✅ FSA sent to POCACITO for board review (Feb 20)
- ✅ FSA amendments needed documented (Mar 7) — signing authority for MoUs, partner vetting, refund policy, audit flow-through
- **Next step:** Board meeting March 27 → signing March 28. Raise MoU signing authority at board meeting.
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
- [x] Interactive Leaflet map with project markers and clustering (MapTiler vector tiles with Ukrainian labels via MapLibre GL)
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
- [x] Connect nonprofit dashboard to real donation/wire-transfer APIs #p1 @sloan
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

**Status:** Awaiting POCACITO board meeting (March 27). Signing expected March 28.

- [x] Research FSA models/templates #p0 @sloan
- [x] Draft Fiscal Sponsorship Agreement #p0 @sloan @tom
- [x] Attorney review and finalization #p0 @tom ← completed Feb 19
- [x] FSA sent to POCACITO for board review #p0 @tom ← sent Feb 20
- [ ] POCACITO board review #p0 @tom ← **board meets March 27**
- [ ] Sign FSA #p0 @tom ← **target March 28**
- [ ] Obtain real bank details #p0 @sloan
- [ ] Replace placeholder bank details in `SupportProjectCard.tsx` #p0 @sloan

### Track C: Operational Readiness (Technical — @sloan)

Can start after Track A, before FSA is signed.

- [x] Connect nonprofit dashboard to real APIs #p1
- [ ] Test full donation flow end-to-end #p1
- [x] Verify email delivery in production — 10/10 testable emails confirmed working (Mar 4) #p1
- [x] Set production environment variables in Amplify — SES credentials, ADMIN_EMAIL, all vars configured #p1
- [x] Configure custom domain with SSL — hromadaproject.org + demo subdomain on Amplify #p1
- [ ] Request SES production access (exit sandbox) #p1
- [ ] Move EventBridge cron target back to hromadaproject.org before launch #p1
- [ ] Review Terms of Service against FSA terms #p1 @tom
- [ ] Review Privacy Policy for donor data coverage #p1 @tom
- [ ] Verify all POCACITO references are accurate #p1

### Track D: Partnerships & Outreach (@tom)

Partner ecosystem and messaging strategy. Ecoaction already submitting real projects.

#### Partner MoUs
- [x] Draft Partner MoU template (Feb 2026)
- [x] Legal review — 5-domain panel, 15 recommendations implemented (Mar 5-7)
- [x] EcoAction Ukraine MoU — reviewed with Kostia, at EcoAction board #p1
- [x] Ecoclub Rivne MoU — reviewed with Natalia, at Ecoclub board #p1
- [/] Greenpeace Ukraine MoU — call with Polina Kolodiazhna next week #p1
- [/] MoU signing — not urgent pre-FSA, boards reviewing, Max/Brendan also reviewing #p1
- [ ] US municipal partnership outreach (sister city programs) #p3

#### Messaging & Storytelling
- [ ] Core messaging framework (value prop, donor personas, key messages) #p1
- [x] 1-pager for Scott Sklar — completed in Figma, Mar 8 #p0 @tom
- [ ] Project storytelling template (before/after, impact metrics) #p1
- [ ] Launch announcement draft (press release, social media) #p2
- [ ] Donor testimonial collection process #p2
- [ ] Case study: first successful project funding #p3

#### Events
- [/] May 20 — Cannon Congressional Office Building, Room 340 (morning). Booked by Max. Speakers: Lloyd Doggett, Kostia. Natalia attending. Ukrainian mayors. Hopeful: Svitlana Romanko, Clarence Edwards, Romina Bandura. #p1 @tom @max

#### External Partnerships
- [/] EOPA (Elected Officials to Protect America) — AI energy impact tool, donor network, centrist positioning. Joint call TBD. #p2 @tom
- [x] Michael Shank — met Mar 11. Wants to intro FCNL head post-soft-launch, circulate press release, get Dear Colleague letter from Doggett to other members. #p1 @tom
- [/] Scott Sklar — connector to donor networks. Needs 1-pager, then conference call. #p1 @tom

### Launch Strategy — Four Phases

**Phase 1: Soft launch — Wednesday March 18, 10am ET**
Matchmaking directory only. No payment processing, no donations, no FSA/POCACITO references. Ecoaction as first official partner.
- [ ] Create LinkedIn company page #p0 @tom
- [ ] Draft launch post — Hromada + mission + Ecoaction + first batch of projects (one combined post) #p0 @tom
- [ ] Draft press release — Shank to review and circulate to actual press #p1 @tom
- [x] Remove site password for open access #p0 @tom
- [x] Hide/disable donation flow — Calendly CTA only, payment methods stripped #p0 @tom
- [x] Remove POCACITO/FSA branding — footer, about, How It Works, privacy policy #p1
- [x] Hide Ecoclub/Greenpeace partners until their announcement posts #p1
- [x] Remove transparency page and submit-project page #p1
- [x] Hide Municipal Partnership Program from nav #p1
- [x] CTA button: "How It Works" → "About Us" #p2
- [x] Merge v2-payment-processing into directory-mode #p0 @tom
- [/] Ecoaction projects live and browsable #p0
- [ ] Confirm admin and partner access #p1

**LinkedIn content cadence (showing momentum):**
1. Launch post: Hromada + mission + Ecoaction as first partner + first projects
2. Ecoclub Rivne: second partner + new batch of projects (when Natalia is ready)
3. Greenpeace Ukraine: third partner + new batch of projects
4. FSA secured, payment processing coming soon (~end of March)
5. Payment processing live — projects can now be funded
6. May 20 Cannon Building event + possibly an April event
7. Newsletter first edition, project funded/built announcements, event announcements

**Phase 2: FSA announcement (~end of March)**
- [ ] POCACITO board approves (March 27) and signs FSA (~March 28)
- [ ] Post: fiscal sponsor secured, payment processing coming soon

**Phase 3: Full launch — payment processing live**
- [ ] Obtain real bank details from POCACITO
- [ ] Replace placeholder bank details with real POCACITO info
- [ ] Restore POCACITO branding
- [ ] Test donation flow on production with real bank details
- [ ] Merge `v2-payment-processing`
- [ ] Post: donation flow is live, projects can now be funded

**Phase 4: Ongoing cadence**
- [ ] May 20 Cannon Building event (possibly April event before then)
- [ ] Newsletter first edition
- [ ] Projects funded and projects built announcements
- [ ] Event announcements

> **Current status (Mar 14):** Directory mode branch ready. Site password removed, donation UI hidden (Calendly CTA only), POCACITO/FSA references stripped, Ecoclub/Greenpeace hidden until their announcement posts. Transparency and submit-project pages removed. v2-payment-processing merged into directory-mode. Security done, email system done, MoUs at partner boards. All three partners confirmed. 75% test coverage. MapTiler live. Shank advising. Soft launch Wednesday March 18, 10am ET. POCACITO board meets March 27, FSA signing ~March 28. May 20 Cannon Building event booked.

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
- [x] Receipt/tax documentation generation (PDF) — @react-pdf/renderer, IRS-compliant #p2 @tom
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
- [x] Donor project timeline page — post-donation progress tracking #p2
- [ ] Impact reporting with progress photos and before/after #p3
- [x] Social sharing for projects (ShareButton: Twitter, LinkedIn, Facebook, Email, Copy Link) #p3
- [ ] Recurring donation support #p3
- [ ] Donation matching campaigns #p3

### Performance & Accessibility
- [x] Viewport-based map loading — bounds-based API, client-side region caching, debounced fetch #p1
- [x] Mobile map view (dual-map pattern with list/map toggle) #p1
- [x] Skip-to-content navigation link — locale-aware, targets `<main id="main-content">` on all pages #p2
- [x] ARIA labels on all form elements — Input/Textarea auto-add `aria-invalid` + `aria-describedby`, EmailCaptureForm labeled #p2
- [x] Keyboard navigation for Leaflet map — `role="region"`, `aria-label`, built-in keyboard nav #p2
- [x] Color contrast audit against WCAG 2.1 AA — 26 failures fixed across public + admin #p3
- [x] Screen reader testing pass — landmarks, headings, table scope, aria-expanded, role="alert", heading hierarchy #p3

### Code Quality
- [x] Consolidate InquiryForm and ContactForm (near-duplicates) — InquiryForm deleted #p2
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
| **Phase 1** | Launch readiness | Mar 2026 | 🔄 ~85% — soft launch Wed Mar 18, FSA signing ~Mar 28 |
| **SOFT LAUNCH** | Directory mode | Wed Mar 18 10am ET | ⏳ Ecoaction as first partner, LinkedIn launch, press release |
| **FULL LAUNCH** | First real donation | ~Mar 28+ | ⏳ Blocked by FSA signing (board meets Mar 27) |
| **Phase 2** | Automation | Apr–May 2026 | ~20% — Sentry, CSRF, password reset, tax receipts |
| **Phase 3** | Growth | Jun–Sep 2026 | ~20% — mobile map, donor dashboard, test coverage |
| **Phase 4** | Scale | Oct 2026+ | ~5% — CI/CD, Candid done |

> **The critical path is the FSA.** Security hardening and email system are complete. FSA is attorney-reviewed and with POCACITO board. The moment the FSA is signed and bank details are in hand, launch is days away — not weeks. SES production access must also be requested before launch (currently sandbox only).

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
