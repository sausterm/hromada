# ADR-003: Migrate Project Photos to Supabase Storage

**Status:** Accepted (Implemented)
**Date:** 2026-02-10
**Authors:** Sloan

## Context

Project photos were originally stored locally in the `public/` directory. This doesn't work for production deployment on Amplify (ephemeral filesystem) and creates large git diffs when photos are added/removed.

## Decision

Migrate all project photos to Supabase Storage using a public bucket. Store only the Supabase CDN URLs in the database (`ProjectImage.url`).

### Implementation
- Public bucket on Supabase Storage (kwzirplynefqlpvdvpqz.supabase.co)
- Upload via `src/lib/supabase.ts` client
- `next.config.ts` allows Supabase CDN in `remotePatterns`
- Admin upload component: `src/components/admin/ImageUpload.tsx`
- Public upload component: `src/components/forms/PublicImageUpload.tsx`
- Max 5 images per project (enforced at application layer)

## Consequences

- Photos persist across deployments (no ephemeral filesystem issues)
- CDN-served images with global edge caching
- Git repo stays lean — no binary files in version control
- Depends on Supabase availability (acceptable tradeoff)
- Completed in commit 381b98c
