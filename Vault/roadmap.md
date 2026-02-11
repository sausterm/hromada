# Hromada Roadmap

> Connecting American donors with Ukrainian municipalities for infrastructure rebuilding.

## Vision

A trusted, transparent platform where donors can discover Ukrainian community projects, contribute directly, and track real impact.

---

## Milestone 1: Production-Ready Foundation (Current)

**Goal:** Harden the existing platform for reliable production use.

### Security Hardening
- [ ] Fix session token vulnerability (base64 → crypto.randomBytes) #p0 @sloan
- [ ] Remove default password fallback in `/api/admin/verify` #p0 @sloan
- [ ] Add rate limiting to public file upload endpoint #p1

### Performance
- [ ] Add `Cache-Control` headers to public API routes #p1
- [ ] Replace native `<img>` with Next.js `<Image>` component #p1
- [ ] Implement viewport-based map loading (currently loads all projects) #p1
- [ ] Implement hybrid SSR/CSR for homepage #p2

### Accessibility
- [ ] Implement mobile map view (currently shows "coming soon") #p1
- [ ] Add skip-to-content navigation links #p2
- [ ] Add ARIA labels to all form elements #p2

### Code Quality
- [ ] Decompose 754-line homepage into components #p2
- [ ] Consolidate duplicate form components (InquiryForm / ContactForm) #p2
- [ ] Fix remaining TypeScript errors (3) #p3

---

## Milestone 2: Payment Processing (In Progress)

**Goal:** Enable donors to contribute directly through the platform.
**Branch:** `v2-payment-processing`

- [ ] Payment provider integration #p0 @sloan
- [ ] Donation flow UI #p0
- [ ] Receipt generation and tax documentation #p1
- [ ] Fiscal sponsor integration (POCACITO Network) #p1
- [ ] Donation tracking dashboard #p2

---

## Milestone 3: Donor Experience

**Goal:** Make it compelling and easy for donors to find and support projects.

- [ ] Project search and filtering
- [ ] Donor accounts and donation history
- [ ] Project update notifications
- [ ] Impact reporting and progress photos
- [ ] Social sharing for projects

---

## Milestone 4: Municipal Tools

**Goal:** Empower Ukrainian municipalities to manage their projects effectively.

- [ ] Municipal dashboard for project management
- [ ] Progress reporting tools
- [ ] Photo/document upload for updates
- [ ] Budget tracking and transparency reports

---

## Milestone 5: Scale and Trust

**Goal:** Build the infrastructure for growth and donor confidence.

- [ ] Verification system for municipalities
- [ ] Third-party audit integration
- [ ] Multi-language expansion beyond EN/UK
- [ ] Analytics and impact metrics dashboard
- [ ] API for partner integrations
