# Security Revamp — Detailed Review

**Branch:** `v2-cyber-security` (merged into `v2-payment-processing`)
**Date:** February 2026
**Scope:** 29 files changed, +758 / -1,258 lines
**Tests:** 132 passing across 7 test suites

---

## 1. Hardcoded Credentials Removal

### 1A. Site Password in Source Code

**What was wrong:** The site-wide gate password (`hromada!2026`) was hardcoded as a string literal in two files (`middleware.ts`, `site-access/route.ts`). Anyone with access to the GitHub repo — current team members, former collaborators, CI logs, or anyone if the repo ever becomes public — could see the password in plaintext.

**What we did:** Moved to `process.env.SITE_PASSWORD`. If the env var is missing, the site returns 503 instead of silently falling back to nothing.

**What it mitigates:**
- **CWE-798 (Hardcoded Credentials):** The #1 most common credential vulnerability. Attackers scan GitHub repos (including commit history) for hardcoded secrets.
- **Credential rotation:** Before, changing the password required a code deploy. Now it's an env var change.

### 1B. Cookie Stored Raw Password

**What was wrong:** When a user entered the site password, the cookie was set to the plaintext password itself. Anyone inspecting browser cookies (browser DevTools, a shared computer, a browser extension) could read the actual password and share it.

**What we did:** Cookie now stores an HMAC-derived token using Web Crypto `subtle.sign`. The middleware verifies the cookie by recomputing the HMAC from the env var and comparing. The actual password never leaves the server.

**What it mitigates:**
- **CWE-312 (Cleartext Storage of Sensitive Information):** The password was readable in the browser's cookie jar.
- **Credential theft via cookie exfiltration:** Even if an attacker steals the cookie (XSS, shared computer), they get an opaque HMAC token, not the password itself.

### 1C. JWT Secret Fallback Chain

**What was wrong:** `getSecretKey()` in `auth.ts` would fall back from `SESSION_SECRET` to `HROMADA_ADMIN_SECRET` to potentially a weak or predictable value. If neither env var was set, sessions could be signed with a guessable key.

**What we did:** `SESSION_SECRET` is now the only accepted key, must be at least 32 characters, and throws an explicit error if missing.

**What it mitigates:**
- **CWE-321 (Hard-Coded Cryptographic Key):** Weak or absent signing keys let attackers forge JWT tokens.
- **Session forgery:** If an attacker can guess or brute-force the signing key, they can create valid admin sessions from scratch.

### 1D. Default Admin Password

**What was wrong:** `admin/verify/route.ts` had `process.env.ADMIN_PASSWORD || 'admin'`. If the env var wasn't set (common in fresh deployments), the admin password was literally `admin`.

**What we did:** Returns 503 if `ADMIN_PASSWORD` is not configured. No default.

**What it mitigates:**
- **CWE-1393 (Default Credentials):** Automated scanners try `admin/admin` as the first thing. Any deployment that forgot to set the env var was wide open.

---

## 2. Authentication Backdoor Removal

### 2A. Legacy Base64 Sessions

**What was wrong:** `getSessionData()` had a "Method 2" fallback that accepted unsigned base64-encoded cookies as valid admin sessions. An attacker could craft a cookie like `base64(admin_secret:timestamp)` and be recognized as an admin without any cryptographic verification.

**What we did:** Deleted the entire legacy parsing block. Only cryptographically signed JWTs are accepted.

**What it mitigates:**
- **CWE-287 (Improper Authentication):** The legacy path performed no signature verification — it just decoded base64 and trusted the contents.
- **Session forgery:** Anyone who knew the cookie format could create an admin session without knowing any secret key.

### 2B. Bearer Token Backdoor

**What was wrong:** `verifyAdminAuth()` and `verifyAuth()` accepted `Authorization: Bearer <HROMADA_ADMIN_SECRET>` as valid admin authentication. This meant a single static string granted permanent admin access from any client — no login, no session, no expiration.

**What we did:** Removed all Bearer token checks. Admin auth requires a valid JWT session cookie.

**What it mitigates:**
- **CWE-798 (Hardcoded Credentials):** A static bearer token is functionally a permanent password with no expiry or revocation.
- **Lateral movement:** If the secret leaked (logs, shell history, CI output), an attacker had permanent admin API access.
- **No audit trail:** Bearer token auth bypassed all session tracking — no login event, no session version, no ability to revoke.

### 2C. Missing Database Validation

**What was wrong:** Auth verifiers checked the JWT signature was valid but never confirmed the user still existed, was active, wasn't locked, or had a matching session version. A deleted user's token still worked. A locked account's token still worked. A revoked session's token still worked.

**What we did:** All three verifiers (`verifyAdminAuth`, `verifyPartnerAuth`, `verifyAuth`) now call `validateSessionWithDatabase()` which checks:
- User exists in database
- `isActive === true`
- `lockedUntil` is null or in the past
- `sessionVersion` matches the token's version

