# Current Sprint

**Sprint:** 2026-02-24 → 2026-03-10
**Focus:** Donor experience + payment processing pipeline

---

## In Progress

- [/] FSA submission to POCACITO — attorney-reviewed, awaiting board #p0 @tom
- [/] Partner MoU with EcoAction — template done, finalizing #p1 @tom
- [/] Donor project timeline page — full progress view for funded projects #p1 @tom
- [/] 2-pager explainer handout (Figma) #p1 @tom
- [/] 6-pager detailed explainer (Figma) #p1 @tom
- [/] Email system — design and curate donor lifecycle emails #p2 @tom
- [x] Admin newsletter compose page — write, preview, send to subscribers #p2 @tom

## To Do

### FSA / Legal (Critical Path)
- [/] POCACITO board review and signing #p0 @tom
- [ ] Obtain real bank details from POCACITO post-signing #p0 @tom
- [ ] Replace placeholder bank details in SupportProjectCard #p0 @tom

### Emails (Launch-Critical)
Templates built, need review & testing:
- [ ] Review: Password reset email (#1) #p1 @tom
- [ ] Review: Contact/donor interest notification to admin (#2) #p1 @tom
- [ ] Review: Donor welcome email — credentials + project card + journey (#3) #p1 @tom
- [ ] Review: Donation notification to admin (#4) #p1 @tom
- [ ] Review: Newsletter welcome email (#5) #p1 @tom
- [ ] Review: Calendly booking welcome email (#6) #p1 @tom
- [ ] Review: Partnership inquiry notification to admin (#7) #p1 @tom
- [ ] Review: Donation forwarded email + tax receipt attachment (#8) #p0 @tom
- [ ] Review: Lightweight donation confirmation email (#9) #p1 @tom
- [ ] Review: Project submission notification to admin (#10) #p1 @tom
- [ ] Review: Project submission confirmation to submitter (#11) #p1 @tom
- [ ] Review: Project approval email to submitter (#12) #p1 @tom
- [ ] Review: Prozorro match notification to admin (#13) #p1 @tom
- [ ] Review: Project rejection email to submitter (#14) #p1 @tom
- [ ] Review: Project update email — Prozorro status → donor (#15) #p1 @tom
- [ ] Build: Project completed / connected to grid email (#16) #p1 @tom
- [ ] Build: Tax receipt PDF generator (needed by #8) #p0 @tom

### Donor Experience
- [ ] Receipt/tax documentation generation (PDF) — plan approved #p0 @tom
- [ ] Connect nonprofit dashboard to real APIs (currently mock data) #p1 @tom
- [ ] Refine donor project timeline page — photos, status badges, richer timeline #p1 @tom

### Technical
- [ ] Test full donation flow end-to-end with real bank details #p1 @tom
- [ ] Set production environment variables in Amplify #p1 @tom

### Partnerships & Outreach
- [ ] EcoAction Ukraine MoU — finalize and sign #p1 @tom

## Done

- [x] Admin newsletter compose — banner photo, featured projects (clickable, with metadata), stats, preview, draft/send #p2 @tom
- [x] Fix Supabase storage RLS — created policies for project-images and tax-receipts buckets #p1 @tom
- [x] Delete press release "project funded" email template (#17) — too risky pre-delivery #p2 @tom
- [x] Horenka Hospital case study — replace fake School #7 data with real partner project #p1 @tom
- [x] Media carousel — WaPo, Politico, NBC, Euronews, Stimson, Mother Jones, Böll #p1 @tom
- [x] Featured projects mobile carousel with snap dots #p2 @tom
- [x] Partner carousel — section variant on homepage, footer on other pages #p2 @tom
- [x] Fix partner carousel navigation bug (broken on client-side nav from homepage) #p1 @tom
- [x] Homepage section spacing normalization #p2 @tom
- [x] DocumentaryPhoto credit attribution (Greenpeace photo) #p3 @tom
- [x] Calendly integration — scheduling + auto-add to mailing list #p1 @tom
- [x] Migrate translation engine from Google Cloud to DeepL API #p1 @tom
- [x] Batch translate all 66 projects to Ukrainian via DeepL #p1 @tom
- [x] Internationalize SupportProjectCard (~40 hardcoded strings → locale keys) #p1 @tom
- [x] Add full Ukrainian locale for support namespace (en.json + uk.json) #p1 @tom
- [x] Document upload/display system — Prisma model, Supabase storage, PDF text extraction, auto-translation #p1 @tom
- [x] Admin "Translate All" button and batch translation endpoint #p2 @tom
- [x] Partner logo background-matching rule added to CLAUDE.md #p3 @tom
- [x] Remove default password fallback in `/api/admin/verify` #p0 @tom
- [x] OFAC sanctions compliance policy page (`/ofac-policy`) #p1 @tom
- [x] Decompose homepage into smaller components #p2 @tom
- [x] Fix partner logo backgrounds on project detail page #p2 @tom
- [x] Fix pdf-parse ESM import build failure #p1 @tom
- [x] Fix favicon consistency between branches #p2 @tom
- [x] Municipal Partnership Program page and inquiry form #p1 @tom
- [x] Partnership inquiry API route with email notifications #p1 @tom
- [x] PartnershipInquiry database model #p1 @tom
- [x] Donation confirmation flow with auto donor account creation #p0 @tom
- [x] Donor dashboard with status timeline #p1 @tom
- [x] Nonprofit Manager dashboard with wire transfer management #p1 @tom
- [x] Welcome email integration via AWS SES #p2 @tom
- [x] Migrate photos from local to Supabase Storage #p1 @tom
- [x] Correct Candid seal level to Platinum #p2 @tom
- [x] Replace CSBE with POCACITO Network as fiscal sponsor #p1 @tom
- [x] Consolidate how-it-works into homepage and unify cream theme #p2 @tom
- [x] Restore improved project detail page and support card #p2 @tom
- [x] Set up Obsidian planning vault #p2 @tom

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
| Real bank details | @tom | Blocked by FSA |
| EcoAction MoU | @tom | Template ready, finalizing |
