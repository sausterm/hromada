# ADR-001: Obsidian Planning Hub

**Status:** Accepted
**Date:** 2026-02-10
**Authors:** Sloan

## Context

Sloan and Tom collaborate on Hromada via GitHub. Both use Claude Code extensively. The project needs a centralized planning system that:
- Both humans can easily view and edit
- Both Claude Code instances can read and write natively
- Syncs automatically without extra tooling
- Supports structured planning (roadmap, sprints, tasks, decisions, specs)

## Decision

Use an Obsidian vault (`Vault/` directory at repo root) committed to the git repository.

### Why Obsidian + Git

- **It's just markdown** — Claude Code reads/writes it natively, no API integration needed
- **Git sync** — no extra sync tooling; pull/push is the workflow they already use
- **Rich editing** — Obsidian provides graph view, backlinks, templates, kanban boards
- **No vendor lock-in** — every file is plain markdown, readable anywhere
- **Free** — Obsidian is free for personal use

### Why not alternatives

| Alternative | Reason against |
|------------|----------------|
| GitHub Issues/Projects | Claude Code can't easily read/write; requires API calls |
| Notion | Not in the repo; requires API integration; not git-native |
| Linear | External service; API overhead; not markdown-native |
| Plain markdown (no Obsidian) | Loses rich features like backlinks, graph view, kanban |

## Consequences

- Both collaborators must install Obsidian (free) to get the rich editing experience
- Markdown files are always accessible even without Obsidian
- Merge conflicts are possible but easy to resolve in markdown
- `.obsidian/` config is partially tracked (shared settings only, not personal workspace)
- Claude Code instances check `Vault/current-sprint.md` before starting work (per `CLAUDE.md`)
