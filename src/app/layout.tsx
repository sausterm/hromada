import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hromada - Support Ukrainian Communities",
  description: "Connect American donors directly with Ukrainian municipalities that need support for critical infrastructure. Browse verified projects and make a direct impact.",
  keywords: ["Ukraine", "humanitarian aid", "infrastructure", "donations", "municipalities", "community support"],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: "Hromada - Support Ukrainian Communities",
    description: "Connect directly with Ukrainian municipalities that need support for hospitals, schools, water utilities, and energy infrastructure.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hromada - Support Ukrainian Communities",
    description: "Connect directly with Ukrainian municipalities that need support for critical infrastructure.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
