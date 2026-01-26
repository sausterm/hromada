import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hromada - Support Ukrainian Communities",
  description: "Connect American donors directly with Ukrainian municipalities that need support for critical infrastructure. Browse verified projects and make a direct impact.",
  keywords: ["Ukraine", "humanitarian aid", "infrastructure", "donations", "municipalities", "community support"],
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
