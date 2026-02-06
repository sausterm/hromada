/**
 * Hromada Platform - Edge Middleware
 *
 * Copyright (c) 2025 Thomas D. Protzman and Sloan Austermann
 * All rights reserved.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

// Security headers to apply to all responses
const securityHeaders: Record<string, string> = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Enable XSS filter
  'X-XSS-Protection': '1; mode=block',
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions policy (disable unnecessary features)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

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

// Site password protection
const SITE_PASSWORD = 'hromada!2026';
const AUTH_COOKIE_NAME = 'hromada_site_access';

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always',
});

/**
 * Apply security headers to a response
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  // Add HSTS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  return response;
}

export default function middleware(request: NextRequestWithGeo) {
  // Get country from Vercel's geo data (automatically available)
  const country = request.geo?.country;
  const pathname = request.nextUrl.pathname;

  // Check if accessing the password page or API (prevent redirect loop)
  if (pathname.includes('/site-access') || pathname.startsWith('/api/')) {
    const response = intlMiddleware(request);
    return applySecurityHeaders(response);
  }

  // Check for site access cookie
  const siteAccessCookie = request.cookies.get(AUTH_COOKIE_NAME);
  if (!siteAccessCookie || siteAccessCookie.value !== SITE_PASSWORD) {
    // Determine locale from URL or default to 'en'
    const pathSegments = pathname.split('/').filter(Boolean);
    const locale = locales.includes(pathSegments[0] as any) ? pathSegments[0] : 'en';

    // Redirect to password page
    const url = new URL(`/${locale}/site-access`, request.url);
    url.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(url);
    return applySecurityHeaders(response);
  }

  // Check if accessing the blocked page already (prevent redirect loop)
  if (pathname.includes('/blocked')) {
    const response = intlMiddleware(request);
    return applySecurityHeaders(response);
  }

  // If country is blocked, redirect to blocked page
  if (country && BLOCKED_COUNTRIES.includes(country)) {
    // Log blocked attempt for security monitoring
    console.log(`[SECURITY] Blocked access from ${country}`, {
      country,
      ip: request.ip,
      city: request.geo?.city,
      region: request.geo?.region,
      timestamp: new Date().toISOString(),
      path: pathname,
      userAgent: request.headers.get('user-agent'),
    });

    // Determine locale from URL or default to 'en'
    const pathSegments = pathname.split('/').filter(Boolean);
    const locale = locales.includes(pathSegments[0] as any) ? pathSegments[0] : 'en';

    // Redirect to blocked page
    const response = NextResponse.redirect(new URL(`/${locale}/blocked`, request.url));
    return applySecurityHeaders(response);
  }

  // For all other requests, continue with i18n middleware
  const response = intlMiddleware(request);
  return applySecurityHeaders(response);
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next (Next.js internals)
  // - Static files (images, etc.)
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