**What it mitigates:**
- **CWE-613 (Insufficient Session Expiration):** Tokens for deleted/deactivated users remained valid until JWT expiry.
- **Failed account lockout:** If an account was locked due to brute force, existing sessions continued working.
- **No session revocation:** Changing a user's password or role had no effect on existing sessions.

### 2D. Password-Only Login

**What was wrong:** `/api/auth/login` accepted a request with just `{ password: "..." }` (no email). If the password matched `HROMADA_ADMIN_SECRET`, it created a legacy admin session. This was a backdoor that bypassed the user database entirely.

**What we did:** All logins require `email` + `password`. The password is verified against the bcrypt hash in the user's database record. No shortcut paths.

**What it mitigates:**
- **CWE-287 (Improper Authentication):** Password-only login bypassed the user database, email verification, and all account security features (lockout, deactivation).
- **Privilege escalation:** The password-only path granted admin access without a user record, meaning there was no way to audit, lock, or revoke that access.

### 2E. Middleware Route Protection

**What was wrong:** Protected routes (`/admin/*`, `/partner/*`, `/nonprofit/*`, `/donor/*`) had no server-side access check at the edge. Anyone could navigate directly to admin pages — protection relied entirely on client-side JavaScript.

**What we did:** Middleware now verifies the JWT cookie at the edge for protected routes. If the cookie is missing or the role doesn't match, it redirects to login. API routes still do full DB validation — this is a lightweight first line of defense.

**What it mitigates:**
- **CWE-862 (Missing Authorization):** Client-side auth checks are trivially bypassed by disabling JavaScript or making direct HTTP requests.
- **Information disclosure:** Admin dashboard HTML, partner data, and nonprofit management pages were served to unauthenticated users even though API calls would fail.

---

## 3. Security Headers + Open Redirect

### 3A. Security Headers on All Routes

**What was wrong:** The middleware matcher `['/((?!api|_next|.*\\..*).*)']` excluded `/api/` routes from middleware entirely. API responses had zero security headers — no CSP, no X-Frame-Options, nothing.

**What we did:** Changed matcher to `['/((?!_next|.*\\..*).*)']` so API routes go through middleware. All responses now get:
- **Content-Security-Policy** — restricts which scripts, styles, and resources can load
- **X-Frame-Options: DENY** — prevents clickjacking via iframes
- **X-Content-Type-Options: nosniff** — prevents MIME-type sniffing attacks
- **Referrer-Policy: strict-origin-when-cross-origin** — limits referrer leakage
- **Permissions-Policy** — disables camera, microphone, geolocation access
- **X-DNS-Prefetch-Control: off** — prevents DNS prefetch information leaks

**What it mitigates:**
- **CWE-1021 (Clickjacking):** Without `X-Frame-Options`, the site could be embedded in a malicious iframe to trick users into clicking hidden buttons.
- **CWE-79 (XSS):** CSP limits the damage of any XSS by restricting what scripts can execute.
- **MIME confusion attacks:** Without `nosniff`, browsers might execute a file as a script based on content sniffing rather than the declared type.

### 3B. Open Redirect

**What was wrong:** After entering the site password, `site-access/page.tsx` redirected to whatever URL was in the `?redirect=` query parameter. An attacker could craft a link like `https://hromada.org/site-access?redirect=https://evil.com` — after login, the user would be sent to the attacker's site.

**What we did:** Redirect must start with `/` (relative path) and cannot start with `//` (protocol-relative URL). Anything else defaults to `/`.

**What it mitigates:**
- **CWE-601 (Open Redirect):** Phishing attacks where the attacker's URL is disguised behind the legitimate domain. Victims see `hromada.org` in the link and trust it.

### 3C. CSRF Origin Validation

**What was wrong:** No CSRF protection existed. A malicious site could make form submissions or API calls to Hromada endpoints from the victim's browser, using their cookies.

**What we did:** For all POST/PUT/PATCH/DELETE requests to API routes, middleware verifies the `Origin` header matches the `Host` header. Mismatches return 403.

**What it mitigates:**
- **CWE-352 (Cross-Site Request Forgery):** An attacker's page could trigger admin actions (create users, approve projects, change settings) if the victim has a valid session cookie.

### 3D. Geo-Blocking for Amplify

**What was wrong:** Geo-blocking used `request.geo?.country` which is a Vercel-only API. On AWS Amplify (our hosting), this was always `undefined`, so geo-blocking never worked.

**What we did:** Falls back to `CloudFront-Viewer-Country` header, which is how AWS Amplify/CloudFront provides geo data.

**What it mitigates:**
- **Sanctions compliance / access restriction:** The Russia/Belarus block was configured but non-functional on our actual hosting platform.

