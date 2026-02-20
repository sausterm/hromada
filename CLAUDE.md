# Hromada — Claude Code Instructions

## Project

Hromada is a Next.js platform connecting American donors with Ukrainian municipalities for infrastructure rebuilding.

**Fiscal Sponsor:** POCACITO Network (501(c)(3), EIN 99-0392258), based in Virginia.

## Planning Vault

This repo includes an Obsidian vault at `Vault/` for project coordination.

### Before starting work

1. Read `Vault/current-sprint.md` to see what's in progress and what's prioritized
2. Check if your task is already tracked — if so, mark it `- [/]` (in progress)
3. If your task isn't tracked, add it to the appropriate section

### After completing work

1. Mark completed tasks `- [x]` in `Vault/current-sprint.md`
2. If work revealed new tasks, add them to `Vault/backlog.md`

### Task format

```markdown
- [ ] Task description #p1 @owner
```

- **Priority:** `#p0` (critical), `#p1` (high), `#p2` (medium), `#p3` (low)
- **Owner:** `@sloan`, `@tom`
- **Status:** `- [ ]` (todo), `- [/]` (in progress), `- [x]` (done)

### Architectural decisions

When making a significant technical choice, create an ADR in `Vault/decisions/` using the template at `Vault/templates/decision.md`. Number sequentially (002, 003, ...).

## Donation Model

Hromada does NOT accept partial donations toward projects. Each project is funded as a whole — there is no per-project funding meter or progress bar. The only context where incremental funding tracking may apply is the Municipal Partnership Program.

## Project Prioritization

Projects with stronger documentation should be prioritized in the browse/featured experience. "Stronger documentation" means: cost estimates provided by NGO partners, engineering assessments, site photos, or other third-party verification artifacts. This is both a trust signal for donors and an internal quality bar.

## Transparency & Trust

- **Donor trust comes from evidence, not claims.** Show what NGO partners have already built — completed projects with photos, partner attribution, and cost documentation. The Kharkiv case study on the homepage is the model.
- **OFAC compliance policy** should be published and accessible (footer legal section or about/trust page) but not prominently featured. It's for institutional donors and due diligence, not the average individual donor.
- **Legal pages** (`/terms`, `/privacy`) are currently placeholders and need completion.

## Messaging Rules

- **No destruction language.** Never use "destroy," "destroyed," "destruction," or similar on the site. Hromada builds resilience — the framing is always forward-looking, never about what war has taken.
- **Community agency is central.** Ukrainians are agents, not victims. They identify, they request, they rebuild. Hromada is infrastructure, not the originator.
- **Donors respond to a request, not save anyone.** Frame contributions as responding to a community's plan, not rescuing.
- **Never say** "we identified," "we selected," "beneficiaries," "recipients," "victims," "saving," "war-torn," or "charity."
- **Always use** "communities," "municipalities," "requesting," "rebuilding," "partners," "resilience," "energy independence."
- See `Hromada_Messaging_Framework.md.pdf` for full framework.

## Communication Style

When giving instructions to the user (especially for browser/tooling tasks), be extremely specific and precise. Reference exact locations, exact menu names, exact button positions. Never say vague things like "click the icon" without describing exactly where it is and what it looks like. Assume the user is not a developer and needs step-by-step guidance.

## Code Conventions

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS
- **Database:** Supabase (Postgres + Storage)
- **Hosting:** AWS Amplify (NOT Vercel). Pushing to a branch triggers an Amplify build automatically. There is no Vercel integration, no `vercel.json`, no Vercel CLI. Do not suggest or reference Vercel.
- **i18n:** English and Ukrainian (EN/UK)
- **Testing:** Jest + React Testing Library

## Architecture Notes

### Leaflet Maps
- **Dual-map pattern**: The projects page (`projects/page.tsx`) renders TWO `MapWrapper` instances — one for mobile (conditionally mounted via `{isMobileMapOpen && ...}`) and one for desktop (always mounted, CSS-hidden on mobile via `hidden lg:block`). Shared state like `flyToProjectId` must only be passed to the currently visible map, or Leaflet will operate on a zero-size container and produce NaN.
- **Leaflet + hidden containers**: ANY Leaflet spatial operation (`flyTo`, `getBounds`, tile rendering) on a zero-size or CSS-hidden container will fail or produce NaN. This applies to `flyTo`, not just tile rendering. Always use conditional mount/unmount (`{condition && <Map/>}`) rather than CSS hiding for Leaflet.
- **Leaflet + SSR**: Dynamically import with `ssr: false`.
- **Prisma Decimals**: Lat/lng come from Prisma as `Decimal` (string). All `transformProject` functions convert them with `Number()`. In map components, use `??` (nullish coalescing) not `||` for coordinate fallbacks — `||` treats `0` as falsy.
- **i18n Links**: Use `import { Link } from '@/i18n/navigation'` (not `next/link`) for locale prefix.

### Partner Logos
- **Background matching**: Partner logos in `public/partners/` come in two variants: `Logo.png` (cream/beige background) and `Logo-white.png` (white background). Always use the variant that matches the section's background color — use the cream variant on `var(--cream-100)` sections, the white variant on white or dark sections. The goal is seamless blending with no visible logo bounding box.

### Mobile
- Always add `onClick` handlers (not just hover). Use `touchstart` for outside-click listeners.
- **Turbopack cache**: `rm -rf .next` if dev server crashes or serves stale code.
- **Branch switching**: Kill dev server first (`pkill -f "next dev"`), then switch, then `npm run dev`.

## Key Directories

```
src/
├── app/          # Next.js app router pages
├── components/   # React components
├── lib/          # Utilities and helpers
├── hooks/        # Custom React hooks
├── types/        # TypeScript type definitions
└── generated/    # Auto-generated files (do not edit)
```
