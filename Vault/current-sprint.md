# Current Sprint

**Sprint:** 2026-03-03 → 2026-03-17
**Focus:** Email system hardening, partner submission flow, launch readiness

---

## In Progress

- [/] FSA submission to POCACITO — attorney-reviewed, awaiting board Mar 27 #p0 @tom
- [x] Partner MoUs — legal review complete, shared with Kostia + Natalia, sent to their boards + Max/Brendan for review #p1 @tom
- [x] Donor project timeline page — full progress view for funded projects #p1 @tom
- [x] 1-pager for Scott Sklar — completed in Figma, Mar 8 #p0 @tom
- [/] 2-pager explainer handout (Figma) #p1 @tom
- [/] 6-pager detailed explainer (Figma) #p1 @tom
- [/] Ecoaction project docs in repo (Lychkove + Samar) — needs Sloan review and partner submission #p1 @sloan
- [x] S3 document upload pipeline — staging→production flow for partner PDF submissions #p1 @tom
- [x] IDP boolean field + filter toggle — replaced IDP_HOUSING enum with isIDP boolean on Project model, added IDP Community filter chip on projects browse page #p1 @tom
- [x] Add 12 Ecoaction Tier 2 projects with cropped photos (no docs yet) #p1 @tom
- [x] Admin dashboard — Partner column in projects table #p2 @tom
- [x] MapTiler vector tiles with Ukrainian labels — MapLibre GL inside Leaflet container, parallel flyTo sync, cluster click handling, OSM fallback #p1 @tom
- [x] CSP worker-src for MapLibre GL web workers #p2 @tom
- [ ] Ask Kostia for original photos to replace Canva crops #p2 @tom

## To Do

### FSA / Legal (Critical Path)
- [/] POCACITO board review and signing #p0 @tom
- [ ] Obtain real bank details from POCACITO post-signing #p0 @tom
- [ ] Replace placeholder bank details in SupportProjectCard #p0 @tom