---

## 4. Input Validation + Sanitization

### 4A. Centralized Zod Validation

**What was wrong:** Each API route had ad-hoc validation — `if (!email)`, `if (!email.includes('@'))`, inconsistent password minimums (8 chars in one place, none in another). Easy to miss fields, easy to introduce inconsistencies.

**What we did:** Created `lib/validations.ts` with Zod schemas for every API input. Single `parseBody()` helper returns either parsed/typed data or a 400 error. Applied to all 10 API routes.

**Schemas created:**
- `loginSchema` — email + password
- `registerSchema` — email, password (min 12), name, organization, role
- `siteAccessSchema` — password
- `contactSchema` — projectId, donorName, donorEmail, message
- `newsletterSchema` — email
- `partnershipInquirySchema` — communityName, contactName, contactEmail, communityType, etc.
- `donationConfirmSchema` — projectId, paymentMethod, donorName, donorEmail, amount, etc.
- `projectSubmissionSchema` — full project submission with coordinates, category enum, etc.

**What it mitigates:**
- **CWE-20 (Improper Input Validation):** The root cause of most injection attacks. Centralized schemas ensure nothing is missed.
- **Inconsistent enforcement:** Password minimum was 8 in register, nonexistent elsewhere. Now 12 chars everywhere.
- **Type confusion:** Zod validates types at runtime — no more trusting that `req.body.amount` is actually a number.

### 4B. Email Validation

**What was wrong:** Email validation was `email.includes('@')`. This accepts `@`, `@@@@`, `<script>@.com`, and other garbage.

**What we did:** `z.string().email()` — proper RFC-compliant email validation with max 255 characters.

**What it mitigates:**
- **Injection via email fields:** Malformed emails can cause issues in email sending, database queries, and log injection.

### 4C. Suspicious Input Detection

**What was wrong:** `detectSuspiciousInput()` was fully implemented in `security.ts` but never called anywhere. It detects XSS payloads (`<script>`, `javascript:`, `onerror=`), SQL injection patterns, and path traversal attempts.

**What we did:** Wired it up on all public-facing POST routes: contact form, partnership inquiry, donation confirmation, project submissions. Suspicious inputs are flagged via `logAuditEvent` for review but the request still processes (defense in depth, not blocking).

**What it mitigates:**
- **CWE-79 (XSS):** Detects script injection attempts before they reach the database.
- **Visibility:** Without logging, you'd never know someone is probing your forms for vulnerabilities.

### 4D. Email Template HTML Injection

**What was wrong:** User-provided values (`donorName`, `message`, `communityName`, `contactEmail`, etc.) were interpolated directly into HTML email templates: `` `<p>${donorName}</p>` ``. A donor named `<script>alert('xss')</script>` would inject raw HTML into emails sent to admins.

**What we did:** All ~20 interpolation points across 5 email functions wrapped in `sanitizeInput()` which escapes `<`, `>`, `&`, `"`, `'`.

**What it mitigates:**
- **CWE-79 (Stored XSS via Email):** Many email clients render HTML. Injected scripts or malicious HTML could execute when an admin opens the email.
- **Email content spoofing:** Without sanitization, an attacker could inject arbitrary HTML to impersonate content or add fake links.

### 4E. Upload Endpoint Hardening

**What was wrong:** The public upload endpoint (`/api/upload/public`) had no rate limiting and trusted the client-declared `Content-Type` to determine file type.

**What we did:**
- Rate limited to 10 uploads per hour per IP
- Magic byte validation: checks the actual file header bytes (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `52 49 46 46`) instead of trusting the client

**What it mitigates:**
- **CWE-434 (Unrestricted File Upload):** An attacker could upload an HTML file with `Content-Type: image/jpeg` and potentially achieve stored XSS if the file is served back.
- **Resource exhaustion:** Without rate limiting, an attacker could flood the upload endpoint to consume storage and bandwidth.

---

## 5. Infrastructure Hardening

### 5A. Rate Limiter Memory Cap

**What was wrong:** The in-memory rate limit store grew without bounds. An attacker sending requests from many different IPs (or spoofing the forwarded-for header) could cause unbounded memory growth, eventually crashing the process.

**What we did:** Capped at 50,000 entries. When exceeded, oldest entries are evicted first.

**What it mitigates:**
- **CWE-770 (Allocation of Resources Without Limits):** A low-effort denial-of-service where the attacker doesn't need to overwhelm bandwidth — just memory.

### 5B. Next.js CVE Patch

**What was wrong:** Next.js 16.1.4 had a known High-severity DoS vulnerability.

**What we did:** Updated to 16.1.6.

**What it mitigates:**
- **CVE (DoS):** Known vulnerabilities are the first thing automated scanners check. Running a patched version eliminates the lowest-hanging fruit.

