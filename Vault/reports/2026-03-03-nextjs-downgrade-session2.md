# Next.js 16 → 15 Downgrade Attempt — Session 2 (Plan-Driven)

**Date:** 2026-03-03
**Author:** Tom (via Claude Code — Opus session)
**Branch:** `v2-payment-processing`
**Status:** Reverted — no changes merged

---

## Context

This was the second parallel attempt at the downgrade. While the other session worked in an isolated worktree, this session operated directly on the branch with a detailed pre-approved plan targeting Next.js 15.3.3 with sync params.

## What we did

1. **Package versions:** Changed `next` and `eslint-config-next` from 16.1.6 → 15.3.3
2. **Removed `output: 'standalone'`** from `next.config.ts` (Amplify WEB_COMPUTE manages the server)
3. **Cleaned `amplify.yml`** — removed standalone copy commands (lines 36-39)
4. **Reverted async params → sync** in 13 source files (layout + 12 API routes)
5. **Reverted `Promise.resolve` → plain objects** in 8 test files

## Critical discovery: Next.js 15 ALSO uses async params

The original plan assumed Next.js 15 used sync `params` and Next.js 16 introduced async. **This is wrong.** Next.js 15.0+ introduced async params (`Promise<{...}>` + `await`). Both 15 and 16 use the same pattern.

When we built with 15.5.12 (latest stable 15.x), the build failed:
```
Type error: Route has an invalid "GET" export:
  Type "{ params: { id: string; }; }" is not a valid type for the function's second argument.
```

This means **the entire params migration (13 source files + 8 test files) was unnecessary**. The params code was already correct for both Next.js 15 and 16.

## CVE discovery

- **Next.js 15.3.3** has CVE-2025-66478 (CVSS 10.0, RCE via React Server Components). Patched in 15.3.6+.
- **Next.js 15.3.6** has a SECOND CVE (security-update-2025-12-11). Also deprecated.
- **Next.js 15.5.12** is the latest stable 15.x and has all patches.

If we attempt this again, use **15.5.12** minimum.

## Linter interference

A linter/hook was actively reverting route file changes back to async params after every edit. Files like `admin/campaigns/[id]/route.ts`, `admin/users/[id]/route.ts`, `contact/[id]/route.ts`, etc. were silently reverted. This caused confusion and wasted cycles, but ultimately confirmed that async params is the correct pattern.

## Build failures

1. **15.3.3:** Never built (we discovered the params type error first)
2. **15.3.6:** Corrupted npm install (tar extraction errors: `TAR_ENTRY_ERROR ENOENT`), then `Cannot find module 'next/dist/compiled/babel/code-frame'`
3. **15.5.12:** Type error in `donor/donations/route.ts` (`session.role` is `string | undefined` but `includes()` expects `string`). Fixed by adding `!session.role ||` guard. Second build attempt hit stale `.next` cache (`Cannot find module './8632.js'`). Clean rebuild after `rm -rf .next` seemed to OOM or hang.

## What actually needs to change (if we try again)

Since async params are correct for BOTH versions, the real diff is much smaller:

| File | Change |
|------|--------|
| `package.json` | `next` + `eslint-config-next` → 15.5.12 |
| `package-lock.json` | regenerated |
| `next.config.ts` | remove `output: 'standalone'` |
| `amplify.yml` | remove standalone copy commands (lines 36-39) |
| `src/app/api/donor/donations/route.ts` | add `!session.role ||` guard (stricter TS) |
| ESLint config | may need `@eslint/eslintrc` + `FlatCompat` (see Session 1 report) |

**No params changes needed. No test file changes needed.**

## Lessons learned

1. **Verify assumptions before executing.** The plan's core assumption (15 = sync, 16 = async) was wrong. A quick `npm install next@15 && next build` on a single file would have caught this in 2 minutes.
2. **Don't fight the linter.** When a linter keeps reverting your changes, it's telling you something. In this case, it was enforcing the correct async params pattern.
3. **CVE awareness matters.** Pinning to an old patch (15.3.3) introduced a CVSS 10.0 RCE. Always use the latest patch in any minor line.
4. **The downgrade surface is smaller than we thought.** With params off the table, it's mainly config changes + a few TypeScript strictness fixes.
5. **OOM during build** was the shared blocker between both sessions. The `v2-payment-processing` branch (with Sentry, SES, PDF, payment code) exceeds available memory during webpack compilation with Next.js 15. This may be a real blocker independent of code compatibility.

---

*Companion to `Vault/reports/2026-03-03-nextjs-downgrade-attempt.md` (Session 1 worktree report).*
