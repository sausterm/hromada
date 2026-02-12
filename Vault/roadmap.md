# Hromada Roadmap

> Connecting American donors with Ukrainian municipalities for infrastructure rebuilding.

## Vision

A trusted, transparent platform where donors can discover Ukrainian community projects, contribute directly, and track real impact. Fiscally sponsored by POCACITO Network (501c3, EIN 99-0392258).

## Team

- **Sloan** — Technical lead, full-stack development
- **Tom** — Co-founder, partnerships, strategy. Board connections at POCACITO.

## Fiscal Sponsorship — POCACITO Network

**Status:** Verbal agreement secured (Feb 2026). FSA drafting in progress.

- POCACITO Network has agreed to serve as fiscal sponsor at **0% fee**
- Tom has relationships with half the POCACITO board — they are actively helping get Hromada going
- **Next step:** Draft the Fiscal Sponsorship Agreement (FSA), then finalize with POCACITO and an attorney
- Bank details (routing, account, SWIFT) available from POCACITO immediately upon FSA signing
- See: [[specs/fiscal-sponsorship]]

---

## Milestone 1: Production-Ready Foundation

**Status:** ~70% complete
**Goal:** Harden the existing platform for reliable production use.

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

### What Remains
- [ ] Fix session token vulnerability (base64 → crypto.randomBytes) #p0 @sloan
- [ ] Remove default password fallback in `/api/admin/verify` #p0 @sloan
- [ ] Add rate limiting to public file upload endpoint #p1
- [ ] Add `Cache-Control` headers to public API routes #p1
- [ ] Replace native `<img>` with Next.js `<Image>` component #p1
- [ ] Implement viewport-based map loading (won't scale past ~100 projects) #p1
- [ ] Mobile map view (currently shows "coming soon") #p1
- [ ] Decompose 754-line homepage into components #p2

---

## Milestone 1.5: Fiscal Sponsorship Agreement (Active — Critical Path)

**Status:** Verbal agreement secured, FSA drafting in progress
**Goal:** Formalize the legal relationship with POCACITO Network so funds can flow.
**See:** [[specs/fiscal-sponsorship]]

### What's Done
- [x] POCACITO verbal agreement to sponsor Hromada at 0% fee
- [x] Board relationships established (Tom)

### What Remains
- [ ] Research FSA models, templates, and standard language #p0 @sloan
- [ ] Draft Fiscal Sponsorship Agreement #p0 @sloan @tom
- [ ] Review draft with POCACITO #p0 @tom
- [ ] Attorney review and finalization #p0 @tom
- [ ] Sign FSA #p0
- [ ] Obtain real bank details from POCACITO (routing, account, SWIFT) #p0 @sloan

> **This milestone unblocks Milestone 2.** Without a signed FSA, the platform cannot accept donations.

---

## Milestone 2: Payment Processing (Active)

**Status:** In progress — `v2-payment-processing` branch
**Goal:** Enable donors to contribute directly through the platform.
**See:** [[specs/payment-processing]]

### What's Done
- [x] Donation database model (statuses: PENDING → RECEIVED → ALLOCATED → FORWARDED → COMPLETED)
- [x] Support Project Card with payment instructions (Wire, DAF, Check)
- [x] "I've Sent My Contribution" confirmation flow with auto donor account creation
- [x] Donor dashboard (`/donor`) — view donations, status timeline, updates
- [x] Nonprofit Manager dashboard (`/nonprofit`) — mark received, manage wire transfers
- [x] Welcome email to new donors via Resend
- [x] WireTransfer model for outbound transfers to Ukraine
- [x] Fee comparison display (Wise vs Bank Wire)
- [x] POCACITO Network fiscal sponsor branding throughout

### What Remains
- [ ] Replace placeholder bank details with real POCACITO account info #p0 @sloan
- [ ] Plaid integration for automatic payment detection #p1
- [ ] Wise API integration for outbound transfer tracking #p1
- [ ] Connect nonprofit dashboard to real APIs (currently mock data) #p1
- [ ] Donor password reset flow #p2
- [ ] Receipt/tax documentation generation #p2
- [ ] Email notifications for donation status changes #p2

---

## Milestone 3: Municipal Partnership Program (Started)

**Status:** Early — landing page live
**Goal:** Connect US communities with Ukrainian sister cities for direct support.

### What's Done
- [x] Partnership landing page (`/partner-with-us`)
- [x] Partnership inquiry form with email notifications
- [x] PartnershipInquiry database model

### What Remains
- [ ] Partnership matching system (US city ↔ Ukrainian hromada)
- [ ] Partner onboarding workflow
- [ ] Joint project creation between partner communities
- [ ] Partnership progress tracking and reporting
- [ ] Case studies and success stories

---

## Milestone 4: Donor Experience

**Goal:** Make it compelling and easy for donors to find and support projects.

- [ ] Enhanced project search and filtering (already partially built)
- [ ] Donor profiles with giving history and impact summary
- [ ] Project update notifications (email + in-app)
- [ ] Impact reporting with progress photos and before/after
- [ ] Social sharing for projects
- [ ] Recurring donation support
- [ ] Donation matching campaigns

---

## Milestone 5: Municipal Tools

**Goal:** Empower Ukrainian municipalities to manage their projects effectively.

- [ ] Municipal dashboard for project management
- [ ] Progress reporting tools with photo evidence
- [ ] Budget tracking and transparency reports
- [ ] Automated status updates to donors
- [ ] Multi-project management for larger hromadas

---

## Milestone 6: Scale and Trust

**Goal:** Build the infrastructure for growth and donor confidence.

- [ ] Third-party verification system for municipalities
- [ ] Candid/GuideStar integration (already Platinum seal)
- [ ] Multi-language expansion beyond EN/UK
- [ ] Analytics and impact metrics dashboard
- [ ] API for partner integrations
- [ ] CI/CD pipeline with automated testing
- [ ] Error monitoring (Sentry)
- [ ] Staging environment
