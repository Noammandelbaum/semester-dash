"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, Download, ExternalLink } from "lucide-react";
import { detectBrowser, SUPPORTED_BROWSERS, type BrowserInfo } from "@/lib/browser-detection";

export default function UnsupportedBrowserPage() {
  // Detect browser on mount - useMemo ensures it only runs once on client
  const browserInfo: BrowserInfo | null = useMemo(() => {
    if (typeof window === "undefined") return null;
    return detectBrowser();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] p-4" dir="rtl">
      <div className="max-w-md w-full bg-[var(--color-bg-secondary)] rounded-xl shadow-lg p-8 text-center border border-[var(--color-border)]">
        {/* Warning Icon */}
        <div className="mx-auto w-16 h-16 bg-[var(--color-warning)]/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-[var(--color-warning)]" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          הדפדפן אינו נתמך
        </h1>

        {/* Browser info */}
        {browserInfo && (
          <p className="text-[var(--color-text-secondary)] mb-6">
            הדפדפן שלך ({browserInfo.name}) אינו נתמך כרגע.
            <br />
            <span className="text-sm">
              SemesterHub דורש תוסף דפדפן שזמין עבור Chrome, Edge, Firefox ו-Opera.
            </span>
          </p>
        )}

        {/* Supported browsers */}
        <div className="mb-8">
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            דפדפנים נתמכים:
          </p>
          <div className="space-y-3">
            {SUPPORTED_BROWSERS.map((browser) => (
              <a
                key={browser.name}
                href={browser.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <BrowserIcon name={browser.name} />
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {browser.name}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-[var(--color-primary)] text-sm group-hover:underline">
                  <Download className="w-4 h-4" />
                  הורד
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Why Safari not supported */}
        {browserInfo?.name === "Safari" && (
          <div className="bg-[var(--color-bg-primary)] rounded-lg p-4 mb-6 text-right">
            <p className="text-sm text-[var(--color-text-muted)]">
              <strong>למה Safari לא נתמך?</strong>
              <br />
              Safari דורש פיתוח נפרד ב-Xcode ותוכנית מפתחים של Apple בעלות שנתית.
              אנחנו שוקלים תמיכה בעתיד בהתאם לביקוש.
            </p>
          </div>
        )}

        {/* Contact */}
        <p className="text-xs text-[var(--color-text-muted)]">
          יש לך שאלות?{" "}
          <a
            href="mailto:semesterhub.club@gmail.com"
            className="text-[var(--color-primary)] hover:underline"
          >
            צור קשר
          </a>
        </p>

        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-6 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          חזרה לעמוד הבית
        </Link>
      </div>
    </div>
  );
}

/**
 * Simple browser icon component using emoji/text as fallback
 * In production, replace with actual SVG icons
 */
function BrowserIcon({ name }: { name: string }) {
  const getIcon = () => {
    switch (name) {
      case "Google Chrome":
        return (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white" />
          </div>
        );
      case "Microsoft Edge":
        return (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-teal-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">e</span>
          </div>
        );
      case "Firefox":
        return (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xs">🦊</span>
          </div>
        );
      case "Opera":
        return (
          <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">O</span>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center">
            <span className="text-white text-xs">?</span>
          </div>
        );
    }
  };

  return getIcon();
}
