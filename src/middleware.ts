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

// Countries to block (ISO 3166-1 alpha-2 country codes)
const BLOCKED_COUNTRIES = ['RU', 'BY']; // Russia, Belarus

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always',
});

export default function middleware(request: NextRequest) {
  // Get country from Vercel's geo data (automatically available)
  const country = request.geo?.country;
  const pathname = request.nextUrl.pathname;

  // Check if accessing the blocked page already (prevent redirect loop)
  if (pathname.includes('/blocked')) {
    return intlMiddleware(request);
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
    return NextResponse.redirect(new URL(`/${locale}/blocked`, request.url));
  }

  // For all other requests, continue with i18n middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next (Next.js internals)
  // - Static files (images, etc.)
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
