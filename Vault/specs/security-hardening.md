---
title: "Security Hardening"
created: "2026-02-12"
status: In Progress
owner: "@sloan"
---

# Security Hardening

## Summary

Consolidate and prioritize all security work required before launch and beyond. This spec replaces the root-level `SECURITY_AUDIT_REPORT.md` and `SECURITY_HARDENING_CHECKLIST.md` as the canonical source of security tasks.

## Motivation

A security audit (Feb 4, 2026) rated the platform **MEDIUM-HIGH** risk with 3 critical, 5 high, 8 medium, and 6 low findings. The critical and high findings must be resolved before launch. The platform handles donor PII (names, emails, donation amounts) and will handle real financial transactions — security is not optional.

## Current State

### What's Already Secure
- Password hashing with bcryptjs (12 rounds)
- Password complexity requirements (12 chars, upper/lower/number/special)
- Account lockout after 5 failed attempts (15 min)
- Security headers (X-Frame-Options, X-Content-Type-Options, HSTS, etc.)
- Geo-blocking (RU/BY) via edge middleware
- Audit logging for sensitive actions
- Rate limiting on login, contact form, project submission
- JWT-based session management with session versioning

### What's Broken
- Session tokens use base64 encoding (not cryptographic)
- Default password fallback (`'admin'`) in admin verify endpoint
- Site password hardcoded in source code
- Site access cookie not httpOnly
- Public file upload has no rate limiting
- Email templates don't sanitize user input
- No CSRF protection on mutation endpoints
- In-memory rate limiting (doesn't survive restarts, doesn't work multi-instance)

---

## Phase 1: Pre-Launch (Critical + High) #p0

These must be done before any donor touches the platform.

### 1.1 Session Token Fix
**File:** `src/lib/auth.ts`
**Issue:** Session tokens generated with `Buffer.from().toString('base64')` — this is encoding, not encryption.
**Fix:** Replace with `crypto.randomBytes(32).toString('hex')`.
**Effort:** Small (1 hour)

### 1.2 Remove Default Password Fallback
**File:** `src/app/api/admin/verify/route.ts`
**Issue:** Falls back to `'admin'` if `HROMADA_ADMIN_SECRET` env var is not set.
**Fix:** Throw error if env var is missing. Never fall back to a default password.
**Effort:** Small (30 min)

### 1.3 Hardcoded Site Password → Env Var
**File:** `src/middleware.ts`, `src/app/api/auth/site-access/route.ts`
**Issue:** Site password `hromada!2026` is in source code, committed to git.
**Fix:** Move to `SITE_PASSWORD` environment variable. Throw if not set.
**Effort:** Small (30 min)

### 1.4 httpOnly Cookie
**File:** `src/app/api/auth/site-access/route.ts`
**Issue:** Site access cookie has `httpOnly: false`, making it readable by JavaScript (XSS vector).
**Fix:** Set `httpOnly: true`, upgrade `sameSite` to `'strict'`.
**Effort:** Small (15 min)

### 1.5 Rate Limit Public Upload
**File:** `src/app/api/upload/public/route.ts`
**Issue:** No rate limiting — allows storage exhaustion attacks.
**Fix:** Add rate limiting (5 uploads per hour per IP) using existing `rateLimit()` helper.
**Effort:** Small (30 min)

### 1.6 Update Next.js
**Issue:** Next.js 16.1.4 has known DoS CVEs.
**Fix:** `npm install next@latest`
**Effort:** Small (15 min + testing)

### 1.7 Sanitize Email Templates
**File:** `src/lib/email.ts`
**Issue:** User input (donor name, message) interpolated directly into HTML email templates.
**Fix:** HTML-escape all user input before template insertion.
**Effort:** Small (1 hour)

**Total Phase 1 effort:** ~4 hours of focused work

---

## Phase 2: Post-Launch Hardening #p1

These improve security posture but don't block launch.

### 2.1 CSRF Protection
**Scope:** All POST/PATCH/DELETE API endpoints
**Approach:** Generate CSRF token on session creation, validate via `X-CSRF-Token` header + cookie double-submit pattern.
**Effort:** Medium (half day)

### 2.2 Legacy Auth Deprecation
**File:** `src/lib/auth.ts`
**Issue:** Three auth paths (JWT cookie, Bearer token, legacy base64). Legacy path has no expiration.
**Fix:** Add deprecation warnings, log legacy usage, set removal timeline.
**Effort:** Medium (half day)

### 2.3 Replace dangerouslySetInnerHTML
**Files:** `ProjectPopup.tsx`, `ProjectCard.tsx`, `CategoryFilter.tsx`
**Issue:** Using `dangerouslySetInnerHTML` for category icons. Currently safe (static SVGs) but fragile.
**Fix:** Replace with Lucide React icon components.
**Effort:** Medium (2-3 hours)

