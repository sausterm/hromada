# Session Context - Payment Processing Implementation

**Date**: 2026-02-10
**Branch**: `v2-payment-processing`
**Status**: Core UI and database complete, homepage consolidated, fiscal sponsor updated, images migrated to Supabase

---

## Summary

Built the complete payment processing infrastructure for Hromada. Donors can support projects via Wire Transfer, DAF Grant, or Check. When they confirm a contribution, a donor account is auto-created and they can track their donation through a dashboard. Nonprofit managers have a separate dashboard to track incoming donations and outbound wire transfers to Ukraine.

---

## Payment Flow Architecture

### Current Flow (Manual Confirmation)
```
Donor → Views project → Clicks "Support This Project" →
Chooses payment method (Wire/DAF/Check) → Sees instructions →
Sends payment externally → Returns to site →
Clicks "I've Sent My Contribution" → Fills form →
Account auto-created → Welcome email sent →
Tracks donation in /donor dashboard
```

### Future Flow (With Plaid)
```
Donor → Enters email → Sends payment →
Plaid detects payment in BoA → Auto-matches to project →
Account auto-created → Receipt email with login →
Tracks donation in /donor dashboard
```

The manual "I've Sent My Contribution" step will be removed once Plaid is integrated.

---

## Money Flow

```
Donor sends funds
       ↓
Bank of America (POCACITO Network 501(c)(3) account)
       ↓
Plaid detects payment (future)
       ↓
Nonprofit Manager reviews in dashboard
       ↓
Initiates transfer via Wise or Bank Wire
(whichever has lower fees for the amount)
       ↓
Ukrainian municipal bank account
       ↓
Donor receives "Funds Delivered" update
```

---

## What Was Built

### 1. Support This Project Card
**File**: `src/components/projects/SupportProjectCard.tsx`
- Replaces "Express Interest" on project detail pages
- Shows estimated cost and co-financing info
- Three payment methods: Wire Transfer, DAF Grant, Check
- Each shows payment instructions with copy buttons
- "I've Sent My Contribution" confirmation form
- Success state with account creation messaging

### 2. Donation Confirmation API
**File**: `src/app/api/donations/confirm/route.ts`
- Validates donor input
- Checks if donor has existing account
- If new donor: creates DONOR account with temp password
- Creates Donation record in database
- Sends welcome email to new donors
- Sends notification to admin/nonprofit manager

### 3. Donor Dashboard
**File**: `src/app/[locale]/(public)/donor/page.tsx`
- Stats: total contributed, projects supported, pending, delivered
- List of donations with status badges
- Click donation to see update timeline
- Status progression: PENDING → RECEIVED → FORWARDED → COMPLETED
- Tax deduction information

### 4. Nonprofit Manager Dashboard
**File**: `src/app/[locale]/(public)/nonprofit/page.tsx`
- Overview tab with pending actions
- Donations tab with "Mark Received" functionality
- Wire Transfers tab with status tracking
- Fee comparison: Wise vs Bank Wire

### 5. Database Schema
**File**: `prisma/schema.prisma`

```prisma
enum UserRole {
  ADMIN
  PARTNER
  NONPROFIT_MANAGER
  DONOR  // NEW
}

model Donation {
  id, projectId, projectName
  donorUserId, donorName, donorEmail, donorOrganization
  amount, paymentMethod, referenceNumber
  status (PENDING_CONFIRMATION → RECEIVED → ALLOCATED → FORWARDED → COMPLETED)
  wireTransferId
  timestamps
}

model DonationUpdate {
  id, donationId, title, message, isPublic, createdAt
}

model WireTransfer {
  id, referenceNumber
  recipientName, recipientBankName, recipientBankSwift, recipientAccountIban
  amountUsd, status, projectId
  donations[] (linked)
  timestamps
}
```

### 6. Email Templates
**File**: `src/lib/email.ts`
- `sendDonorWelcomeEmail()` - Welcome with temp password, tracking info, next steps
- `sendDonationNotificationToAdmin()` - Alert with donation details, "NEW DONOR" badge

### 7. Auth Updates
**File**: `src/hooks/useAuth.ts`
- Added `isDonor()`, `isNonprofitManager()`, `getDashboardPath()`
- Login redirects to role-appropriate dashboard

---

## Role-Based Dashboards

