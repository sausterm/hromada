# Current Sprint

**Sprint:** 2026-02-24 → 2026-03-10
**Focus:** Donor experience + payment processing pipeline

---

## In Progress

- [/] FSA submission to POCACITO — attorney-reviewed, awaiting board #p0 @tom
- [/] Partner MoU with EcoAction — template done, finalizing #p1 @tom
- [/] Donor project timeline page — full progress view for funded projects #p1 @sloan
- [/] 2-pager explainer handout (Figma) #p1 @tom
- [/] 6-pager detailed explainer (Figma) #p1 @tom
- [/] Email system — design and curate donor lifecycle emails #p2 @sloan

## To Do

### FSA / Legal (Critical Path)
- [/] POCACITO board review and signing #p0 @tom
- [ ] Obtain real bank details from POCACITO post-signing #p0 @sloan
- [ ] Replace placeholder bank details in SupportProjectCard #p0 @sloan

### Emails (Launch-Critical)
- [ ] Mailing list welcome email (Calendly signup / newsletter) #p0 @sloan
- [ ] Donation submitted confirmation email #p0 @sloan
- [ ] Donation received by POCACITO email #p1 @sloan
- [ ] Donation forwarded email + tax receipt PDF attachment #p0 @sloan
- [ ] Project update notification email (triggered by partner updates) #p1 @sloan
- [ ] Project completed / connected to grid email #p1 @sloan

### Donor Experience
- [ ] Receipt/tax documentation generation (PDF) — plan approved #p0 @sloan
- [ ] Connect nonprofit dashboard to real APIs (currently mock data) #p1 @sloan
- [ ] Refine donor project timeline page — photos, status badges, richer timeline #p1 @sloan

### Technical
- [ ] Test full donation flow end-to-end with real bank details #p1 @sloan
- [ ] Set production environment variables in Amplify #p1 @sloan

### Partnerships & Outreach
- [ ] EcoAction Ukraine MoU — finalize and sign #p1 @tom

## Done

- [x] Horenka Hospital case study — replace fake School #7 data with real partner project #p1 @sloan
- [x] Media carousel — WaPo, Politico, NBC, Euronews, Stimson, Mother Jones, Böll #p1 @sloan
- [x] Featured projects mobile carousel with snap dots #p2 @sloan
- [x] Partner carousel — section variant on homepage, footer on other pages #p2 @sloan
- [x] Fix partner carousel navigation bug (broken on client-side nav from homepage) #p1 @sloan
- [x] Homepage section spacing normalization #p2 @sloan
- [x] DocumentaryPhoto credit attribution (Greenpeace photo) #p3 @sloan
- [x] Calendly integration — scheduling + auto-add to mailing list #p1 @tom
- [x] Migrate translation engine from Google Cloud to DeepL API #p1 @sloan
- [x] Batch translate all 66 projects to Ukrainian via DeepL #p1 @sloan
- [x] Internationalize SupportProjectCard (~40 hardcoded strings → locale keys) #p1 @sloan
- [x] Add full Ukrainian locale for support namespace (en.json + uk.json) #p1 @sloan
- [x] Document upload/display system — Prisma model, Supabase storage, PDF text extraction, auto-translation #p1 @sloan
- [x] Admin "Translate All" button and batch translation endpoint #p2 @sloan
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
- [x] Welcome email integration via AWS SES #p2 @sloan
- [x] Migrate photos from local to Supabase Storage #p1 @sloan
- [x] Correct Candid seal level to Platinum #p2 @sloan
- [x] Replace CSBE with POCACITO Network as fiscal sponsor #p1 @sloan
- [x] Consolidate how-it-works into homepage and unify cream theme #p2 @sloan
- [x] Restore improved project detail page and support card #p2 @sloan
- [x] Set up Obsidian planning vault #p2 @sloan

---

## Sprint Notes

- **FSA is the only blocker to launch** — all security work is complete
- Horenka case study now uses real partner data (Ecoaction + Ecoclub + Greenpeace, €56K heat pump + solar)
- Media carousel adds credibility — 7 major outlets featuring partner work
- Calendly fully integrated with auto-mailing-list enrollment
- Tax receipt PDF plan approved — implementation ready when prioritized
- Prozorro integration complete: tender link → ProjectUpdate → donor email → daily polling

## Blockers

| Blocker | Owner | Status |
|---------|-------|--------|
| FSA signing | @tom | Awaiting POCACITO board |
| Real bank details | @sloan | Blocked by FSA |
| EcoAction MoU | @tom | Template ready, finalizing |