### Emails
- [ ] Test remaining emails once payment flow is live (#3, #4, #8) #p1 @tom
- [ ] Test project lifecycle emails (#12, #13, #15) when events occur #p2 @tom
- [ ] Request SES production access (exit sandbox) before launch #p1 @tom

### Donor Experience
- [x] Connect nonprofit dashboard to real APIs — already wired to Prisma (donations/list, wire-transfers/list, donations/[id]/status) #p1 @tom
- [x] Refine donor project timeline page — photos, status badges, richer timeline #p1 @tom

### Technical
- [ ] Test full donation flow end-to-end with real bank details #p1 @tom
- [x] Move EventBridge cron target back to hromadaproject.org — already pointing there, both domains serve same branch #p1 @tom

### Soft Launch Prep (March 18)
- [ ] Create LinkedIn company page #p0 @tom
- [ ] Draft launch post — announce Hromada + mission + first partner Ecoaction + first batch of projects (one combined post) #p0 @tom
- [ ] Draft press release for soft launch — Shank to review and circulate #p1 @tom
- [x] Remove site password for open access #p0 @tom
- [x] Hide/disable donation flow — SupportProjectCard stripped to Calendly CTA only #p0 @tom
- [x] Remove POCACITO/FSA references — footer, about page, How It Works, privacy policy #p1 @tom
- [x] Hide Ecoclub/Greenpeace partners — carousel, about, case study, project detail #p1 @tom
- [x] Remove transparency page and nav link #p1 @tom
- [x] Remove submit-project page and links #p1 @tom
- [x] Update How It Works step 4 and promise badge for directory mode #p1 @tom
- [x] Clean up privacy policy — remove Plaid/Wise, POCACITO fiscal sponsor section #p1 @tom
- [x] Merge v2-payment-processing into directory-mode (152 files, clean merge) #p0 @tom
- [ ] Remove SITE_PASSWORD env var from Amplify (via console, NOT CLI) #p0 @tom
- [ ] Request SES production access (exit sandbox) before launch #p1 @tom
- [ ] Send logo usage courtesy emails to press outlets (Böll, Stimson, Euromaidan, WaPo, NBC) #p2 @tom

### One-Pager Revisions (Shank feedback)
- [ ] Subheader: change "From Ukrainian communities to American donors" → "Rebuilding Ukraine's communities, together" (less transactional, center communities not donors) #p1 @tom
- [ ] Energy Security bullet: change "Hard security: hospitals and schools that run during blackouts and grid attacks" → "Energy independence: hospitals and schools that stay powered when the grid goes down" (less political, still motivational) #p1 @tom

### Partner Onboarding
- [ ] Send Natalia project intake template or form — she needs a good way to enter project info #p1 @tom ← **Tuesday Mar 10**
- [ ] Set up Calendly collective event types per partner — each project's "Schedule a Call" links to a collective event checking both Tom's calendar and the partner contact's calendar (Kostia for Ecoaction, Natalia for Ecoclub, Polina for Greenpeace). Partners need free Calendly accounts connected to their personal calendars. Code change: map project's partnerOrganization → partner-specific Calendly URL. #p1 @tom

### Partnerships & Outreach
- [x] EcoAction Ukraine MoU — reviewed with Kostia, sent to board #p1 @tom
- [x] Ecoclub Rivne MoU — reviewed with Natalia, sent to board #p1 @tom
- [x] Greenpeace Ukraine — call Mar 12 with Polina Kolodiazhna, Illia Kuksenko, Marine Abramian. Shared one-pager, MoU draft, EOPA link. Confirmation expected by end of next week. All signs positive — Polina is for it. #p1 @tom
- [ ] EOPA partnership — evaluate, schedule joint call #p2 @tom
- [x] Michael Shank meeting — Tuesday Mar 11. Wants to intro FCNL head post-soft-launch, circulate press release, get Dear Colleague letter from Doggett to other members #p1 @tom
- [ ] Draft press release for soft launch — Shank to circulate #p1 @tom
- [ ] Shank intro to FCNL head — after soft launch #p1 @tom
- [ ] Dear Colleague letter from Lloyd Doggett — Shank to help coordinate #p1 @tom
- [ ] Scott Sklar conference call — needs 1-pager first #p1 @tom

## Done

### This Sprint (Mar 3–17)
- [x] Hide Municipal Partnership Program from header nav for directory mode #p1 @tom
- [x] CTA button: "How It Works" → "About Us" at bottom of homepage #p2 @tom
- [x] MapLibre GL projection fix — `as any` cast for constructor, `setProjection()` broke map sync #p1 @tom
- [x] Test coverage boost to 75% — 20 new suites, 394 new tests, 4 broken tests fixed #p1 @tom
- [x] Map fix: 2D Mercator projection + minZoom/maxBounds/worldCopyJump #p1 @tom
- [x] MoU legal review — 5-domain panel, 15 recommendations implemented in both MoUs #p1 @tom
- [x] MoU revisions per Tom+Sloan feedback — "promptly" defined, response time 14→7 days, screening timing for post-procurement contractors #p1 @tom
- [x] FSA amendments documented in Vault/specs/fiscal-sponsorship.md — 4 items for Mar 27 board meeting #p1 @tom
- [x] Sloan IAM permissions — `Hromada-iam-scoped` policy (create/manage hromada-* roles), dev-delete exception in `Hromada-no-delete` #p1 @tom
- [x] Partner project CSV template — bilingual headers, for bulk project intake #p2 @tom
- [x] Doc analyzer Lambda pipeline — confirmed fully deployed (S3 buckets, Lambda, trigger all live) #p1 @sloan
- [x] Email system fully operational — 10/10 testable emails confirmed working in production #p0 @tom
- [x] SES credentials for Amplify compute — created IAM user `hromada-ses-sender` with explicit credentials #p0 @tom
- [x] Fix SES credentials in `ses.ts` (campaign sender) — same Amplify credential issue #p1 @tom
- [x] Fix partner submission emails (#9, #10) — added missing email calls to partner route #p1 @tom
- [x] Fix email recipient — approval/rejection emails now go to partner account, not project contact #p1 @tom
- [x] Fix fire-and-forget emails on Amplify — added `await` so Lambda doesn't tear down before send #p1 @tom
- [x] Fix ADMIN_EMAIL — changed from placeholder `admin@example.com` to real address #p1 @tom
- [x] Fix newsletter double-logo — removed double `emailLayout` wrapping in campaign sender #p2 @tom
- [x] MapTiler vector tiles with Ukrainian labels via MapLibre GL — custom map style, parallel flyTo sync, fadeDuration: 0, cluster click handling #p1 @tom
- [x] CSP update — added worker-src 'self' blob: for MapLibre GL web workers #p2 @tom
- [x] WCAG color contrast fixes — 26 failures fixed across public + admin pages (navy/gray/category colors darkened) #p2 @tom
- [x] Screen reader accessibility pass — `<main>` landmarks, `<h1>` on all pages, `scope="col"` on tables, `aria-expanded` on FAQ, `role="alert"` on errors, heading hierarchy fixes #p2 @tom
- [x] Keyboard navigation for Leaflet map — `role="region"`, `aria-label`, `keyboard={true}` #p2 @tom
- [x] Skip-to-content navigation link — locale-aware, visually hidden until focused #p2 @tom
- [x] ARIA labels on form elements — Input/Textarea auto-add `aria-invalid` + `aria-describedby`, EmailCaptureForm labeled #p2 @tom
- [x] Cofinancing percentage slider on partner submission form — 0-100% range with calculated dollar amount #p2 @tom
- [x] Partner org multi-select checkboxes — replace free-text input with Ecoaction/Ecoclub Rivne/Greenpeace Ukraine checkboxes + Other #p2 @tom
- [x] Prisma enum sync — added BATTERY_STORAGE and THERMO_MODERNIZATION to ProjectType #p1 @tom
- [x] PROJECT_TYPE_CONFIG — added WATER_TREATMENT and GENERAL entries #p1 @tom
- [x] Safe projectType validation in approval flow — fallback to null for unknown types #p1 @tom
- [x] EventBridge cron target updated to demo subdomain for v2 branch testing #p2 @tom
- [x] Amplify build fix — `--webpack` flag, OOM protection, font/Buffer fixes #p0 @sloan
- [x] Admin newsletter compose page — write, preview, send to subscribers #p2 @tom

### Previous Sprints
- [x] Tax receipt PDF generator — @react-pdf/renderer, IRS-compliant, integrated with donation FORWARDED flow #p0 @tom
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

- **Soft launch: Wednesday March 18, 10am ET** — matchmaking directory mode, no FSA/POCACITO references, no donation flow. Ecoaction listed as first official partner. LinkedIn page + first post at launch.
- **FSA signing target: March 28** — POCACITO board meets March 27, signing expected next day. **Board is 50/50** per Brendan — 4 members, unanimous required. Brendan + Max pro-Hromada. Felicia (CU Boulder) likely yes. Alexx Baerwald Simard (Johns Hopkins) is the holdout — averse to conflict-adjacent work.
- **All three partners confirmed** (EcoAction, Ecoclub Rivne, Greenpeace UA). MoUs verbally reviewed with Kostia and Natalia, passed to their boards. MoU signing not urgent — FSA is the real blocker.
- **Natalia** in group chat, sending headshot + gathering projects next week.
- **Scott Sklar** interested — needs 1-pager and conference call to present to his network.
- **Michael Shank** officially advising Hromada as of Mar 10. Added to Signal. Will intro Tom to FCNL head after soft launch, looking at RMI. Wants press release for soft launch. Thinks May 20 should be policy-oriented.
- **EOPA partnership** under evaluation — Max intro'd, good donor network, centrist positioning, AI impact modeling tool (Aug).
- **May 20 event** — Cannon Building Room 340 (morning). Max booked. Lloyd Doggett + Kostia speaking, Natalia attending, Ukrainian mayors, hopefully Svitlana Romanko, Clarence Edwards, Romina Bandura.
- **Sloan IAM** — added `Hromada-iam-scoped` (create/manage `hromada-*` roles) and dev-delete exception to `Hromada-no-delete`.
- **Email system fully operational** — 10/10 testable emails confirmed working (Mar 4)
  - Tested: #1 (password reset), #5 (newsletter welcome), #6 (Calendly welcome), #7 (partnership inquiry), #9 (submission to admin), #10 (submission confirmation), #11 (project approval), #14 (project rejection), #16 (newsletter campaign)
  - Remaining: #3, #4, #8 (need payment flow), #12, #13, #15 (need specific events)
  - SES is in sandbox mode — must request production access before full launch
- Partner submission → approval → live project flow tested end-to-end
- Calendly cron confirmed working via EventBridge (currently targeting demo subdomain)
- Prozorro integration complete: tender link → ProjectUpdate → donor email → daily polling

## Launch Strategy

### Phase 1: Soft Launch — Wednesday March 18, 10am ET
Matchmaking directory only. No payment processing, no donation flow, no FSA/POCACITO references. Ecoaction listed as first official partner.

**LinkedIn rollout (sequential posts, showing momentum):**
1. **Launch post** — Announce Hromada and mission. First batch of projects on the site with first official partner, Ecoaction (brief description of Ecoaction and Kostia).
2. **Ecoclub Rivne post** — When Natalia is ready: second partner announcement + new batch of projects.
3. **Greenpeace Ukraine post** — Third partner announcement + new batch of projects.

**Press release** around launch — Shank to review and circulate to actual press.

### Phase 2: FSA Announcement — ~End of March
- POCACITO board meets March 27, signing expected March 28.
- Post: "Fiscal sponsor secured, payment processing coming soon!"

### Phase 3: Payment Processing Live
- Merge `v2-payment-processing` branch with real bank details.
- Post: donation flow is live, projects can now be funded.

### Phase 4: Ongoing Cadence
- May 20 Cannon Building event announcement (and possibly an April event before then)
- Newsletter first edition
- Announcements of projects funded and projects built
- Event announcements

## Blockers

| Blocker | Owner | Status |
|---------|-------|--------|
| FSA signing | @tom | POCACITO board meets Mar 27, signing ~Mar 28 |
| Real bank details | @tom | Blocked by FSA — available immediately upon signing |
| NGO partner MoUs | @tom | Verbally reviewed, at partner boards + Max/Brendan. Not urgent pre-FSA. |
| 1-pager for Sklar | @tom | ✅ Completed Mar 8 |
| May 20 event prep | @tom @max | Cannon Building booked. Need speaker confirmations, invites, materials. |
| SES production access | @tom | Must exit sandbox before full launch |
