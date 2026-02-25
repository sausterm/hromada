# Hromada Platform - Security Hardening Checklist

This checklist is specific to the Hromada tech stack (Next.js 16, Prisma, PostgreSQL, Supabase).

---

## Pre-Deployment Checklist

### Environment & Secrets

- [ ] **Move hardcoded password to environment variable**
  ```bash
  # Add to .env.local and deployment secrets
  SITE_PASSWORD=<strong-random-password>
  ```

- [ ] **Verify all required environment variables are set**
  ```bash
  # Required variables
  DATABASE_URL=
  DIRECT_URL=
  SESSION_SECRET=<32+ character random string>
  HROMADA_ADMIN_SECRET=<strong-random-password>
  ADMIN_EMAIL=
  AWS_SES_REGION=
  AWS_SES_FROM_EMAIL=
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  ```

- [ ] **Use different secrets for each environment**
  - Development, staging, and production should have unique secrets
  - Never reuse SESSION_SECRET across environments

- [ ] **Add secrets to .gitignore**
  ```
  .env.local
  .env.production.local
  .env*.local
  ```

### Dependencies

- [ ] **Update vulnerable dependencies**
  ```bash
  npm audit fix
  npm install next@16.1.6
  ```

- [ ] **Enable Dependabot or Snyk**
  - Set up automated dependency updates
  - Configure security alerts

- [ ] **Lock dependency versions**
  ```bash
  npm ci  # Use in CI/CD instead of npm install
  ```

### Authentication

- [ ] **Set httpOnly=true on site access cookie**
  ```typescript
  // src/app/api/auth/site-access/route.ts
  cookieStore.set(COOKIE_NAME, hashedValue, {
    httpOnly: true,  // Change from false
    secure: true,
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
  ```

- [ ] **Remove or deprecate legacy auth methods**
  - Add deprecation warning for base64 sessions
  - Plan migration timeline

- [ ] **Implement session binding** (recommended)
  ```typescript
  // Add to JWT payload
  const sessionPayload = {
    userId,
    email,
    role,
    sessionVersion,
    clientFingerprint: hashClientInfo(ip, userAgent),
  };
  ```

### API Security

- [ ] **Add rate limiting to public upload**
  ```typescript
  // src/app/api/upload/public/route.ts
  import { rateLimit } from '@/lib/rate-limit';

  export async function POST(request: NextRequest) {
    const rateLimitResponse = rateLimit(request, {
      limit: 5,
      windowSeconds: 3600,
    });
    if (rateLimitResponse) return rateLimitResponse;
    // ... rest of handler
  }
  ```

- [ ] **Implement CSRF protection**
  ```typescript
  // Add to state-changing endpoints
  const csrfToken = request.headers.get('X-CSRF-Token');
  const cookieToken = request.cookies.get('csrf_token')?.value;
  if (!csrfToken || csrfToken !== cookieToken) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }
  ```

- [ ] **Sanitize email inputs**
  ```typescript
  // src/lib/email.ts
  import { sanitizeInput } from '@/lib/security';

  // Before template interpolation
  const safeDonorName = sanitizeInput(donorName);
  const safeMessage = sanitizeInput(message);
  ```

### Database

- [ ] **Enable SSL certificate validation**
  ```typescript
  // prisma/schema.prisma or connection string
  ssl: {
    rejectUnauthorized: true,
  }
  ```

- [ ] **Add database constraint for image limit**
  ```sql
  -- Migration
  ALTER TABLE "ProjectImage" ADD CONSTRAINT "max_images_per_project"
    CHECK ((SELECT COUNT(*) FROM "ProjectImage" WHERE "projectId" = "projectId") <= 5);
  ```

- [ ] **Enable Row Level Security (recommended)**
  - Partners should only see their own submissions
  - Configure RLS policies in Supabase

### Infrastructure

- [ ] **Use Redis for rate limiting in production**
  ```bash
  npm install ioredis
  ```
  ```typescript
  // src/lib/rate-limit.ts
  const redis = new Redis(process.env.REDIS_URL);
  ```

- [ ] **Configure proper CORS if needed**
  ```typescript
  // next.config.ts
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-CSRF-Token' },
        ],
      },
    ];
  },
  ```

- [ ] **Set up monitoring and alerting**
  - Failed login attempts > threshold
  - Rate limit triggers
  - Error rate spikes
  - Audit log anomalies

