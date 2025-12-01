import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { SessionProvider } from "@/components/providers/session-provider";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import "./globals.css";

export const metadata: Metadata = {
  title: "SemesterHub - הסמסטר שלך, במבט אחד",
  description: "לוח בקרה לסטודנטים - מעקב קורסים, מטלות והתקדמות",
  keywords: ["סטודנטים", "אוניברסיטה", "ניהול זמן", "קורסים", "מטלות", "סמסטר"],
  authors: [{ name: "SemesterHub" }],
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  appleWebApp: {
    title: "SemesterHub",
  },
  openGraph: {
    title: "SemesterHub - הסמסטר שלך, במבט אחד",
    description: "לוח בקרה לסטודנטים - מעקב קורסים, מטלות והתקדמות",
    type: "website",
    locale: "he_IL",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Rubik:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-background text-text-primary" suppressHydrationWarning>
        <GoogleAnalytics />
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>{children}</SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
