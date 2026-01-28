import createMiddleware from 'next-intl/middleware';
import {locales} from './i18n';

export default createMiddleware({
  // List of all supported locales
  locales,

  // Default locale when no locale is detected
  defaultLocale: 'en',

  // Prefix the default locale in the URL (e.g., /en/...)
  localePrefix: 'always'
});

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next (Next.js internals)
  // - Static files (images, etc.)
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