---

## Production Deployment Checklist

### Amplify/Hosting Configuration

- [ ] **Enable HTTPS redirect**
  - Verify HSTS is active
  - Check SSL certificate validity

- [ ] **Set environment variables in hosting platform**
  - All required variables configured
  - No development values in production

- [ ] **Configure custom domain**
  - SSL certificate provisioned
  - DNS properly configured

### Monitoring Setup

- [ ] **Enable error tracking**
  ```bash
  npm install @sentry/nextjs
  ```

- [ ] **Set up uptime monitoring**
  - Monitor critical endpoints
  - Configure alerting

- [ ] **Enable audit log retention**
  - Configure backup schedule
  - Set retention policy

### Security Verification

- [ ] **Run security tests**
  ```bash
  npm test -- --testPathPattern=security
  ```

- [ ] **Verify security headers**
  ```bash
  curl -I https://your-domain.com | grep -E "X-Frame|X-Content|X-XSS|Strict-Transport"
  ```

- [ ] **Test rate limiting**
  - Verify login rate limit works
  - Test upload rate limit
  - Confirm contact form limit

- [ ] **Verify geo-blocking**
  - Test from blocked regions (if possible)
  - Check fallback behavior

---

## CI/CD Security Checklist

### Pipeline Configuration

- [ ] **Add npm audit to CI**
  ```yaml
  - name: Security audit
    run: npm audit --audit-level=high
  ```

- [ ] **Run security tests in CI**
  ```yaml
  - name: Security tests
    run: npm test -- --testPathPattern=security
  ```

- [ ] **Add secret scanning**
  ```yaml
  - name: Scan for secrets
    uses: trufflesecurity/trufflehog@main
  ```

- [ ] **Enable branch protection**
  - Require PR reviews
  - Require passing CI
  - Block force pushes

### Deployment Security

- [ ] **Use deployment previews carefully**
  - Don't expose production secrets in previews
  - Use separate preview environment variables

- [ ] **Implement staged rollouts**
  - Deploy to staging first
  - Verify security in staging
  - Then deploy to production

---

## Ongoing Security Maintenance

### Weekly Tasks

- [ ] Review audit logs for anomalies
- [ ] Check failed login attempts
- [ ] Monitor dependency alerts

### Monthly Tasks

- [ ] Run `npm audit`
- [ ] Update dependencies
- [ ] Review access logs
- [ ] Test backup restoration

### Quarterly Tasks

- [ ] Review and update security policies
- [ ] Rotate secrets (SESSION_SECRET, etc.)
- [ ] Review user access permissions
- [ ] Update security documentation

### Annual Tasks

- [ ] Commission external penetration test
- [ ] Review overall security architecture
- [ ] Update security hardening checklist
- [ ] Conduct security training for team

---

## Incident Response Checklist

### If Credentials Are Compromised

1. [ ] Immediately rotate affected secrets
2. [ ] Force logout all users (increment sessionVersion)
3. [ ] Review audit logs for unauthorized access
4. [ ] Notify affected users if necessary
5. [ ] Document incident and remediation

### If Vulnerability Is Discovered

1. [ ] Assess severity and impact
2. [ ] Implement temporary mitigation if needed
3. [ ] Develop and test fix
4. [ ] Deploy fix to production
5. [ ] Monitor for exploitation attempts
6. [ ] Document and update checklist

### If Data Breach Occurs

1. [ ] Contain the breach
2. [ ] Assess scope and impact
3. [ ] Notify appropriate authorities (GDPR: 72 hours)
4. [ ] Notify affected users
5. [ ] Conduct forensic analysis
6. [ ] Implement additional controls
7. [ ] Document incident fully

---

## Quick Reference Commands

```bash
# Run security tests
npm test -- --testPathPattern=security

# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Generate new secret
openssl rand -base64 32

# Check security headers
curl -I https://your-domain.com

# Test rate limiting
for i in {1..10}; do curl -X POST https://your-domain.com/api/auth/login; done

# View audit logs (if using Prisma)
npx prisma studio
```

---

## Security Contacts

- **Security Issues:** security@hromada.org (recommended to set up)
- **Platform Admin:** [ADMIN_EMAIL from env]
- **Hosting Provider:** AWS Amplify support

---

**Last Updated:** February 4, 2026
**Next Review:** March 4, 2026
