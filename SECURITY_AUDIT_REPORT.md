# Hromada Platform Security Audit Report

**Audit Date:** February 4, 2026
**Platform Version:** Next.js 16.1.4
**Auditor:** Security Assessment
**Classification:** Confidential

---

## Executive Summary

This comprehensive security audit was conducted on the Hromada platform, a non-profit web application connecting Ukrainian municipalities with infrastructure donors. The assessment covered code review, dependency analysis, OWASP Top 10 vulnerability scanning, and configuration review.

### Overall Risk Rating: **MEDIUM-HIGH**

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 3 | Requires Immediate Action |
| High | 5 | Requires Urgent Action |
| Medium | 8 | Should Be Addressed |
| Low | 6 | Best Practice Improvements |
| Info | 4 | Recommendations |

### Key Findings Summary

1. **Hardcoded credentials** in source code (Critical)
2. **Vulnerable dependencies** with known CVEs (High)
3. **Public file upload** without authentication (High)
4. **In-memory rate limiting** not production-ready (Medium)
5. **Missing CSRF protection** on state-changing endpoints (Medium)

---

## 1. Dependency Vulnerabilities

### 1.1 npm audit Results

```
9 vulnerabilities found:
- 1 high severity
- 8 moderate severity
```

| Package | Severity | Vulnerability | CVE |
|---------|----------|---------------|-----|
| next@16.1.4 | High | DoS via Image Optimizer | GHSA-9g9p-9gw9-jx7f |
| next@16.1.4 | Moderate | PPR Resume Endpoint Memory Exhaustion | GHSA-5f7q-jpqc-wp7h |
| next@16.1.4 | Moderate | HTTP Request Deserialization DoS | GHSA-h25m-26qc-wcjf |
| hono | Moderate | XSS in ErrorBoundary | GHSA-9r54-q6cx-xmh5 |
| hono | Moderate | Cache-Control Bypass | GHSA-6wqw-2p9w-4vw4 |
| hono | Moderate | IP Spoofing Bypass | GHSA-r354-f388-2fhh |
| hono | Moderate | Arbitrary Key Read | GHSA-w332-q679-j88p |
| lodash | Moderate | Prototype Pollution | GHSA-xxjr-mmjv-4gpg |

### Remediation

```bash
# Update Next.js to patched version
npm install next@16.1.6

# Or run automatic fix (may include breaking changes)
npm audit fix --force
```

---

## 2. Critical Vulnerabilities

### 2.1 Hardcoded Site Password (CRITICAL)

**Location:**
- `src/middleware.ts:41`
- `src/app/api/auth/site-access/route.ts:4`

**Vulnerability:** Site password `hromada!2026` is hardcoded in source code and committed to version control.

**Impact:** Anyone with access to the repository can bypass site protection.

**Proof of Concept:**
```typescript
// File: src/middleware.ts:41
const SITE_PASSWORD = 'hromada!2026';
```

**Remediation:**
```typescript
// Move to environment variable
const SITE_PASSWORD = process.env.SITE_PASSWORD;
if (!SITE_PASSWORD) {
  throw new Error('SITE_PASSWORD environment variable is required');
}
```

**Priority:** Immediate

---

### 2.2 Site Access Cookie Not HttpOnly (CRITICAL)

**Location:** `src/app/api/auth/site-access/route.ts:31`

**Vulnerability:** Site access cookie is set with `httpOnly: false`, making it accessible to JavaScript and vulnerable to XSS attacks.

**Impact:** Cross-site scripting attacks could steal site access credentials.

**Proof of Concept:**
```typescript
// Current vulnerable code
cookieStore.set(COOKIE_NAME, password, {
  httpOnly: false, // VULNERABLE
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: COOKIE_MAX_AGE,
  path: '/',
});
```

**Remediation:**
```typescript
// Set httpOnly to true
cookieStore.set(COOKIE_NAME, password, {
  httpOnly: true, // SECURE
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict', // Also upgrade to strict
  maxAge: COOKIE_MAX_AGE,
  path: '/',
});

// Update middleware to verify via server-side method instead of cookie value
```

