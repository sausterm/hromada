# Session Context

**Last updated:** 2026-03-11 (Tuesday)
**Branch:** `v2-payment-processing`

---

## Week of March 3-7 — Summary

### Partner Confirmations
- **All three partners confirmed:** EcoAction (Kostia), Ecoclub Rivne (Natalia), Greenpeace Ukraine (Polina)
- MoUs verbally reviewed with Kostia and Natalia — passed to their boards for confirmation
- Max and Brendan also reviewing MoUs over the next week
- MoU signing not urgent — FSA is the blocker for processing donations, and MoUs relate to project funding/oversight processes that come after
- Natalia added to group chat, sending headshot + beginning to gather projects next week
- Polina (Greenpeace UA) — Tom hasn't talked to her yet, call sometime next week

### Project Intake — Needs Work
- Need an efficient way to bulk-load projects at launch (not one-by-one through the dashboard form)
- CSV template created (`Partner_Project_Template.csv`) with bilingual headers — send to Natalia
- Dashboard form stays for ongoing submissions, but initial batch needs a bulk path
- **TODO:** Build the bulk upload script that reads the CSV and creates projects via API

### EOPA — Potential Partnership
- **Elected Officials to Protect America** (protectingamerica.net) — US NGO, bipartisan elected officials network
- Run an "Energy Security Marshall Plan" for Ukraine
- Building an AI tool to model energy security impacts of renewable projects (ready ~August)
- Intro via Max, who was on a call with them
- **Pros:** access to family offices and donors, national reach beyond DC, fairly aligned, centrist positioning (counterbalances POCACITO "hippie" perception), impact measurement data for outreach
- **Cons:** more militaristic framing — need to ensure no military use of data collected from our projects
- **Tom's thinking:** let them test their tool on Hromada for free, feature their logo, reciprocal linking, possible newsletter shoutout, formal partnership. Want to think about what to ask in return (money? free data use? dual-use data safeguards?)
- **Open question:** Do we need Ukrainian community consent for EOPA to analyze their project data? Tom thinks yes.
- **Next step:** Joint call, probably after their tool is further along

### Scott Sklar
- Finally got back to Max, interested in Hromada
- Doesn't know many donors directly but knows people who know donors
- Wants a conference call to present to his network
- **Needs a one-pager** — this is important and urgent. Back to Figma tomorrow (Sunday Mar 8)

### One-Pager Question — Partner Logos
- Can the one-pager include EcoAction, Ecoclub Rivne, and Greenpeace UA logos before MoUs are signed?
- Tom's view: partnerships are real and confirmed, logos are a major legitimacy signal
- **Decision needed:** Probably yes given verbal confirmations, but worth a quick heads-up to each partner

### Michael Shank — Tuesday Meeting
- Emerging as an interesting node in the network
- Potential first donor candidate
- Knows Kostia and Natalia personally, has visited their project sites
- Meeting Tuesday

### US Team Call (Friday Mar 6)
- Tom, Sloan, Max discussed EOPA partnership, Scott Sklar outreach, one-pager priorities

---

## What happened this session (technical)

### MoU Legal Review & Revisions
- Ran a five-domain legal panel review (nonprofit law, OFAC/sanctions, Ukrainian civil law, donor disclosure, international development due diligence)
- Implemented all 15 panel recommendations to both MoUs (EcoAction + Ecoclub Rivne)
- Key additions: partner vetting (new §4.0), signing authority + Exhibit A, SCC arbitration, bilingual execution, "reasonable due diligence" replacing "knowingly", updated territory language, screening timing split (known personnel before publication, contractors within 5 days of selection), audit rights, project suspension, cure periods, liability cap, AML/CTF provision
- Additional revisions per Tom+Sloan feedback: "promptly" → "5 business days" (§4.2b), response time 14→7 days (§4.3d), screening timing accounts for post-procurement contractor selection (§4.4e)
- Added relocated community clarification to §4.4(b) in both MoUs — communities displaced from occupied territory evaluated by current operating location
- MoU declared non-binding in §2
- Both MoUs are identical except partner name and signature block
- Kostia (EcoAction) has reviewed and is aligned
- Natalia (Ecoclub Rivne) fully on board, added to team group chat

### Natalia / Ecoclub Rivne Notes
- Some Ecoclub projects historically went through Ecoclub's bank account, not municipal accounts
- Natalia confirmed they can route through municipal accounts — Ecoclub will never touch Hromada funds
- Ecoclub uses an alternative procurement platform (not Prozorro) for some projects — Natalia will send details
- Some communities have relocated from occupied territories (e.g., registered in Donetsk but physically in government-controlled area)
- Intermediary disbursement language was added then reverted — both MoUs now have identical clean fund-flow (partners never touch money)