| Role | Dashboard | Purpose |
|------|-----------|---------|
| ADMIN | `/admin` | Full system access, user management |
| PARTNER | `/partner` | Submit projects for approval |
| NONPROFIT_MANAGER | `/nonprofit` | Track donations, manage wire transfers |
| DONOR | `/donor` | Track personal donations and updates |

---

## Payment Methods Supported

| Method | Best For | How It Works |
|--------|----------|--------------|
| Wire Transfer | $10k+ | Donor wires to BoA, we provide routing/account |
| DAF Grant | Wealthy individuals | Donor recommends grant from their DAF to POCACITO Network |
| Check | Foundations | Donor mails check to POCACITO Network address |

Credit cards/Stripe intentionally not included - 3% fee is too high for large donations.

---

## Files Created/Modified

### New Files
- `src/components/projects/SupportProjectCard.tsx`
- `src/app/api/donations/confirm/route.ts`
- `src/app/[locale]/(public)/nonprofit/page.tsx`
- `src/app/[locale]/(public)/donor/page.tsx`

### Modified Files
- `prisma/schema.prisma` - Added Donation, DonationUpdate, WireTransfer, DONOR role
- `src/lib/email.ts` - Added donor welcome and admin notification emails
- `src/lib/security.ts` - Added donation/wire audit actions
- `src/hooks/useAuth.ts` - Added isDonor, isNonprofitManager, getDashboardPath
- `src/app/[locale]/(public)/login/page.tsx` - Updated redirect logic
- `src/app/[locale]/(public)/projects/[id]/page.tsx` - Replaced ContactForm with SupportProjectCard
- `locales/en.json` - Added donor and support translations

---

## Environment Variables Needed

```bash
# Already configured
RESEND_API_KEY=re_...        # For sending emails
ADMIN_EMAIL=admin@...        # Receives donation notifications

# Needed for production
# Real POCACITO Network bank details (currently placeholders in SupportProjectCard.tsx):
# - Bank of America routing number
# - Account number
# - SWIFT code
# - POCACITO Network EIN
# - Mailing address

# Future
PLAID_CLIENT_ID=...          # For bank transaction monitoring
PLAID_SECRET=...
WISE_API_KEY=...             # For outbound transfer tracking
```

---

## Next Steps

### Immediate
1. Replace placeholder bank details in `SupportProjectCard.tsx` with real POCACITO Network info
2. Test full flow: project page → support → confirm → check email → login to donor dashboard

### Short Term
3. Add Plaid integration for automatic payment detection
4. Remove manual "I've Sent My Contribution" step
5. Connect nonprofit dashboard to real API (currently using mock data)

### Medium Term
6. Add Wise API for outbound transfer tracking
7. Auto-update donation status when Wise confirms delivery
8. Add password reset flow for donors

---

## Business Context

- **Fiscal Sponsor**: POCACITO Network, 501(c)(3), EIN 99-0392258
- **Candid Profile**: Platinum Seal of Transparency — https://app.candid.org/profile/16026326/pocacito-network/
- **Website**: https://pocacito.org
- **Receiving Bank**: Bank of America
- **Outbound Transfers**: Wise (cheaper for most amounts) or Bank Wire (better for very large)
- **Target Donors**: Wealthy individuals, corporations, foundations
- **Destination**: Ukrainian municipal bank accounts for infrastructure projects

---

## Team

- Thomas Protzmann (Director)
- Kostiantyn Krynytskyi (Director - Ukraine, handles municipal bank details)
- Sloan Austermann (Director - Technology & Operations)

---

## Session 2026-02-10: Homepage Consolidation & Infrastructure Updates

### Homepage Changes (v2-payment-processing)
1. **Consolidated How It Works** into homepage — deleted standalone `/how-it-works` page
2. **Added case study section** (Kharkiv hospital with timeline and live stats card)
3. **Added photo strip** (scrolling completed projects, cream-100 background)
4. **Added FAQ section** (5 expandable questions with `<details>` elements)
5. **Updated final CTA** to cream background with two buttons (Browse Projects + Learn More)
6. **Removed Trust/Impact navy stripe** from homepage
7. **Removed How It Works** from hamburger menu navigation
8. **How It Works buttons**: Aligned with fixed width, earth tone colors matching map category colors (teal, sage, amber, terracotta, taupe)