### 2.4 User Enumeration Prevention
**File:** `src/app/api/auth/login/route.ts`
**Issue:** Timing differences between "user not found" and "wrong password" responses.
**Fix:** Always hash a dummy password even when user doesn't exist to equalize timing.
**Effort:** Small (30 min)

### 2.5 Error Response Sanitization
**Scope:** All API routes
**Issue:** Some error responses leak internal details (DB structure, stack traces).
**Fix:** Wrap all API handlers with error sanitization middleware.
**Effort:** Medium (half day)

---

## Phase 3: Production Infrastructure #p2

These matter when traffic increases or for compliance.

### 3.1 Redis Rate Limiting
**Issue:** In-memory rate limiting resets on restart, doesn't work across instances.
**Fix:** Swap to Redis-backed rate limiting. Add `REDIS_URL` env var.
**Effort:** Medium (half day + Redis provisioning)

### 3.2 Content Security Policy
**Issue:** Current CSP uses `unsafe-inline` (required by Next.js for styles).
**Fix:** Implement nonce-based CSP for scripts. Accept `unsafe-inline` for styles (Next.js limitation).
**Effort:** Medium (half day)

### 3.3 Session Binding
**Issue:** Sessions not bound to client fingerprint. Stolen JWT works from any device.
**Fix:** Include hashed IP + user-agent in JWT payload, validate on each request.
**Effort:** Medium (half day)

### 3.4 Database SSL Validation
**Issue:** `rejectUnauthorized: false` in Supabase connection.
**Fix:** Enable certificate validation in production connection string.
**Effort:** Small (30 min)

### 3.5 Database Image Constraint
**Issue:** 5-image-per-project limit only enforced at application layer.
**Fix:** Add database-level check constraint via Prisma migration.
**Effort:** Small (30 min)

---

## Phase 4: Long-Term #p3

### 4.1 2FA for Admin Accounts
TOTP-based two-factor authentication for admin and nonprofit manager roles.

### 4.2 OAuth2/OIDC
Replace custom auth with Google/GitHub OAuth for donors, keep password auth for admin/partner roles.

### 4.3 External Audit Logging
Move audit logs to an append-only external service (prevents tampering).

### 4.4 Secrets Management
Integrate with a secrets manager (Amplify env vars are fine for now, but consider AWS Secrets Manager for rotation).

### 4.5 Penetration Testing
Commission an external pentest before scaling to significant donor volume.

---

## Findings Summary (from Feb 4 Audit)

| ID | Severity | Finding | Phase | Status |
|----|----------|---------|-------|--------|
| 2.1 | Critical | Hardcoded site password | 1 | Todo |
| 2.2 | Critical | Cookie not httpOnly | 1 | Todo |
| 2.3 | Critical | Public upload no rate limit | 1 | Todo |
| 3.1 | High | In-memory rate limiting | 3 | Todo |
| 3.2 | High | Multiple auth paths | 2 | Todo |
| 3.3 | High | Missing CSRF | 2 | Todo |
| 3.4 | High | dangerouslySetInnerHTML | 2 | Todo |
| 3.5 | High | Email template injection | 1 | Todo |
| 4.1 | Medium | DB image limit not enforced | 3 | Todo |
| 4.2 | Medium | User enumeration | 2 | Todo |
| 4.3 | Medium | Excessive error details | 2 | Todo |
| 4.4 | Medium | No request signing | 3 | Deferred |
| 4.5 | Medium | Audit logs not immutable | 4 | Todo |
| 4.6 | Medium | Missing password reset | 2 | Todo |
| 4.7 | Medium | Session not bound to client | 3 | Todo |
| 4.8 | Medium | SSL validation disabled | 3 | Todo |
| — | #p0 | Session token base64 | 1 | Todo |
| — | #p0 | Default password fallback | 1 | Todo |

---

## Ongoing Security Maintenance

### Weekly
- Review audit logs for anomalies
- Check failed login attempt counts
- Monitor dependency alerts (Dependabot)

### Monthly
- Run `npm audit`
- Update dependencies
- Review access logs

### Quarterly
- Rotate secrets (SESSION_SECRET, API keys)
- Review user access permissions
- Update this spec with new findings

---

## Open Questions

- Do we need GDPR compliance? (Likely yes if EU donors contribute)
- Should we add a `security.txt` file for responsible disclosure?
- What is our incident response plan if a breach occurs?
- Do we need PCI-DSS compliance? (No — we don't handle card data directly)

## Related

- Source: `SECURITY_AUDIT_REPORT.md` (root — original audit, Feb 4)
- Source: `SECURITY_HARDENING_CHECKLIST.md` (root — original checklist)
- Spec: [[specs/launch-readiness]]
- Sprint: [[current-sprint]]
