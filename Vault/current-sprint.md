# Current Sprint

**Sprint:** 2026-02-10 → 2026-02-24
**Focus:** FSA drafting + payment processing v2 + security hardening

---

## In Progress

- [/] Payment processing integration — real bank details, Plaid/Wise APIs #p0 @sloan
- [/] Municipal Partnership Program — landing page and inquiry flow #p1 @tom
- [/] FSA drafting — research templates, draft agreement for POCACITO review #p0 @sloan @tom

## To Do

### FSA / Legal (Critical Path)
- [ ] Research FSA models, templates, and standard legal language #p0 @sloan
- [ ] Draft Fiscal Sponsorship Agreement (first draft for POCACITO + attorney review) #p0 @sloan @tom
- [ ] Review FSA draft with POCACITO board #p0 @tom
- [ ] Attorney review and finalization of FSA #p0 @tom
- [ ] Obtain real bank details from POCACITO post-signing #p0 @sloan

### Payment / Security
- [ ] Replace placeholder bank details with real POCACITO account info (blocked by FSA) #p0 @sloan
- [ ] Fix session token vulnerability — replace base64 encoding with crypto.randomBytes #p0 @sloan
- [x] Remove default password fallback in `/api/admin/verify` #p0 @sloan
- [ ] Connect nonprofit dashboard to real APIs (currently mock data) #p1 @sloan
- [ ] Add rate limiting to public file upload endpoint #p1
- [x] Donor password reset flow #p2
- [ ] Receipt generation for completed donations #p2

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

- Payment processing is the primary deliverable — all other work is secondary
- Tom landed the Municipal Partnership Program (page, form, API, DB model) — needs review
- Security fixes (#p0) must be done before any public launch
- Photo migration to Supabase Storage is complete (381b98c)
- Nonprofit dashboard exists but uses mock data — needs real API connections
- Placeholder bank details still in SupportProjectCard — needs real POCACITO info before launch
