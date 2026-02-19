# Current Sprint

**Sprint:** 2026-02-10 → 2026-02-24
**Focus:** FSA finalization + launch readiness

---

## In Progress

- [/] FSA submission to POCACITO — attorney-reviewed, sending Feb 20 #p0 @tom
- [/] Partner MoU with EcoAction — template done, finalizing #p1 @tom
- [/] Messaging framework — donor personas, key messages #p1 @tom

## To Do

### FSA / Legal (Critical Path) — NEARLY DONE
- [x] Research FSA models, templates, and standard legal language #p0 @sloan
- [x] Draft Fiscal Sponsorship Agreement #p0 @sloan @tom
- [x] Attorney review and finalization of FSA #p0 @tom ← Feb 19
- [ ] Send FSA to POCACITO board for review #p0 @tom ← **Feb 20**
- [ ] POCACITO board approval and signing #p0 @tom
- [ ] Obtain real bank details from POCACITO post-signing #p0 @sloan
- [ ] Replace placeholder bank details in SupportProjectCard #p0 @sloan

### Partnerships & Outreach
- [x] Draft Partner MoU template #p1 @tom
- [ ] EcoAction Ukraine MoU — finalize and sign #p1 @tom
- [ ] Launch messaging framework (value prop, donor personas) #p1 @tom
- [ ] Launch announcement draft (press release, social) #p2 @tom

### Technical (Blocked by FSA)
- [ ] Connect nonprofit dashboard to real APIs (currently mock data) #p1 @sloan
- [ ] Test full donation flow end-to-end with real bank details #p1 @sloan
- [ ] Set production environment variables in Amplify #p1 @sloan
- [ ] Receipt generation for completed donations #p2 @sloan

### Security ✅ COMPLETE
- [x] Fix session token vulnerability — JWT (jose/HS256) with SESSION_SECRET #p0 @sloan
- [x] Remove default password fallback in `/api/admin/verify` #p0 @sloan
- [x] Move site password to SITE_PASSWORD env var #p0 @sloan
- [x] Set httpOnly: true on site access cookie #p0 @sloan
- [x] Rate limiting on all public endpoints #p1 @sloan
- [x] CSRF protection — Origin header verification in middleware #p2 @sloan
- [x] Content Security Policy + security headers #p2 @sloan
- [x] Zod validation on all public API routes #p2 @sloan
- [x] Sentry error monitoring (production-only) #p2 @sloan
- [x] Input sanitization in email templates #p1 @sloan

## Done

- [x] Migrate translation engine from Google Cloud to DeepL API #p1 @sloan
- [x] Batch translate all 66 projects to Ukrainian via DeepL #p1 @sloan
- [x] Internationalize SupportProjectCard (~40 hardcoded strings → locale keys) #p1 @sloan
- [x] Add full Ukrainian locale for support namespace (en.json + uk.json) #p1 @sloan
- [x] Document upload/display system — Prisma model, Supabase storage, PDF text extraction, auto-translation #p1 @sloan
- [x] Admin "Translate All" button and batch translation endpoint #p2 @sloan
- [x] Homepage "See It Happen" — replace Kharkiv placeholder with School #7 / NGO Ecoaction partner showcase #p1 @sloan
- [x] Partner logo background-matching rule added to CLAUDE.md #p3 @sloan
- [x] Remove default password fallback in `/api/admin/verify` #p0 @sloan
- [x] OFAC sanctions compliance policy page (`/ofac-policy`) #p1 @sloan
- [x] Decompose homepage into smaller components #p2 @sloan
- [x] Fix partner logo backgrounds on project detail page #p2 @sloan
- [x] Fix pdf-parse ESM import build failure #p1 @sloan
- [x] Fix favicon consistency between branches #p2 @sloan
- [x] Municipal Partnership Program page and inquiry form #p1 @tom
- [x] Partnership inquiry API route with email notifications #p1 @tom
- [x] PartnershipInquiry database model #p1 @tom
- [x] Donation confirmation flow with auto donor account creation #p0 @sloan
- [x] Donor dashboard with status timeline #p1 @sloan
- [x] Nonprofit Manager dashboard with wire transfer management #p1 @sloan
- [x] Welcome email integration via Resend #p2 @sloan
- [x] Migrate photos from local to Supabase Storage #p1 @sloan
- [x] Correct Candid seal level to Platinum #p2 @sloan
- [x] Replace CSBE with POCACITO Network as fiscal sponsor #p1 @sloan
- [x] Consolidate how-it-works into homepage and unify cream theme #p2 @sloan
- [x] Restore improved project detail page and support card #p2 @sloan
- [x] Set up Obsidian planning vault #p2 @sloan

---

## Sprint Notes

- **FSA is the only blocker to launch** — all security work is complete
- FSA was attorney-reviewed Feb 19, sending to POCACITO Feb 20
- Partner MoU template is ready, EcoAction agreement in progress
- Security hardening complete: JWT auth, rate limiting, sanitization, Sentry
- Transparency page with TI Ukraine pre-screening criteria added
- Mobile map view now working (was previously "coming soon")
- Nonprofit dashboard exists but uses mock data — needs real API connections post-FSA
- Placeholder bank details still in SupportProjectCard — needs real POCACITO info

## Blockers

| Blocker | Owner | Status |
|---------|-------|--------|
| FSA signing | @tom | Attorney reviewed, sending to POCACITO Feb 20 |
| Real bank details | @sloan | Blocked by FSA |
| EcoAction MoU | @tom | Template ready, finalizing |
