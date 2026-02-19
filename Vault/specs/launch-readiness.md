---
title: "Launch Readiness"
created: "2026-02-12"
status: In Progress
owner: "@sloan @tom"
---

# Launch Readiness

## Summary

This spec defines what "launch" means for Hromada, the conditions that must be met, and a phased checklist to get there. Launch = the platform can accept real donations from real donors with real money flowing to Ukrainian municipalities.

## What Launch Means

**Launch** is the point at which we publicly share the URL and invite donors to contribute. At launch:

1. A donor can visit the site, find a project, and see payment instructions with **real bank details**
2. A donor can confirm a contribution and track it through their dashboard
3. A nonprofit manager can verify receipt and initiate outbound transfers
4. The fiscal sponsorship is legally formalized (FSA signed)
5. The site is secure enough to handle public traffic without known critical vulnerabilities
6. The platform correctly represents POCACITO Network as fiscal sponsor with accurate legal/tax information

## What Launch Does NOT Require

- Automated payment detection (Plaid) — manual confirmation is fine for launch
- Automated outbound tracking (Wise API) — manual wire transfers are fine
- ACH or credit card payments — wire/DAF/check covers our donor profile
- Mobile map view — "coming soon" is acceptable
- 100% test coverage — ~70% is sufficient
- CI/CD pipeline — manual deploys via Vercel are fine for launch
- Municipal Partnership matching system — the landing page + inquiry form is enough

---

## Dependency Map

```
FSA Signed (legal)
    ├── Real bank details from POCACITO
    │       └── Replace placeholder bank details in SupportProjectCard
    │               └── ✅ LAUNCH READY (payment flow)
    └── Confirmed tax-deductibility language
            └── Verify receipt/dashboard language matches FSA terms

Security Fixes (technical)
    ├── Fix session token vulnerability (crypto.randomBytes)
    ├── Remove default password fallback
    ├── Set httpOnly on site access cookie
    ├── Move hardcoded site password to env var
    └── Add rate limiting to public upload
            └── ✅ LAUNCH READY (security)

Nonprofit Dashboard (operational)
    ├── Connect to real donation APIs (not mock data)
    └── Test end-to-end flow with real data
            └── ✅ LAUNCH READY (operations)
```

---

## Launch Blockers (Must-Have)

### Legal / FSA

- [x] FSA drafted @sloan @tom
- [x] FSA reviewed and approved by attorney @tom ← Feb 19, 2026
- [ ] FSA sent to POCACITO board for review @tom ← **Feb 20, 2026**
- [ ] FSA signed by both parties #p0 @tom
- [ ] Real bank details obtained from POCACITO (routing, account, SWIFT) #p0 @sloan
- [ ] Bank details replaced in `SupportProjectCard.tsx` #p0 @sloan
- [ ] Tax-deductibility language in donor dashboard verified against FSA #p1 @sloan

### Security (Critical + High from Audit) ✅ COMPLETE

- [x] Fix session token vulnerability — now using JWT with jose (not base64) @sloan
- [x] Remove default password fallback — ADMIN_PASSWORD env var required @sloan
- [x] Set `httpOnly: true` on site access cookie @sloan
- [x] Move hardcoded site password to `SITE_PASSWORD` env var @sloan
- [x] Add rate limiting to `/api/upload/public` @sloan
- [x] Update Next.js to 16.1.6 (latest, patched) @sloan
- [x] Sanitize user input in email templates (sanitizeInput from security lib) @sloan

### Operational

- [ ] Connect nonprofit dashboard to real donation/wire-transfer APIs #p1 @sloan
- [ ] Test full donation flow end-to-end (project → confirm → email → dashboard) #p1 @sloan
- [ ] Verify Resend email delivery in production (not just dev) #p1 @sloan
- [ ] Set all production environment variables in Vercel #p1 @sloan
- [ ] Configure custom domain with SSL #p1 @sloan

### Content / Legal Pages

- [ ] Review Terms of Service for accuracy with FSA terms #p1 @tom
- [ ] Review Privacy Policy — ensure it covers donor data collection #p1 @tom
- [ ] Verify all POCACITO Network references are accurate (name, EIN, address) #p1 @sloan

---

## Launch Nice-to-Haves (Should-Have)

These improve the launch experience but don't block it:

- [x] CSRF protection on state-changing endpoints (Origin header verification)
- [ ] Redis-based rate limiting (in-memory is OK for initial low traffic) #p2
- [x] Donor password reset flow
- [ ] Receipt/tax documentation PDF generation #p2
- [x] Sentry error monitoring (configured, production-only)
- [ ] E2E tests for critical donation flow #p2

---

## Post-Launch Priorities

Immediately after launch, focus shifts to:

1. **Monitor** — Watch for errors, failed donations, security anomalies
2. **Plaid integration** — Automate incoming payment detection
3. **Wise API** — Track outbound transfers to Ukraine
4. **Receipt generation** — PDF tax receipts for donors
5. **Password reset** — Self-service for donors

---

## Launch Checklist (Day-Of)

### Before flipping the switch:

- [ ] All launch blockers above are marked done
- [ ] Production environment variables confirmed in Vercel
- [ ] Database migrated with production schema
- [ ] Test donation flow on production URL
- [ ] Admin can log in and access dashboard
- [ ] Nonprofit manager can log in and see donations
- [ ] Emails are sending from production
- [ ] Geo-blocking active (RU/BY)
- [ ] Site password removed or changed for public access
- [ ] Custom domain configured and SSL active
- [ ] Google Analytics or similar tracking in place (optional)

### After launch:

- [ ] Monitor error logs for first 24 hours
- [ ] Verify first real donation flows through correctly
- [ ] Check email deliverability (spam folder issues?)
- [ ] Review audit logs for any anomalies

---

## Open Questions

- What is the launch target date? (Blocked by FSA timeline)
- Do we want a "soft launch" (invite-only donors) before going fully public?
- Should we keep site password protection during soft launch?
- Who handles donor support inquiries at launch? (Tom? Shared inbox?)
- Do we need a press release or announcement strategy?

## Related

- Spec: [[specs/fiscal-sponsorship]]
- Spec: [[specs/security-hardening]]
- Spec: [[specs/payment-processing]]
- Sprint: [[current-sprint]]
