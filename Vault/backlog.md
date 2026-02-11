# Backlog

Prioritized list of upcoming work. Items move from here into sprint planning.

Source: [Codebase Analysis Summary](../docs/CODEBASE_ANALYSIS_SUMMARY.md) + ongoing feature work.

---

## Security #p0

- [ ] Fix session token vulnerability (base64 → crypto.randomBytes) #p0 @sloan
- [ ] Remove default password fallback in `/api/admin/verify` #p0 @sloan
- [ ] Add rate limiting to public file upload #p1
- [ ] Audit all API endpoints for authentication/authorization #p1
- [ ] Add CSRF protection to mutation endpoints #p2
- [ ] Implement Content Security Policy headers #p2
- [ ] Add input sanitization to all user-facing forms #p2

## Performance #p1

- [ ] Add `Cache-Control` headers to public API routes #p1
- [ ] Replace native `<img>` with Next.js `<Image>` component #p1
- [ ] Implement viewport-based map loading #p1
- [ ] Implement hybrid SSR/CSR for homepage #p2
- [ ] Add database query optimization (indexes, pagination) #p2
- [ ] Implement API response compression #p3
- [ ] Add service worker for offline support #p3

## Accessibility #p1

- [ ] Implement mobile map view (currently "coming soon") #p1
- [ ] Add skip-to-content navigation links #p2
- [ ] Add ARIA labels to all form elements #p2
- [ ] Keyboard navigation for map component #p2
- [ ] Color contrast audit and fixes #p3
- [ ] Screen reader testing pass #p3

## Code Quality #p2

- [ ] Decompose 754-line homepage into components #p2
- [ ] Consolidate InquiryForm and ContactForm #p2
- [ ] Fix remaining 3 TypeScript errors #p3
- [ ] Add missing type definitions for Leaflet clustering #p3
- [ ] Increase test coverage from 30% to 60% #p2
- [ ] Add E2E tests for critical flows (donate, browse projects) #p2

## Features — Donor Experience #p2

- [ ] Project search and filtering #p2
- [ ] Donor accounts and donation history #p2
- [ ] Project update notifications #p3
- [ ] Impact reporting with progress photos #p3
- [ ] Social sharing for projects #p3

## Features — Municipal Tools #p3

- [ ] Municipal dashboard for project management #p3
- [ ] Progress reporting tools #p3
- [ ] Photo/document upload for project updates #p3
- [ ] Budget tracking and transparency reports #p3

## Infrastructure #p2

- [ ] Set up CI/CD pipeline with automated testing #p2
- [ ] Add error monitoring (Sentry or similar) #p2
- [ ] Set up staging environment #p2
- [ ] Database backup automation #p2