### Fiscal Sponsor Update
- Changed from CSBE to **POCACITO Network** across entire codebase
- EIN: **99-0392258**
- Updated all references in: SupportProjectCard, email templates, donor dashboard, homepage FAQ, locale files, tests
- Contact email updated to `donations@pocacito.org`

### Footer Reorder
1. hromada is a project of POCACITO Network · Candid Platinum Seal of Transparency
2. About Us · Terms · Privacy · Contact
3. © 2026 Thomas D. Protzman. All rights reserved.
- Removed "Built for Ukraine" / geo restrictions line

### Image Migration to Supabase Storage
- Created `project-images` bucket in Supabase Storage (public)
- Uploaded 11 site photos to `site-photos/` folder
- Updated all image references from `/photos/` to Supabase CDN URLs
- Added `remotePatterns` to `next.config.ts` for `next/image` support
- Base URL: `https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/`
- Sloan (and any dev) can now see all images without local files

### About Page
- Added project categories section with map-matching icons and colors (from CATEGORY_CONFIG)
- Switched partner logos to cream background versions

### Other
- `planning/` folder renamed to `Vault/` (Obsidian-based planning hub added by Sloan)
- Site password: `hromada!2026`
- Admin login: use `HROMADA_ADMIN_SECRET` from `.env.local` as password

---

## Session 2026-02-10: Mobile Bug Fixes (main branch)

### Mobile Map Fix (applied to both branches)
Mobile map went through 3 iterations on homepage (`src/app/[locale]/(public)/page.tsx`):
1. **Z-index fix** — adjusted z-index so zoom controls weren't hidden by header
2. **Inline panel swap** — rendered map inline, but Leaflet rendered grey tiles (container started `display:none`)
3. **Conditional rendering (final)** — two separate `<MapWrapper>` instances: mobile conditionally rendered (`{isMobileMapOpen && ...}`), desktop always rendered (`hidden lg:block`). Removed CSS Leaflet control offset hack.

State split: `isDesktopMap` (window >= 1024px) + `isMobileMapOpen` (user toggle) → `isMapVisible` (combined).

### Card Flash Fix
Added `mapBoundsReported` state flag — starts `false`, set `true` on first `handleBoundsChange`. Cards show all projects until map fires first bounds event.

### Card Navigation Fix
- **Nested `<a>` hydration error** in `ProjectCard.tsx` — title renders as `<span>` when card is a `<Link>` (mobile), `<Link>` when card is a `<div>` (desktop)
- **NaN LatLng** in `UkraineMap.tsx` — Prisma Decimals need `Number()` conversion + `isNaN` guard
- **ProjectPopup import** — changed `next/link` to `@/i18n/navigation` Link for locale prefix

### Filter Dropdown Mobile Support
Added `toggleDropdown()` + `closeAllDropdowns()`, `onClick` handlers on all 5 dropdown buttons, `touchstart` outside listener.

### Hamburger Menu Fix
`Header.tsx` — added `onClick` toggle and `touchstart` outside listener.

### API Response Slimming
`src/app/api/projects/route.ts` — changed from `include: { photos }` to Prisma `select` with only summary fields.

### Login Page Password Toggle (both branches)
Added `showPassword` state with eye icon toggle. Committed on v2 (`811d631`), cherry-picked to main (`bf7e4fa`).

### i18n Completeness (v2)
- Converted hardcoded strings to `t()` calls in homepage and footer
- Added ~43 missing locale keys: `homepage.viewList`, `footer.fiscalSponsor/candidSeal/copyright`, `homepage.caseStudy.*`, `homepage.liveStats.*`, `homepage.photoStrip.*`, `homepage.faq.*`

---

## Session 2026-02-10: Homepage Expert Review & Improvements (v2 branch)

### Expert Panel Review
Conducted a 6-expert review of the homepage (UX/UI, Fundraising, Ukrainian Civic Tech, Copywriter, Climate/Energy, CRO). Key consensus findings:
1. The "100% goes to projects" model is the strongest asset but buried across the page
2. Page sections blur together — cream-100 background everywhere, no visual rhythm
3. Case study data appears fabricated even though it's real — needs verification labels
4. No social proof from the donor side (no testimonials, press logos, donor count)
5. Only one conversion path (Browse Projects) — no email capture, no micro-commitments

