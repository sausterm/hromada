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
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { Footer } from "@/components/layout/Footer";
import { PartnerCarousel } from "@/components/layout/PartnerCarousel";
import { locales, type Locale } from '@/i18n';
import type { Metadata } from 'next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext", "cyrillic" as "latin"],
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
    },
    twitter: {
      card: 'summary_large_image',
      title: 'hromada | Support Ukrainian renewable infrastructure',
      description: 'Connect with Ukrainian municipalities to support renewable infrastructure recovery.',
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

  return (
    <div
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased min-h-screen flex flex-col`}
    >
      <NextIntlClientProvider messages={messages} locale={locale}>
        <ToastProvider>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <PartnerCarousel />
          <Footer />
        </ToastProvider>
      </NextIntlClientProvider>
    </div>
  );
}
