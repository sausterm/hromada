/**
 * Hromada Platform
 *
 * Copyright (c) 2025 Thomas D. Protzman and Sloan Austermann
 * All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, or distribution is prohibited.
 */

import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Inter, Geist_Mono, Outfit } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { Footer } from "@/components/layout/Footer";
import { PartnerCarousel } from "@/components/layout/PartnerCarousel";
import { ScrollFadeObserver } from "@/components/layout/ScrollFadeObserver";
import { locales, type Locale } from '@/i18n';
import type { Metadata } from 'next';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://hromadaproject.org'),
    title: 'hromada | Support Ukrainian renewable infrastructure',
    description: 'Connect with Ukrainian municipalities to support infrastructure recovery',
    authors: [{ name: 'Thomas D. Protzman' }, { name: 'Sloan Austermann' }],
    creator: 'Hromada Platform',
    publisher: 'Hromada Platform',
    robots: 'index, follow',
    icons: {
      icon: '/icon.svg',
      shortcut: '/icon.svg',
      apple: '/apple-icon.png',
    },
    openGraph: {
      title: 'hromada | Support Ukrainian renewable infrastructure',
      description: 'Connect with Ukrainian municipalities to support renewable infrastructure recovery for hospitals, schools, and essential services.',
      siteName: 'hromada',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'hromada' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'hromada | Support Ukrainian renewable infrastructure',
      description: 'Connect with Ukrainian municipalities to support renewable infrastructure recovery.',
      images: ['/og-image.png'],
    },
    other: {
      'copyright': '© 2025 Thomas D. Protzman and Sloan Austermann. All rights reserved.',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate that the incoming locale is supported
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the current locale
  const messages = await getMessages({ locale });

  console.log(`[i18n] Locale detected: ${locale}`);

  const skipText = locale === 'uk' ? 'Перейти до вмісту' : 'Skip to content'

  return (
    <div
      lang={locale}
      className={`${inter.variable} ${geistMono.variable} ${outfit.variable} antialiased min-h-screen flex flex-col`}
    >
      {/* Preconnect to MapTiler so DNS+TLS resolves while map JS loads */}
      <link rel="preconnect" href="https://api.maptiler.com" />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-white focus:text-[var(--navy-800)] focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--ukraine-500)] font-medium text-sm"
      >
        {skipText}
      </a>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <ScrollFadeObserver />
        <ToastProvider>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <PartnerCarousel hideOnHomepage />
          <Footer />
        </ToastProvider>
      </NextIntlClientProvider>
    </div>
  );
}