**Priority:** Immediate

---

### 2.3 Public File Upload Without Rate Limiting (CRITICAL)

**Location:** `src/app/api/upload/public/route.ts`

**Vulnerability:** Public file upload endpoint has no rate limiting, enabling abuse.

**Impact:**
- Storage exhaustion attacks
- Cost amplification via unlimited uploads
- Potential malware hosting

**Remediation:**
```typescript
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

// Add at the start of POST handler
export async function POST(request: NextRequest) {
  // Rate limit: 5 uploads per hour per IP
  const rateLimitResponse = rateLimit(request, {
    limit: 5,
    windowSeconds: 3600,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }
  // ... rest of handler
}
```

**Priority:** Immediate

---

## 3. High Severity Vulnerabilities

### 3.1 In-Memory Rate Limiting (HIGH)

**Location:** `src/lib/rate-limit.ts`

**Vulnerability:** Rate limiting uses in-memory storage, which:
- Resets on application restart
- Doesn't work in multi-instance deployments
- Can be bypassed by waiting for server restart

**Impact:** Brute force and DoS attacks may succeed against distributed deployments.

**Remediation:**
```typescript
// Use Redis for distributed rate limiting
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const key = `rate_limit:${getClientIP(request)}:${config.path}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, config.windowSeconds);
  }

  if (current > config.limit) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  return null;
}
```

**Priority:** Before production deployment

---

### 3.2 Multiple Authentication Paths (HIGH)

**Location:** `src/lib/auth.ts`

**Vulnerability:** Three different authentication methods increase attack surface:
1. JWT session cookies (secure)
2. Bearer token header (no expiration)
3. Legacy base64 session (deprecated, still active)

**Impact:** Legacy methods bypass session expiration and validation.

**Remediation:**
1. Set deprecation timeline for legacy auth
2. Add expiration validation to Bearer tokens
3. Log warnings when legacy auth is used
4. Eventually remove legacy support

```typescript
// Add warning log for legacy auth usage
if (session.isLegacyAdmin) {
  console.warn('[SECURITY] Legacy admin session used - schedule migration');
  await logAuditEvent(AuditAction.SUSPICIOUS_ACTIVITY, {
    details: 'Legacy authentication method used',
    ipAddress: getClientIp(request),
  });
}
```

**Priority:** High

---

### 3.3 Missing CSRF Protection (HIGH)

**Location:** All state-changing API endpoints

**Vulnerability:** No CSRF tokens are validated on POST/PATCH/DELETE requests. While SameSite=lax cookies provide partial protection, they don't protect against certain attack vectors.

**Impact:** Cross-site request forgery attacks could:
- Create unauthorized submissions
- Modify project data
- Delete content

**Remediation:**
```typescript
// Generate CSRF token on session creation
import { generateCsrfToken } from '@/lib/security';

// In createSession function:
const csrfToken = generateCsrfToken();
// Include in response and validate on subsequent requests

// Add middleware validation:
export function validateCsrf(request: NextRequest): boolean {
  const cookieToken = request.cookies.get('csrf_token')?.value;
  const headerToken = request.headers.get('X-CSRF-Token');
  return cookieToken && headerToken && cookieToken === headerToken;
}
```

**Priority:** High

---

### 3.4 Potential XSS via dangerouslySetInnerHTML (HIGH)

**Location:** Multiple components
- `src/components/map/ProjectPopup.tsx:40,60`
- `src/components/projects/ProjectCard.tsx:96,113`
- `src/components/map/CategoryFilter.tsx:43`
- Multiple page components

**Vulnerability:** Components use `dangerouslySetInnerHTML` for rendering icons. While currently using static SVG content, any future changes could introduce XSS.

**Current Usage:**
```typescript
dangerouslySetInnerHTML={{ __html: categoryConfig.icon }}
```

**Impact:** If icon configurations are modified to include user input, XSS becomes possible.

**Remediation:**
1. Verify all `dangerouslySetInnerHTML` uses static, trusted content
2. Consider using React icon components instead
3. Add Content Security Policy that restricts inline scripts

```typescript
// Safer approach using React components
import { Hospital, School, Droplet, Zap, Package } from 'lucide-react';

