# Hromada Planning Vault

This directory is an [Obsidian](https://obsidian.md/) vault for project planning. It syncs via git — no extra tooling needed.

## For Humans

1. Open Obsidian → "Open folder as vault" → select this `Vault/` directory
2. Install recommended community plugins (listed in `.obsidian/community-plugins.json`):
   - **Kanban** — board view for `current-sprint.md`
   - **Dataview** — query tasks across files
   - **Templater** — use templates from `templates/`
   - **Calendar** — navigate meeting notes by date
3. Pull before editing, commit after editing. Merge conflicts in markdown are easy to resolve.

## For Claude Code

Both Sloan's and Tom's Claude Code instances can read/write these files natively. See the root `CLAUDE.md` for conventions.

### Key files

| File | Purpose |
|------|---------|
| `roadmap.md` | High-level milestones and project direction |
| `current-sprint.md` | Active work — check before starting any task |
| `backlog.md` | Prioritized upcoming work |
| `decisions/` | Architecture Decision Records (ADRs) |
| `specs/` | Feature specifications |
| `meetings/` | Meeting notes |
| `templates/` | Templates for all document types |

### Task format

All tasks use this format so Claude can parse them:

```markdown
- [ ] Task description #p1 @sloan
```

- **Priority tags:** `#p0` (critical), `#p1` (high), `#p2` (medium), `#p3` (low)
- **Owners:** `@sloan`, `@tom`
- **Status:** `- [ ]` (todo), `- [/]` (in progress), `- [x]` (done)

### Creating new documents

Use the templates in `templates/` as starting points:
- `task.md` — individual task breakdown
- `decision.md` — Architecture Decision Record
- `spec.md` — feature specification
- `meeting.md` — meeting notes
- `sprint.md` — sprint planning
