/**
 * Hromada Platform - Edge Middleware
 *
 * Copyright (c) 2025 Thomas D. Protzman and Sloan Austermann
 * All rights reserved.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { jwtVerify } from 'jose';
import { locales } from './i18n';
import { getSecurityHeaders } from '@/lib/security-headers';

// Extend NextRequest type with Vercel's geo/ip data (available at edge runtime)
interface NextRequestWithGeo extends NextRequest {
  geo?: {
    country?: string;
    city?: string;
    region?: string;
  };
  ip?: string;
}

// Countries to block (ISO 3166-1 alpha-2 country codes)
const BLOCKED_COUNTRIES = ['RU', 'BY']; // Russia, Belarus

const AUTH_COOKIE_NAME = 'hromada_site_access';
const SESSION_COOKIE_NAME = 'hromada_session';

// Role-to-path mapping for protected routes
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/nonprofit': ['NONPROFIT_MANAGER', 'ADMIN'],
  '/partner': ['PARTNER', 'ADMIN'],
  '/donor': ['DONOR', 'ADMIN'],
};

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always',
});

/**
 * Derive HMAC token for site-access cookie verification (edge-compatible Web Crypto).
 */
async function deriveHmacToken(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode('hromada_site_access'));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Apply security headers to a response
 */
function applyHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * Verify Origin header matches Host for state-changing requests (CSRF protection).
 */
function verifyOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Browser omits Origin for same-origin GETs
  const host = request.headers.get('host');
  if (!host) return false;
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

/**
 * Lightweight edge JWT verification for protected routes.
 * Returns the role from the token, or null if invalid.
 */
async function getSessionRole(request: NextRequest): Promise<string | null> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) return null;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(
      sessionCookie.value,
      new TextEncoder().encode(secret)
    );
    return (payload as { role?: string }).role || null;
  } catch {
    return null;
  }
}

export default async function middleware(request: NextRequestWithGeo) {
  const pathname = request.nextUrl.pathname;

  // --- API route handling ---
  if (pathname.startsWith('/api/')) {
    // CSRF: verify Origin for state-changing methods
    const method = request.method;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      if (!verifyOrigin(request)) {
        return applyHeaders(
          NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
        );
      }
    }

    // Apply security headers to API responses and pass through
    const response = NextResponse.next();
    return applyHeaders(response);
  }

  // --- Geo-blocking ---
  // Fall back to CloudFront-Viewer-Country for Amplify deployments
  const country = request.geo?.country || request.headers.get('cloudfront-viewer-country') || undefined;

  // Check if accessing the password page (prevent redirect loop)
  if (pathname.includes('/site-access')) {
    const response = intlMiddleware(request);
    return applyHeaders(response);
  }

  // --- Site password gate ---
  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) {
    // If SITE_PASSWORD is not set, allow open access
    const response = intlMiddleware(request);
    return applyHeaders(response);
  }

  const siteAccessCookie = request.cookies.get(AUTH_COOKIE_NAME);
  let siteAccessValid = false;
  if (siteAccessCookie?.value) {
    try {
      const expectedToken = await deriveHmacToken(sitePassword);
      siteAccessValid = siteAccessCookie.value === expectedToken;
    } catch {
      siteAccessValid = false;
    }
  }

  if (!siteAccessValid) {
    const pathSegments = pathname.split('/').filter(Boolean);
    const locale = locales.includes(pathSegments[0] as any) ? pathSegments[0] : 'en';
    const url = new URL(`/${locale}/site-access`, request.url);
    url.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(url);
    return applyHeaders(response);
  }

  // Check if accessing the blocked page already (prevent redirect loop)
  if (pathname.includes('/blocked')) {
    const response = intlMiddleware(request);
    return applyHeaders(response);
  }

  // If country is blocked, redirect to blocked page
  if (country && BLOCKED_COUNTRIES.includes(country)) {
    console.log(`[SECURITY] Blocked access from ${country}`, {
      country,
      ip: request.ip,
      city: request.geo?.city,
      region: request.geo?.region,
      timestamp: new Date().toISOString(),
      path: pathname,
      userAgent: request.headers.get('user-agent'),
    });

    const pathSegments = pathname.split('/').filter(Boolean);
    const locale = locales.includes(pathSegments[0] as any) ? pathSegments[0] : 'en';
    const response = NextResponse.redirect(new URL(`/${locale}/blocked`, request.url));
    return applyHeaders(response);
  }

  // --- Protected route checks (lightweight edge JWT verification) ---
  const pathSegments = pathname.split('/').filter(Boolean);
  // pathSegments[0] is locale, pathSegments[1] is the route section
  if (pathSegments.length >= 2) {
    const routeSection = `/${pathSegments[1]}`;
    const allowedRoles = PROTECTED_ROUTES[routeSection];

    if (allowedRoles) {
      const role = await getSessionRole(request);
      if (!role || !allowedRoles.includes(role)) {
        const locale = locales.includes(pathSegments[0] as any) ? pathSegments[0] : 'en';
        const loginUrl = new URL(`/${locale}/login`, request.url);
        loginUrl.searchParams.set('redirect', pathname);
        const response = NextResponse.redirect(loginUrl);
        return applyHeaders(response);
      }
    }
  }

  // For all other requests, continue with i18n middleware
  const response = intlMiddleware(request);
  return applyHeaders(response);
}

export const config = {
  // Match all pathnames except for Next.js internals and static files
  matcher: ['/((?!_next|.*\\..*).*)'],
};