const CATEGORY_ICONS = {
  HOSPITAL: Hospital,
  SCHOOL: School,
  WATER: Droplet,
  ENERGY: Zap,
  OTHER: Package,
};

// Usage
const IconComponent = CATEGORY_ICONS[category];
<IconComponent className="w-5 h-5" />
```

**Priority:** High

---

### 3.5 Email Template Injection Risk (HIGH)

**Location:** `src/lib/email.ts`

**Vulnerability:** User input is directly interpolated into HTML email templates without sanitization.

**Proof of Concept:**
```typescript
// Current vulnerable code
<p><strong>Name:</strong> ${donorName}</p>
<p style="white-space: pre-wrap;">${message}</p>
```

**Impact:** Malicious input could inject HTML/CSS into emails, potentially for phishing.

**Remediation:**
```typescript
import { sanitizeInput } from '@/lib/security';

// Sanitize all user inputs before email template insertion
const safeHtml = `
  <p><strong>Name:</strong> ${sanitizeInput(donorName)}</p>
  <p style="white-space: pre-wrap;">${sanitizeInput(message)}</p>
`;
```

**Priority:** High

---

## 4. Medium Severity Vulnerabilities

### 4.1 Database Image Limit Not Enforced (MEDIUM)

**Location:** `prisma/schema.prisma`

**Vulnerability:** The 5-image limit per project is only enforced at application layer, not database level.

**Remediation:** Add database trigger or check constraint.

---

### 4.2 User Enumeration Possible (MEDIUM)

**Location:** `src/app/api/auth/login/route.ts`

**Vulnerability:** Different response for non-existent vs existing users with wrong password could allow enumeration via timing analysis.

**Remediation:** Ensure consistent timing for all login responses.

---

### 4.3 Excessive Error Details (MEDIUM)

**Location:** Various API routes

**Vulnerability:** Some error responses include internal details like database structure.

**Remediation:** Sanitize error responses in production.

---

### 4.4 No Request Signing (MEDIUM)

**Vulnerability:** Public API endpoints don't verify request integrity.

**Remediation:** Implement HMAC request signing for sensitive endpoints.

---

### 4.5 Audit Logs Not Immutable (MEDIUM)

**Location:** `prisma/schema.prisma` - AuditLog model

**Vulnerability:** Audit logs stored in same database, could be modified.

**Remediation:** Use append-only external audit service.

---

### 4.6 Missing Password Reset (MEDIUM)

**Vulnerability:** No self-service password reset mechanism.

**Remediation:** Implement secure password reset with time-limited tokens.

---

### 4.7 Session Not Bound to Client (MEDIUM)

**Vulnerability:** Sessions not bound to IP or user-agent, susceptible to token theft.

**Remediation:** Add client binding to session validation.

---

### 4.8 SSL Certificate Validation Disabled (MEDIUM)

**Location:** Database connection configuration

**Vulnerability:** `rejectUnauthorized: false` in Supabase connection.

**Remediation:** Enable certificate validation in production.

---

## 5. Low Severity & Informational

### Low Priority Issues
1. No API documentation (OpenAPI/Swagger)
2. Geo-blocking requires edge runtime geo data (platform-dependent)
3. Inconsistent input validation patterns
4. Missing 2FA support for admin accounts
5. No secrets management system
6. Cookie expiration (7 days) may be too long

### Informational
1. Consider implementing OAuth2/OIDC
2. Add security.txt file
3. Implement bug bounty program
4. Add penetration testing schedule

---

## 6. Security Configuration Review

### 6.1 Security Headers Status

| Header | Status | Value |
|--------|--------|-------|
| X-Frame-Options | PASS | DENY |
| X-Content-Type-Options | PASS | nosniff |
| X-XSS-Protection | PASS | 1; mode=block |
| Referrer-Policy | PASS | strict-origin-when-cross-origin |
| Permissions-Policy | PASS | camera=(), microphone=(), geolocation=() |
| Content-Security-Policy | PARTIAL | Uses unsafe-inline (required by Next.js) |
| HSTS | PASS | max-age=31536000 (production only) |

### 6.2 Authentication Configuration

| Setting | Value | Recommendation |
|---------|-------|----------------|
| Password Min Length | 12 chars | PASS |
| Uppercase Required | Yes | PASS |
| Lowercase Required | Yes | PASS |
| Number Required | Yes | PASS |
| Special Char Required | Yes | PASS |
| Max Login Attempts | 5 | PASS |
| Lockout Duration | 15 min | PASS |
| Session Duration | 7 days | Consider reducing to 24h |
| JWT Algorithm | HS256 | Consider RS256 for better security |

### 6.3 Rate Limiting Configuration

| Endpoint | Limit | Window | Status |
|----------|-------|--------|--------|
| Login | 5/min | 60s | PASS |
| Contact Form | 5/min | 60s | PASS |
| Project Submission | 10/hour | 3600s | PASS |
| General API | 100/min | 60s | PASS |
| Public Upload | None | N/A | FAIL |

---

## 7. Compliance Assessment

### 7.1 GDPR Considerations

| Requirement | Status | Notes |
|-------------|--------|-------|
| Data minimization | PARTIAL | Collects necessary data only |
| Consent | PARTIAL | No explicit consent mechanism |
| Right to deletion | FAIL | No self-service deletion |
| Data portability | FAIL | No export feature |
| Privacy policy | UNKNOWN | Not reviewed |

### 7.2 PCI-DSS (If handling payments)

**Current Status:** N/A - Platform does not handle payment data directly.

**Recommendation:** If payment processing is added:
1. Use PCI-compliant payment provider (Stripe, etc.)
2. Never store card data
3. Implement additional access controls

---

## 8. Prioritized Remediation Plan

### Immediate (Week 1)
1. Move hardcoded password to environment variable
2. Set httpOnly=true on site access cookie
3. Add rate limiting to public upload endpoint
4. Update Next.js to 16.1.6

### Short-term (Week 2-4)
5. Implement CSRF protection
6. Sanitize email template inputs
7. Migrate to Redis-based rate limiting
8. Add deprecation warnings for legacy auth

### Medium-term (Month 2)
9. Implement password reset functionality
10. Add 2FA for admin accounts
11. Bind sessions to client fingerprint
12. Enable SSL certificate validation

### Long-term (Month 3+)
13. Implement OAuth2/OIDC
14. Add secrets management
15. Set up external audit logging
16. Implement comprehensive API documentation

---

## 9. Security Testing Recommendations

### Automated Testing
- Run `npm audit` in CI/CD pipeline
- Execute security test suite on every PR
- Implement SAST scanning (Semgrep, CodeQL)
- Add dependency scanning (Snyk, Dependabot)

### Manual Testing
- Annual penetration test by third party
- Quarterly security review
- Red team exercises for critical features

### Monitoring
- Set up alerts for failed login attempts
- Monitor rate limit triggers
- Log and alert on suspicious patterns
- Track audit log anomalies

---

## Appendix A: Files Reviewed

```
src/lib/auth.ts
src/lib/security.ts
src/lib/rate-limit.ts
src/lib/email.ts
src/middleware.ts
src/app/api/auth/login/route.ts
src/app/api/auth/register/route.ts
src/app/api/auth/site-access/route.ts
src/app/api/projects/route.ts
src/app/api/upload/public/route.ts
src/app/api/contact/route.ts
prisma/schema.prisma
package.json
```

## Appendix B: Tools Used

- npm audit (dependency scanning)
- Manual code review
- Custom security test suite
- Grep-based secret scanning

---

**Report Generated:** February 4, 2026
**Next Review Due:** May 4, 2026