### Implemented Changes (commit `32cd180`)

**Hero section:**
- Made hero full-viewport: `h-[calc(100svh-64px)]` (was fixed 500/550px)
- Swapped hero image to ground-mounted solar array
- Rewrote headline: "When Russia cuts the power, hospitals go dark" (was "Power Ukrainian hospitals, schools & homes")
- Updated subheadline: "100% of your donation funds solar and battery systems that keep Ukrainian communities running."
- Replaced "Total kW" stat with "Communities" count (unique municipalities from project data)
- Added animated scroll-down chevron indicator at bottom of hero

**Trust badge:**
- Added POCACITO Network 501(c)(3) badge next to the "100% promise" in How It Works section
- Links to Candid profile, shows "501(c)(3) Fiscal Sponsor · POCACITO Network · Candid Platinum Seal"

**Final CTA rewrite:**
- Title: "Choose a project. Fund it. Watch it power on." (was "Ready to Make a Difference?")
- Subtitle: "Every project is verified, every dollar is tracked, and every system is monitored after installation."

**Email capture:**
- Added email signup below CTA buttons with divider "or stay in the loop"
- `EmailCaptureForm` component with success/error states
- New API route: `src/app/api/newsletter/route.ts` — rate-limited, sends notification to admin via Resend
- Full EN/UK locale keys for email form

**CSS:**
- Added `@keyframes scroll-hint` bounce animation and `.animate-scroll-hint` class in `globals.css`

### Files Changed
| File | Changes |
|------|---------|
| `src/app/[locale]/(public)/page.tsx` | Hero height, headline, stats, scroll indicator, trust badge, email capture form |
| `src/app/globals.css` | Scroll-hint animation keyframes |
| `src/app/api/newsletter/route.ts` | **New** — newsletter signup API route |
| `locales/en.json` | Hero headline/subheadline/stat, CTA rewrite, email capture keys |
| `locales/uk.json` | Same keys translated to Ukrainian |

### Expert Review Action Items NOT Yet Implemented
| # | Action | Impact |
|---|--------|--------|
| 1 | Alternate section backgrounds (bg-white for How It Works, FAQ) | High |
| 8 | Dedicated Trust/Social Proof section (100% model visual, Candid seal, partner logos, donor count) | Very High |
| 10 | Make case study data verifiable or label as example | High |
| 11 | Add funding progress indicators to project cards | High |
| 12 | Translate "Total kW" into impact metrics (hours of backup power, homes powered, CO2 avoided) | Medium |
| 13 | Add "How to Give" section or surface payment methods earlier | High |
| 14 | Connect LiveStatsCard to real API data | Medium |
| 15-20 | Donor testimonials, press logos, native UK review, carbon calculations, impact report, A/B testing | Various |

---

## Infrastructure Note: DNS Outage (2026-02-10)

All of `hromadaproject.org` went down (NXDOMAIN for all subdomains). Not caused by code changes — was a DNS/Cloudflare configuration issue. Sloan resolved it. Domain DNS is managed through Cloudflare.

---

## Architecture Notes

- **Leaflet + SSR:** Dynamically import with `ssr: false`. Hidden containers break tile rendering — use conditional mount/unmount.
- **Prisma Decimals:** Lat/lng come as `Decimal` type. Always wrap with `Number()` before passing to Leaflet.
- **i18n Links:** Use `import { Link } from '@/i18n/navigation'` (not `next/link`) for locale prefix.
- **Mobile touch:** Always add `onClick` (not just hover). Use `touchstart` for outside-click listeners.
- **Turbopack cache:** `rm -rf .next` if dev server crashes.
- **Branch switching:** Kill dev server first (`pkill -f "next dev"`), then switch, then `npm run dev`.

## Git Branch State

- **main**: Mobile bug fixes, about page cleanup, login password toggle (cherry-picked from v2)
- **v2-payment-processing**: All of main's fixes plus payment processing, MPP page, homepage redesign, i18n, expert review improvements, email capture
- When merging v2 into main, expect conflicts in: `globals.css`, `Header.tsx`, locale files, homepage component

## Design System

