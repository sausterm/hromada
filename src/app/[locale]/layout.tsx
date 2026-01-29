import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { Footer } from "@/components/layout/Footer";
import { locales, type Locale } from '@/i18n';

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
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ToastProvider>
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            <Footer />
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
