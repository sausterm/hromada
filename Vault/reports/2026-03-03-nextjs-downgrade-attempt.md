# Next.js 16 → 15 Downgrade Attempt

**Date:** 2026-03-03
**Author:** Tom (via Claude Code)
**Branch:** `v2-payment-processing`
**Status:** Reverted — no changes merged

---

## Why we tried this

Amplify officially supports Next.js 12–15 only. We believed Next.js 16 was causing Amplify's CDN routing adapter to not register new API routes (forgot-password, reset-password, etc.). The hypothesis was that downgrading to Next.js 15 would fix the routing issue.

## What we did

1. **Created an isolated git worktree** to test the downgrade without touching the main branch
2. **Downgraded `next` and `eslint-config-next`** from 16.x to 15.x
3. **Fixed compatibility issues** that surfaced during the downgrade:
   - **ESLint config format:** Next.js 16 uses flat config natively; Next.js 15 doesn't. Had to add `@eslint/eslintrc` with `FlatCompat` adapter and rewrite `eslint.config.mjs`
   - **Outfit font `cyrillic` subset:** Next.js 15 strictly validates font subsets. Outfit doesn't actually support `cyrillic` — we had a type cast hack (`"cyrillic" as "latin"`) that Next.js 16 allowed but 15 rejected. Removed it.
   - **Async `params` in route handlers:** Next.js 15 requires `params` to be `Promise<{...}>` and awaited in API route handlers. Next.js 16 accepted sync params. Had to update **12 API route files** across the codebase.
   - **`Buffer` type incompatibility:** `new NextResponse(buffer)` no longer accepted Node.js `Buffer` directly — needed `new Uint8Array(buffer)`.
   - **`session.role` type narrowing:** Stricter TypeScript in 15 caught a `string | undefined` being passed to `Array.includes()`.
   - **Prisma client regeneration** needed after every `node_modules` wipe.

4. **Build kept failing or getting killed (exit 137 / OOM)** during the compilation step on the feature branch. The worktree build (which was a simpler codebase snapshot from `main`) succeeded, but the full `v2-payment-processing` branch — with Sentry, SES, PDF generation, and all the payment processing code — exceeded available memory during webpack compilation.

## Why we stopped

- Each build attempt took 3+ minutes before failing
- Exit code 137 (killed by OS, likely OOM) made iteration impossibly slow
- The number of cascading compatibility fixes kept growing
- The original hypothesis (Amplify routing broken by Next.js 16) may not even be correct — the issue could be Amplify config, not the Next.js version

## What was reverted

All changes were reverted via `git checkout -- .`. The branch is back to its exact committed state with Next.js 16.1.6. node_modules were reinstalled clean. The worktree and its branch were deleted.

## Key findings for future reference

1. **The codebase is NOT trivially downgradable to Next.js 15.** Despite using zero Next.js 16-exclusive APIs, there are significant differences in:
   - ESLint config format (flat vs legacy)
   - Route handler `params` typing (sync vs async Promise)
   - Font subset validation strictness
   - TypeScript strictness around `Buffer` and union types

2. **If we attempt this again**, the full list of files that need async `params` changes:
   - `src/app/api/admin/campaigns/[id]/route.ts` (3 handlers)
   - `src/app/api/admin/campaigns/[id]/send/route.ts`
   - `src/app/api/admin/drips/[id]/route.ts`
   - `src/app/api/admin/drips/[id]/enrollments/route.ts`
   - `src/app/api/admin/users/[id]/route.ts` (3 handlers)
   - `src/app/api/contact/[id]/route.ts`
   - `src/app/api/donations/[id]/status/route.ts`
   - `src/app/api/partner/projects/[id]/route.ts` (2 handlers)
   - `src/app/api/projects/[id]/route.ts` (3 handlers)
   - `src/app/api/projects/[id]/documents/route.ts` (3 handlers)
   - `src/app/api/projects/[id]/updates/route.ts`
   - `src/app/api/projects/submissions/[id]/route.ts` (3 handlers)
   - `src/app/[locale]/layout.tsx`

3. **Alternative approaches to investigate for the Amplify routing issue:**
   - Check if `output: 'standalone'` in `next.config.ts` is actually needed/helping
   - Check Amplify's `amplify.yml` build output and deployment adapter logs
   - Check if the issue is Amplify's rewrite rules not picking up new routes (CDN cache or manifest issue)
   - Try deploying from a clean branch with just the new routes to isolate the issue
   - Contact AWS support about Next.js 16 compatibility timeline

---

*This report is in `Vault/reports/`. Tell Sloan to check there.*
