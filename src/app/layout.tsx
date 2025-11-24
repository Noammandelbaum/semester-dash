import type { Metadata } from "next";
import { SessionProvider } from "@/components/providers/session-provider";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import "./globals.css";

export const metadata: Metadata = {
  title: "SemesterDash - ניהול סמסטר חכם",
  description: "לוח בקרה לסטודנטים - מעקב קורסים, משימות והתקדמות",
  keywords: ["סטודנטים", "אוניברסיטה", "ניהול זמן", "קורסים", "משימות"],
  authors: [{ name: "SemesterDash" }],
  openGraph: {
    title: "SemesterDash - ניהול סמסטר חכם",
    description: "לוח בקרה לסטודנטים - מעקב קורסים, משימות והתקדמות",
    type: "website",
    locale: "he_IL",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-background text-text-primary" suppressHydrationWarning>
        <GoogleAnalytics />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
