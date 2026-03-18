import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
  images: {
    domains: ['kwzirplynefqlpvdvpqz.supabase.co', 'images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kwzirplynefqlpvdvpqz.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  productionBrowserSourceMaps: false,
};

export default withSentryConfig(withNextIntl(nextConfig), {
  silent: true,
  sourcemaps: {
    disable: true,
  },
});
