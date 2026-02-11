# Hromada — Claude Code Instructions

## Project

Hromada is a Next.js platform connecting American donors with Ukrainian municipalities for infrastructure rebuilding. Fiscal sponsor: POCACITO Network.

## Planning Vault

This repo includes an Obsidian vault at `planning/` for project coordination.

### Before starting work

1. Read `planning/current-sprint.md` to see what's in progress and what's prioritized
2. Check if your task is already tracked — if so, mark it `- [/]` (in progress)
3. If your task isn't tracked, add it to the appropriate section

### After completing work

1. Mark completed tasks `- [x]` in `planning/current-sprint.md`
2. If work revealed new tasks, add them to `planning/backlog.md`

### Task format

```markdown
- [ ] Task description #p1 @owner
```

- **Priority:** `#p0` (critical), `#p1` (high), `#p2` (medium), `#p3` (low)
- **Owner:** `@sloan`, `@tom`
- **Status:** `- [ ]` (todo), `- [/]` (in progress), `- [x]` (done)

### Architectural decisions

When making a significant technical choice, create an ADR in `planning/decisions/` using the template at `planning/templates/decision.md`. Number sequentially (002, 003, ...).

## Code Conventions

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS
- **Database:** Supabase (Postgres + Storage)
- **i18n:** English and Ukrainian (EN/UK)
- **Testing:** Jest + React Testing Library

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