### 5C. SSL Certificate Verification

**What was wrong:** `ssl: { rejectUnauthorized: false }` in Prisma config meant the app accepted any SSL certificate when connecting to the database — including self-signed, expired, or attacker-issued certificates.

**What we did:** `rejectUnauthorized: process.env.NODE_ENV === 'production'` — enforced in production, relaxed in dev (where self-signed certs are common).

**What it mitigates:**
- **CWE-295 (Improper Certificate Validation):** Without certificate verification, an attacker who can intercept network traffic (cloud network, compromised router) can perform a man-in-the-middle attack on the database connection, reading and modifying all queries and results.

---

## Files Modified

| File | Phases | Description |
|------|--------|-------------|
| `src/middleware.ts` | 1A, 2E, 3A, 3C, 3D, 5B | HMAC cookie, route protection, security headers, CSRF, geo fallback |
| `src/lib/auth.ts` | 1C, 2A, 2B, 2C, 2D | Secret key hardening, remove legacy sessions/Bearer tokens, add DB validation |
| `src/lib/security-headers.ts` | 3A | New edge-compatible security headers module |
| `src/lib/validations.ts` | 4A | New centralized Zod schemas + parseBody() helper |
| `src/lib/email.ts` | 4D | Sanitize all HTML interpolation points |
| `src/lib/rate-limit.ts` | 5A | Memory cap at 50K entries |
| `src/lib/prisma.ts` | 5C | SSL verification in production |
| `src/app/api/auth/site-access/route.ts` | 1A, 1B | Env var password, HMAC cookie, rate limiting |
| `src/app/api/auth/login/route.ts` | 2D, 4A | Remove password-only login, Zod validation |
| `src/app/api/auth/status/route.ts` | 2A | Remove legacy session support |
| `src/app/api/auth/register/route.ts` | 4A | Zod validation, 12-char password minimum |
| `src/app/api/admin/verify/route.ts` | 1D | Remove default password |
| `src/app/api/contact/route.ts` | 4A, 4C | Zod validation, suspicious input detection |
| `src/app/api/newsletter/route.ts` | 4A, 4B | Zod validation, proper email validation |
| `src/app/api/partnership-inquiry/route.ts` | 4A, 4C | Zod validation, suspicious input detection |
| `src/app/api/donations/confirm/route.ts` | 4A, 4C | Zod validation, suspicious input detection |
| `src/app/api/projects/submissions/route.ts` | 4A, 4C, 4D | Zod validation, suspicious input detection, email sanitization |
| `src/app/api/partner/projects/route.ts` | 4A | Zod validation |
| `src/app/api/upload/public/route.ts` | 4E | Rate limiting, magic byte validation |
| `src/app/[locale]/(public)/site-access/page.tsx` | 3B | Open redirect fix |
| `src/hooks/useAuth.ts` | 2D | Remove legacy auth, simplify login |
| `.env.example` | 1A, 1C, 1D | Add required env vars |
| `amplify.yml` | 1A | npm ci, env var references |
| `package.json` | 5B | Next.js 16.1.6 |

---

## CWE Coverage Summary

| CWE | Description | Fixes |
|-----|-------------|-------|
| CWE-20 | Improper Input Validation | 4A, 4B |
| CWE-79 | Cross-Site Scripting (XSS) | 3A, 4C, 4D |
| CWE-287 | Improper Authentication | 2A, 2D |
| CWE-295 | Improper Certificate Validation | 5C |
| CWE-312 | Cleartext Storage of Sensitive Info | 1B |
| CWE-321 | Hard-Coded Cryptographic Key | 1C |
| CWE-352 | Cross-Site Request Forgery | 3C |
| CWE-434 | Unrestricted File Upload | 4E |
| CWE-601 | Open Redirect | 3B |
| CWE-613 | Insufficient Session Expiration | 2C |
| CWE-770 | Resource Allocation Without Limits | 5A |
| CWE-798 | Hardcoded Credentials | 1A, 2B |
| CWE-862 | Missing Authorization | 2E |
| CWE-1021 | Clickjacking | 3A |
| CWE-1393 | Default Credentials | 1D |

---

## Test Suites

| Suite | Tests | Coverage |
|-------|-------|----------|
| `auth.test.ts` (API) | 20 | Login, logout, status endpoints |
| `auth-register.test.ts` | 17 | Registration with Zod validation |
| `auth-security.test.ts` | 38 | Password policy, lockout, JWT, sessions, sanitization, headers |
| `authorization-security.test.ts` | 8 | RBAC, IDOR, session validation |
| `admin-verify.test.ts` | 7 | Admin endpoint auth |
| `useAdminAuth.test.ts` | 24 | Client-side auth hook |
| `auth.test.ts` (lib) | 18 | Auth utility functions |
| **Total** | **132** | |
