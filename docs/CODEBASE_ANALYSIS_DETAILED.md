# Hromada Codebase Analysis - Detailed Report

**Date:** January 28, 2026
**Version:** 1.0
**Analysts:** Claude Code Analysis

---

## Table of Contents

1. [Security Analysis](#1-security-analysis)
2. [Performance Analysis](#2-performance-analysis)
3. [UI/UX Analysis](#3-uiux-analysis)
4. [Code Quality Analysis](#4-code-quality-analysis)
5. [Recommendations Summary](#5-recommendations-summary)

---

## 1. Security Analysis

### 1.1 Authentication & Authorization

#### CRITICAL: Weak Session Token Construction
**File:** `src/app/api/auth/login/route.ts` (lines 45-46)

```typescript
const sessionToken = Buffer.from(`${adminSecret}:${Date.now()}`).toString('base64')
```

**Issue:** The session token is simply base64-encoded and contains the actual admin secret. Anyone who can decode the cookie can extract the admin password.

**Risk:** If a cookie is leaked (via XSS, network interception, logs), the admin secret is compromised.

**Recommendation:**
```typescript
import crypto from 'crypto'
const sessionToken = crypto.randomBytes(32).toString('hex')
// Store session server-side or use signed JWTs
```

---

#### CRITICAL: Default Password Fallback
**File:** `src/app/api/admin/verify/route.ts` (line 5)

```typescript
const expectedAuth = `Basic ${Buffer.from(`admin:${process.env.ADMIN_PASSWORD || 'admin'}`).toString('base64')}`
```

**Issues:**
1. Falls back to 'admin' as default password
2. Uses different env var than main auth (`ADMIN_PASSWORD` vs `HROMADA_ADMIN_SECRET`)

**Recommendation:** Remove this endpoint or align with main auth system. Never use default credentials.

---

#### Good Practices Observed ✓
- httpOnly cookie flag set correctly
- Secure flag enabled in production
- SameSite set to 'lax'
- Admin verification on all protected endpoints

---

### 1.2 Input Validation

#### Present and Working
- Email regex validation in contact API
- Message length limits (1000 chars)
- Coordinate range validation
- Required field checks

#### Missing Validation
**File:** `src/app/api/projects/[id]/route.ts`

PUT endpoint does not validate field lengths like POST does. POST validates `briefDescription` (150 chars) and `fullDescription` (2000 chars), but PUT allows updates without these checks.

---

### 1.3 Rate Limiting

**File:** `src/lib/rate-limit.ts`

**Current Implementation:**
- Contact form: 5/minute
- Project submissions: 3/hour
- Login attempts: 5/minute
- General API: 100/minute

**Issues:**
1. In-memory storage (lost on restart, doesn't work across instances)
2. IP can be spoofed via `x-forwarded-for` header

**Recommendation:** Migrate to Redis for production. Ensure trusted proxy validates headers.

---

### 1.4 File Upload Security

**File:** `src/app/api/upload/public/route.ts`

**HIGH RISK:** Public upload endpoint has no rate limiting.

**Good Practices:**
- File type validation (images only)
- File size limit (5MB)
- Random filename generation

---

### 1.5 XSS Prevention

**Status:** Generally safe

- No `dangerouslySetInnerHTML` usage found
- React's default escaping used throughout

**Exception:** Email templates interpolate user data without HTML encoding:
```typescript
html: `<p>${message}</p>` // User message directly in HTML
```

---

### 1.6 Security Summary Table

| Issue | Severity | Status |
|-------|----------|--------|
| Session token exposes secret | Critical | Needs fix |
| Default password fallback | Critical | Needs fix |
| Public upload no rate limit | High | Needs fix |
| Legacy auth endpoint | High | Remove |
| PUT validation missing | Medium | Needs fix |
| Email HTML injection | Medium | Needs fix |
| In-memory rate limiting | Medium | Production concern |
| IP spoofing potential | Medium | Infrastructure fix |
| No CSRF tokens | Low | Consider adding |
| No CSP headers | Low | Consider adding |

---

## 2. Performance Analysis

### 2.1 Database Queries

#### Inefficient: All Projects for Map
**File:** `src/app/api/projects/route.ts` (lines 44-63)

```typescript
if (allParam === 'true') {
  const projects = await prisma.project.findMany({
    where,
    include: { photos: { orderBy: { sortOrder: 'asc' } } },
    // No limit - fetches everything
  })
}
```

**Current:** 66 projects fetched for map
**Problem:** Won't scale. At 1000+ projects, this becomes slow and memory-intensive.

**Recommendation:** Implement viewport-based loading:
```typescript
// GET /api/projects?bbox=minLng,minLat,maxLng,maxLat
```

---

#### Database Indexes (Current)
```prisma
@@index([category])
@@index([status])
@@index([urgency])
@@index([projectType])
@@index([createdAt])
```

**Missing Indexes:**
- Composite index: `[category, status, urgency]`
- Text search: `[municipalityName]`
- Range queries: `[estimatedCostUsd]`

---

### 2.2 Image Optimization

**Files:** `ProjectCard.tsx`, `projects/[id]/page.tsx`

**Current:** Using native `<img>` tags
```typescript
<img src={mainPhoto} alt={...} className="..." />
```

**Issues:**
- No lazy loading
- No srcset for responsive images
- No blur placeholder
- No automatic WebP conversion

**Recommendation:**
```typescript
import Image from 'next/image'
<Image
  src={mainPhoto}
  alt={...}
  fill
  sizes="(max-width: 768px) 100vw, 33vw"
  placeholder="blur"
/>
```

---

### 2.3 Caching

**Current State:** No caching implemented

**Missing:**
- No HTTP cache headers on API responses
- No client-side caching (SWR/React Query)
- No static generation for public pages

**Recommendations:**

1. Add cache headers:
```typescript
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  },
})
```

2. Use SWR for client caching:
```typescript
const { data } = useSWR('/api/projects?all=true', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60000,
})
```

---

### 2.4 Bundle Size

**Good Practices:**
- Dynamic import for Leaflet map
- Tree-shakeable icon library (lucide-react)

**Issues:**
- Types and config bundled together in `/src/types/index.ts`
- No bundle analyzer configured

---

### 2.5 Server-Side Rendering

**Current:** Full client-side rendering
```typescript
'use client' // At top of homepage and project pages
```

**Impact:**
- SEO: Content not indexable
- Performance: User sees spinner before content
- TTFP: Delayed by client-side fetch

**Recommendation:** Hybrid approach
```typescript
// Server Component
export default async function HomePage() {
  const initialProjects = await getProjects({ limit: 20 })
  return <HomePageClient initialProjects={initialProjects} />
}
```

---

### 2.6 Performance Summary Table

| Issue | Impact | Effort |
|-------|--------|--------|
| All projects for map | High | Medium |
| Native img tags | High | Low |
| No cache headers | Medium | Low |
| Client-side rendering | Medium | Medium |
| Missing indexes | Medium | Low |
| In-memory rate limit | Medium | Medium |
| Bundle not analyzed | Low | Low |

---

## 3. UI/UX Analysis

### 3.1 Accessibility (a11y)

#### Good Practices ✓
- ARIA attributes on buttons and toasts
- Keyboard navigation on project cards
- Focus-visible styles in global CSS
- `tabIndex` and `onKeyDown` handlers

#### Issues

**Missing Skip Link**
No skip-to-content link for keyboard users.

**Missing ARIA Labels**
- Filter dropdowns lack aria-label attributes
- Price range sliders missing aria-valuemin/max/now

**LoadingSpinner Missing Screen Reader Text**
```typescript
// Current
<div className="animate-spin..." />
// Needs
<div role="status" aria-label="Loading" />
```

---

### 3.2 Responsive Design

#### Working Well
- Tailwind breakpoints used consistently
- Grid layouts adapt (`grid-cols-1 sm:grid-cols-2`)
- Map hidden on mobile with toggle button

#### Critical Gap: Mobile Map
**File:** `src/app/[locale]/(public)/page.tsx` (line 738)
```typescript
alert('Mobile map view coming soon!')
```

The map is a core feature but unavailable on mobile devices.

---

### 3.3 Loading States

#### Excellent Implementation
- `LoadingSpinner` component with size variants
- Comprehensive `Skeleton` components
- Button with built-in `isLoading` prop
- Map wrapper with loading fallback

#### Not Utilized
- Homepage shows spinner instead of skeleton layout
- Project detail page uses only spinner

---

### 3.4 Error Handling UI

#### Good
- Toast system for notifications
- Inline form validation errors
- 404 page for missing projects

#### Issues
**Homepage API Errors Not Shown**
```typescript
} catch (error) {
  console.error('Failed to fetch projects:', error)
  // No user feedback!
}
```

**Admin Uses Browser Alert**
```typescript
alert('Failed to approve submission')
// Should use Toast system
```

---

### 3.5 Internationalization

#### Excellent Implementation
- next-intl properly configured
- Comprehensive EN/UK translations
- Language switcher in header
- ICU message format support

#### Gaps
- Some admin strings hardcoded in English
- "Show More" text hardcoded
- Pagination controls not translated

---

### 3.6 UI/UX Summary Table

| Issue | Priority | Category |
|-------|----------|----------|
| Mobile map not implemented | High | Responsive |
| Skip-to-content missing | High | Accessibility |
| API errors not shown | High | Error handling |
| ARIA labels missing | Medium | Accessibility |
| Hardcoded strings | Medium | i18n |
| Alerts instead of toasts | Medium | Consistency |
| No breadcrumbs | Low | Navigation |
| No form progress indicator | Low | UX |

---

## 4. Code Quality Analysis

### 4.1 Code Organization

#### Strengths
- Clean Next.js App Router structure
- Logical component organization
- Proper separation of concerns
- Index files for barrel exports

#### Issues
- Empty `src/lib/api/index.ts` (only TODO comment)
- Some domain overlap in form components

---

### 4.2 TypeScript

#### Errors Found
1. Missing `@types/leaflet.markercluster`
2. Prisma field mismatch (`municipalityNameUk` in submissions)
3. `photos` property doesn't exist on `ProjectSubmissionCreateInput`

#### Type Safety Issues
```typescript
const where: any = {} // Should be Prisma.ProjectWhereInput
projectType: submission.projectType as any || null // Type assertion
```

---

### 4.3 Code Duplication

#### Significant Duplications

**Form Components** (70% identical)
- `InquiryForm.tsx` (212 lines)
- `ContactForm.tsx` (226 lines)

**Photo Transformation** (repeated 3 times)
```typescript
photos: project.photos.map((img) => img.url)
```

**Admin Auth Check** (repeated 5+ times)
```typescript
const isAuthorized = await verifyAdminAuth(request)
if (!isAuthorized) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Email Regex** (defined 4 times)
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

---

### 4.4 Component Size

#### Large Components
| File | Lines | Recommendation |
|------|-------|----------------|
| `(public)/page.tsx` | 754 | Split into 4+ components |
| `admin/page.tsx` | 1155 | Split into sections |
| `ProjectForm.tsx` | 537 | Extract form sections |

---

### 4.5 State Management

#### Good Practices
- Appropriate useState usage
- useCallback and useMemo for optimization
- Custom useAdminAuth hook

#### Issues
- Homepage has 15+ useState calls
- No URL param persistence for filters
- Tightly coupled map/list state

---

### 4.6 API Design

#### Good Practices
- RESTful conventions
- Cursor-based pagination
- Consistent error format

#### Inconsistencies
```typescript
// Different response structures
{ projects, pagination }
{ submission, municipalityEmail }
{ success: true }
```

---

### 4.7 Code Quality Summary Table

| Issue | Severity | Effort |
|-------|----------|--------|
| TypeScript errors | High | Low |
| 754-line homepage | Medium | Medium |
| Duplicate forms | Medium | Medium |
| Repeated patterns | Medium | Low |
| Any types used | Low | Low |
| Empty lib file | Low | Trivial |

---

## 5. Recommendations Summary

### Immediate Actions (Week 1)

#### Security
1. **Fix session token** - Use crypto.randomBytes()
2. **Remove default password** - Delete fallback in verify route
3. **Rate limit uploads** - Add to public upload endpoint

### Short-term (Weeks 2-3)

#### Performance
4. **Add cache headers** - Public API responses
5. **Use Next.js Image** - Replace all `<img>` tags
6. **Viewport map loading** - Implement bbox parameter

#### UI/UX
7. **Mobile map view** - Full-screen modal/drawer
8. **Skip links** - Add to layout
9. **Error feedback** - Show API errors to users

### Medium-term (Weeks 4-6)

#### Code Quality
10. **Split homepage** - FilterBar, ProjectList, MapView
11. **Fix TypeScript** - Install types, fix errors
12. **Consolidate forms** - Merge InquiryForm/ContactForm

#### Infrastructure
13. **Redis rate limiting** - For production scaling
14. **SSR hybrid** - Server-render initial data

### Long-term (Month 2+)

15. **API versioning** - `/api/v1/` prefix
16. **OpenAPI docs** - Document API endpoints
17. **E2E tests** - Playwright for critical flows
18. **Bundle analysis** - Monitor bundle size

---

## Appendix: Files Referenced

| Category | Key Files |
|----------|-----------|
| Auth | `src/app/api/auth/login/route.ts`, `src/lib/auth.ts` |
| API | `src/app/api/projects/route.ts`, `src/app/api/contact/route.ts` |
| Components | `src/components/ui/*.tsx`, `src/components/map/*.tsx` |
| Pages | `src/app/[locale]/(public)/page.tsx`, `src/app/[locale]/admin/page.tsx` |
| Config | `src/lib/rate-limit.ts`, `prisma/schema.prisma` |
| Styles | `src/app/globals.css` |
| i18n | `locales/en.json`, `locales/uk.json` |

---

*Report generated by Claude Code Analysis*