### Color Palette
- **Backgrounds**: `var(--cream-100)` (page bg), `var(--cream-200)`, `var(--cream-300)` (dividers)
- **Text**: `var(--navy-700)` (headings), `var(--navy-600)` (body), `var(--navy-500)` (secondary)
- **Accent**: `var(--ukraine-blue)` (#0057B8)
- **Category colors**: teal (#5B8FA8), sage (#7B9E6B), amber (#D4954A), terracotta (#C75B39), taupe (#8B7355)

### Page Layout (about, contact, partner-with-us)
- Container: `max-w-3xl mx-auto px-4 py-12`
- h1: `text-4xl font-bold`, h2: `text-3xl font-medium`
- Dividers: `<hr className="border-[var(--cream-300)] mb-12 w-24 mx-auto" />`

### Hamburger Menu Order
1. Projects → 2. About → 3. Municipal Partnership → 4. Contact → divider → 5. Dashboard/Login

---

## Session 2026-02-10: About Page Cleanup, Hero Copy, Mailing List, Animations (v2 branch)

### About Page Simplified
- Removed: How It Works section, FAQ section, Project Categories section
- Removed unused imports (`useState`, `useRef`, `useEffect`, FAQItem component)
- Remaining sections: Statement of Purpose, Our Partners, Trust Center, CTA buttons

### Hero Adjustments
- Made hero slightly taller: `h-[calc(100vh+2rem)]` to eliminate cream peek at bottom
- Hero copy still being iterated — current headline/subheadline under discussion
- Tried multiple rounds of expert-generated copy options; user wants headline to convey: empowering communities, resilience against Russian aggression, sustainable recovery, decentralizing grids
- Target audience is donors — copy should speak to them, not just describe the mission

### Hero Entrance Animations
- **Photo fade-in**: `hero-photo-animate` class — 1.2s fade from opacity 0 with subtle scale(1.05→1) zoom settle
- **Text stagger**: 5 elements cascade in with `hero-fade-up` animation (0.8s ease-out, 30px slide up)
  - Photo fades in first (0s delay)
  - Promise badge (0.4s), headline (0.55s), subheadline (0.7s), stats (0.85s), CTAs (1.0s)
- All CSS-only, defined in `globals.css`

### Newsletter / Mailing List System
- **Database**: `NewsletterSubscriber` model in Prisma — `id`, `email` (unique), `subscribedAt`, `unsubscribed` flag
- **Public API**: `src/app/api/newsletter/route.ts` — rate-limited, upserts subscriber, sends welcome email only to new/re-subscribers
- **Admin API**: `src/app/api/admin/subscribers/route.ts` — GET (list), POST (add), DELETE (remove). Auth-protected via `verifyAdminAuth`.
- **Admin dashboard**: New "Mailing List" tab — subscriber count badge, table with email/date/remove button, input to add subscribers manually
- **Welcome email**: `sendNewsletterWelcomeEmail()` in `src/lib/email.ts` — branded HTML email with "hromada" wordmark, cream card explaining the platform, "Browse Projects" CTA button, POCACITO footer
- **Note**: Resend `from` address currently uses `onboarding@resend.dev` (test address). To send to any email, need to verify `hromadaproject.org` domain in Resend (add DNS records in Cloudflare). Currently only delivers to the Resend account owner's email.

### Files Changed
| File | Changes |
|------|---------|
| `src/app/[locale]/(public)/about/page.tsx` | Removed How It Works, FAQ, Categories sections; cleaned imports |
| `src/app/[locale]/(public)/page.tsx` | Hero height tweak, hero photo animation class, text entrance animations |
| `src/app/globals.css` | `hero-photo-fade` keyframes, updated text animation delays (shifted later to let photo fade in first) |
| `prisma/schema.prisma` | Added `NewsletterSubscriber` model |
| `src/app/api/newsletter/route.ts` | Rewritten — saves to DB instead of emailing admin, sends welcome email |
| `src/app/api/admin/subscribers/route.ts` | **New** — admin CRUD for subscribers |
| `src/app/[locale]/admin/page.tsx` | Added "Mailing List" tab with subscriber table, add/remove functionality |
| `src/lib/email.ts` | Added `sendNewsletterWelcomeEmail()` with branded HTML template |

### Resend Email Setup TODO
To send emails to any address (not just Resend account owner):
1. Go to Resend dashboard → Domains → Add domain → `hromadaproject.org`
2. Add the MX, SPF, and DKIM records Resend provides to Cloudflare DNS
3. Once verified, change `from` in email.ts from `onboarding@resend.dev` to `updates@hromadaproject.org`

### Hero Copy — Still Needs Finalization
The headline/subheadline are still being iterated. Key requirements from the user:
- Must speak to donors (not just describe the mission)
- Should convey: community empowerment, resilience against Russian aggression, sustainable recovery, grid decentralization
- Must be concise (headline ≤7 words)
- The "Minimal transfer fees. No overhead. Maximum impact" badge is already above it — don't repeat financial messaging
- Previous attempts were too long or too generic

---

## Session 2026-02-10: Featured Projects, Hero Parallax, Favicon (v2 branch)

### Featured Projects Admin Management (commit `11abad1`)
- **Prisma schema**: Added `FeaturedProject` model — `projectId` (unique), `slot` (unique, 1-4), cascade delete on project removal. Reverse relation `featuredSlot` on Project model.
- **Admin API**: `src/app/api/admin/featured/route.ts` — GET (list with project names), PUT (atomic replace via `$transaction([deleteMany, ...creates])`). Auth via `verifyAdminAuth`.
- **Public API**: `src/app/api/projects/route.ts` — `?all=true` branch now also fetches `featuredProjectIds` (ordered by slot) via `Promise.all`.
- **Homepage**: `featuredProjectIds` state populated from API. `featuredProjects` memo prioritizes admin-selected projects in slot order, backfills remaining slots with newest projects.
- **Admin dashboard**: Collapsible "Featured Projects" panel inside projects tab. 4 numbered slot cards in a grid. Click "Assign" to open inline search/picker (filters existing projects, excludes already-featured). "X" to clear a slot. "Save" button persists via PUT.

### Hero Parallax Scroll Effect
- Added scroll handler that applies `translateY(scrollY * 0.4)` to the hero background image as user scrolls
- **Key fix**: Separated animation and parallax into two nested divs to avoid CSS `animation-fill-mode: forwards` blocking inline transform updates
  - Outer div (`heroImageRef`): handles parallax transform via JS, no animation, `top: -20%` / `bottom: -20%` for overflow room
  - Inner div: handles `hero-photo-animate` fade-in, `bg-cover bg-center`
- Removed `transform: scale()` from `hero-photo-fade` keyframes in `globals.css` — animation now only handles opacity

### Favicon & Header Logo Transparency
- **Header SVG** (`src/components/layout/Header.tsx`): Unified both transparent/non-transparent states to use a single SVG mask (`#panel-cutout`) that cuts out grid lines and junction dots. Fill color switches between `white` (transparent header) and `currentColor` (solid header). Grid lines are now transparent in both states.
- **Favicon PNG** (`src/app/icon.png`): Used PIL to make 5,414 cream grid line pixels fully transparent. 566 anti-aliased edge pixels given partial alpha with navy coloring for smooth edges. Cream circle background preserved.

### Files Changed
| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Added `FeaturedProject` model, `featuredSlot` relation on Project |
| `src/app/api/admin/featured/route.ts` | **New** — admin GET/PUT for featured project slots |
| `src/app/api/projects/route.ts` | Added `featuredProjectIds` to `?all=true` response |
| `src/app/[locale]/(public)/page.tsx` | Featured projects logic, hero parallax (nested divs + scroll handler) |
| `src/app/[locale]/admin/page.tsx` | Featured projects management UI (collapsible panel, slot cards, project picker) |
| `src/app/globals.css` | Removed transform from `hero-photo-fade` keyframes |
| `src/app/icon.png` | Grid lines between solar panels made transparent |
| `src/components/layout/Header.tsx` | Unified SVG to mask-based cutout for both header states |

### Technical Notes
- **Prisma client regeneration**: After schema changes, must run `npx prisma generate` + `rm -rf .next` + restart dev server. The generated client in `.prisma/client/` won't have new models until regenerated.
- **CSS animation vs inline transform**: `animation-fill-mode: forwards` can block inline `style.transform` updates even if the keyframes don't include `transform`. Solution: separate animated element from transform-controlled element.
- **`inset-0` vs individual positioning**: Tailwind's `inset-0` (generates `inset: 0px`) overrides individual `top`/`bottom` values. Use `left-0 right-0` + inline `style` for top/bottom instead.