### FSA Amendments Documented
- Added "FSA Amendments Needed" section to `Vault/specs/fiscal-sponsorship.md`
- Four items for March 27 POCACITO board meeting:
  1. **Signing authority** (blocks MoU signing) — FSA §7 only authorizes disbursement requests, not partner MoUs. Need board resolution or FSA amendment.
  2. **Partner vetting obligation** — add to FSA §18
  3. **Donor refund/reallocation policy** — not addressed in FSA
  4. **Audit flow-through** — verbal confirmation sufficient

### Sloan IAM Permissions
- Identified gap: Sloan had PowerUserAccess (no IAM) + Hromada-no-delete (blanket deny on destructive ops)
- Created `Hromada-iam-scoped` policy: allows creating/managing IAM roles and policies prefixed with `hromada-*`, PassRole to any service
- Updated `Hromada-no-delete` to allow deletion of resources with "dev" in the name (Lambda functions, S3 objects/buckets, log groups, IAM roles/policies with `hromada-*dev*`)
- Uses ARN-based NotResource (not tags) to avoid untagged-resource escape hatch

### Doc Analyzer Lambda
- Sloan's handoff from `directory-mode` branch reviewed
- Lambda (`hromada-doc-analyzer`) is already fully deployed — function, S3 buckets, and trigger all exist
- Remaining work is app-side: Prisma model fields for analysis results, S3→DB sync, admin UI for verification scores

### Partner Project Template
- Created `Partner_Project_Template.csv` — bilingual (English/Ukrainian) headers for partners to submit projects in bulk
- One example row (Lychkove solar project)
- Designed for Natalia to fill out in Google Sheets

---

### Key Research Findings
- Bandura (CSIS, Jul 2025) called for exactly what Hromada is — "a matchmaking mechanism so willing cities and private financiers can find each other"
- GMF running Ukraine Cities Partnership, started with Korosten — aligned model
- IEA report recommends municipal-level distributed energy investment — Hromada is the funding channel
- Ecoclub Rivne (Natalia) has published piece on their municipal solar work
- RMI has Ukraine analysis hub + Ukrainian-born staffer Oleksiy Tatarenko (former energy ministry advisor) — potential intro
- RePower Ukraine (repowerua.org) — similar space, solar for hospitals
- GIZ funds some of the same projects our partners work on

### DC Network Building
- Think tanks: CSIS, AGI, ACG, GMF, NTI, Boell
- Clemens Helbach (German Embassy) interested
- Party foundations beyond Boell to activate
- RMI as technical credibility partner (ask Max for contacts)

---

## Week of March 10-11

### POCACITO Board Intel (from Brendan)
- **4 board members, decisions by consensus/unanimous**
- **Brendan O'Donnell** — founder, on board. Pro-Hromada.
- **Max Gruenig** — co-founder, on board. Pro-Hromada. Georgetown lecturer (env policy), formerly E3G senior fellow & Ecologic Institute USA president.
- **Alexx Baerwald Simard** — Practice Manager at Johns Hopkins Bloomberg Center for Government Excellence. 6 yrs helping municipal/nonprofit orgs. Raised $5M for Local Foods Distribution Center in Charlotte. LGBTQ+ community organizer. Uses they/them. **Least likely to approve** — averse to anything connected to violence/conflict.
- **Felicia Naranjo Martinez** — At CU Boulder, formerly Executive Director of Colorado EU Center of Excellence. Managed diverse foreign grant awards, worked with EU Commission Brussels. "The mom of the group" per Brendan.
- **Brendan estimates 50/50 on Hromada approval.** Needs unanimous consent. He thinks he has 3-1 with Alexx as the holdout. Key concern: Alexx doesn't want involvement in anything perceived as violent/conflict-adjacent.

### Michael Shank — Now Advising
- Officially advising Hromada (loosely defined, Mar 10)
- Added to Signal chat
- Will connect Tom to head of FCNL after soft launch
- Will look at RMI
- Wants press release for soft launch → actual press (he'll review)
- Thinks May 20 Cannon event should be policy oriented

### Technical — Mar 10-11
- **Test coverage boost: 57% → 75%** — 20 new test suites, 394 new tests, fixed 4 broken tests
- **Map fix:** Force 2D Mercator projection (globe mode broke marker positioning), added minZoom/maxBounds/worldCopyJump to prevent marker drift on zoom-out

## Open items

- [ ] POCACITO board resolution for MoU signing authority — March 27
- [ ] Fill in partner addresses in MoU §1 before signing
- [ ] Ukrainian-language versions of both MoUs (per new §7)
- [ ] Natalia to send details on alternative procurement platform
- [ ] Bulk upload script to read Partner_Project_Template.csv and create projects via API
- [ ] Greenpeace Ukraine — schedule call with Polina
- [ ] Prepare for 50/50 board vote — how to address Alexx's conflict-adjacency concern
