"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

type Language = "he" | "en";

export default function TermsOfServicePage() {
  const [language, setLanguage] = useState<Language>("he");

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>חזרה לאתר</span>
          </Link>

          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === "he" ? "en" : "he")}
            className="flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            {language === "he" ? "English" : "עברית"}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main
        className="max-w-4xl mx-auto px-4 py-8"
        dir={language === "he" ? "rtl" : "ltr"}
      >
        {language === "he" ? <HebrewContent /> : <EnglishContent />}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
          <p>SemesterHub &copy; {new Date().getFullYear()}</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Link href="/privacy" className="hover:text-[var(--color-primary)]">
              {language === "he" ? "מדיניות פרטיות" : "Privacy Policy"}
            </Link>
            <span>|</span>
            <a
              href="mailto:semesterhub.club@gmail.com"
              className="hover:text-[var(--color-primary)]"
            >
              {language === "he" ? "צור קשר" : "Contact"}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HebrewContent() {
  return (
    <article className="prose prose-lg max-w-none text-[var(--color-text-primary)]">
      <h1 className="text-3xl font-bold mb-2">תנאי שימוש</h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        עדכון אחרון: דצמבר 2025
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1. הסכמה לתנאים</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          ברוכים הבאים ל-SemesterHub. על ידי גישה לאתר או שימוש בשירות, אתה
          מסכים לתנאי שימוש אלה. אם אינך מסכים לתנאים, אנא הימנע משימוש בשירות.
        </p>
        <p className="text-[var(--color-text-secondary)]">
          SemesterHub הוא שירות לניהול לימודים המאפשר לסטודנטים לסנכרן נתונים
          ממערכות Moodle ולצפות בהם בדשבורד אחוד.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">2. תיאור השירות</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          SemesterHub מספק:
        </p>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>תוסף דפדפן לסנכרון נתונים מ-Moodle</li>
          <li>דשבורד לצפייה בקורסים ומטלות</li>
          <li>מערכת תזכורות לדדליינים</li>
          <li>מעקב אחרי התקדמות בלימודים</li>
        </ul>
        <p className="text-[var(--color-text-secondary)] mt-4">
          השירות מוצע &quot;כמות שהוא&quot; (AS IS) ואנחנו שומרים את הזכות לשנות,
          להשעות או להפסיק חלקים מהשירות בכל עת.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">3. דרישות שימוש</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          כדי להשתמש בשירות, עליך:
        </p>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>להיות בעל חשבון Google פעיל</li>
          <li>להיות סטודנט במוסד אקדמי המשתמש ב-Moodle</li>
          <li>להתקין את תוסף הדפדפן (Chrome, Edge, Firefox או Opera)</li>
          <li>לספק מידע מדויק ועדכני</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">4. חשבון משתמש</h2>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>אתה אחראי לשמור על סודיות חשבונך</li>
          <li>אתה אחראי לכל הפעילות בחשבונך</li>
          <li>עליך להודיע לנו מיד על כל שימוש לא מורשה</li>
          <li>אנחנו שומרים את הזכות להשעות חשבונות שמפרים את התנאים</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">5. שימוש מקובל</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">אסור לך:</p>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>להשתמש בשירות לכל מטרה בלתי חוקית</li>
          <li>לנסות לפרוץ, להפריע או לשבש את השירות</li>
          <li>להעלות תוכן זדוני או וירוסים</li>
          <li>לשתף את חשבונך עם אחרים</li>
          <li>לאסוף מידע על משתמשים אחרים</li>
          <li>להשתמש בשירות באופן שפוגע במשתמשים אחרים</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">6. קניין רוחני</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          כל הזכויות בשירות, כולל אך לא רק, העיצוב, הקוד, הלוגו והתוכן, שייכות
          ל-SemesterHub או לבעלי הרישיון שלנו.
        </p>
        <p className="text-[var(--color-text-secondary)]">
          אתה מקבל רישיון מוגבל, לא בלעדי ולא ניתן להעברה, להשתמש בשירות
          לשימוש אישי ולא מסחרי בלבד.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">7. הגבלת אחריות</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          השירות מסופק &quot;כמות שהוא&quot; ללא כל אחריות, מפורשת או משתמעת.
          אנחנו לא מתחייבים ש:
        </p>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>השירות יהיה זמין באופן רציף וללא תקלות</li>
          <li>המידע המסונכרן יהיה מדויק ב-100%</li>
          <li>השירות יעמוד בכל דרישותיך</li>
        </ul>
        <p className="text-[var(--color-text-secondary)] mt-4">
          בשום מקרה לא נהיה אחראים לנזקים ישירים, עקיפים, מקריים או תוצאתיים
          הנובעים משימוש בשירות.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">8. שיפוי</h2>
        <p className="text-[var(--color-text-secondary)]">
          אתה מסכים לשפות ולהגן על SemesterHub מפני כל תביעה, נזק, הפסד
          והוצאות (כולל שכר טרחת עורכי דין) הנובעים משימושך בשירות או מהפרת
          תנאים אלה.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">9. סיום</h2>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>אתה יכול להפסיק להשתמש בשירות ולמחוק את חשבונך בכל עת</li>
          <li>אנחנו יכולים להשעות או לסגור את חשבונך אם תפר את התנאים</li>
          <li>לאחר סיום, חלקים מסוימים מתנאים אלה ימשיכו לחול</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">10. שינויים בתנאים</h2>
        <p className="text-[var(--color-text-secondary)]">
          אנחנו שומרים את הזכות לעדכן תנאים אלה בכל עת. על שינויים מהותיים
          נודיע באמצעות האתר או בדוא&quot;ל. המשך השימוש בשירות לאחר עדכון מהווה
          הסכמה לתנאים המעודכנים.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">11. דין חל וסמכות שיפוט</h2>
        <p className="text-[var(--color-text-secondary)]">
          תנאים אלה כפופים לחוקי מדינת ישראל. כל מחלוקת תתברר בבתי המשפט
          המוסמכים בישראל.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">12. יצירת קשר</h2>
        <p className="text-[var(--color-text-secondary)]">
          לשאלות בנוגע לתנאי השימוש, ניתן לפנות אלינו:
        </p>
        <ul className="list-none text-[var(--color-text-secondary)] mt-2 space-y-1">
          <li>
            <strong>אימייל:</strong>{" "}
            <a
              href="mailto:semesterhub.club@gmail.com"
              className="text-[var(--color-primary)] hover:underline"
            >
              semesterhub.club@gmail.com
            </a>
          </li>
          <li>
            <strong>אתר:</strong>{" "}
            <a
              href="https://www.semesterhub.club"
              className="text-[var(--color-primary)] hover:underline"
            >
              www.semesterhub.club
            </a>
          </li>
        </ul>
      </section>
    </article>
  );
}

function EnglishContent() {
  return (
    <article className="prose prose-lg max-w-none text-[var(--color-text-primary)]">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        Last Updated: December 2025
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1. Agreement to Terms</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          Welcome to SemesterHub. By accessing the website or using the service,
          you agree to these Terms of Service. If you do not agree to these terms,
          please refrain from using the service.
        </p>
        <p className="text-[var(--color-text-secondary)]">
          SemesterHub is a study management service that allows students to sync
          data from Moodle systems and view it in a unified dashboard.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">2. Service Description</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          SemesterHub provides:
        </p>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>A browser extension for syncing data from Moodle</li>
          <li>A dashboard for viewing courses and assignments</li>
          <li>A deadline reminder system</li>
          <li>Study progress tracking</li>
        </ul>
        <p className="text-[var(--color-text-secondary)] mt-4">
          The service is provided &quot;AS IS&quot; and we reserve the right to
          modify, suspend, or discontinue parts of the service at any time.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">3. Usage Requirements</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          To use the service, you must:
        </p>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>Have an active Google account</li>
          <li>Be a student at an academic institution that uses Moodle</li>
          <li>Install the browser extension (Chrome, Edge, Firefox, or Opera)</li>
          <li>Provide accurate and up-to-date information</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">4. User Account</h2>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>You are responsible for maintaining the confidentiality of your account</li>
          <li>You are responsible for all activity under your account</li>
          <li>You must notify us immediately of any unauthorized use</li>
          <li>We reserve the right to suspend accounts that violate these terms</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">5. Acceptable Use</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">You may not:</p>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>Use the service for any illegal purpose</li>
          <li>Attempt to hack, interfere with, or disrupt the service</li>
          <li>Upload malicious content or viruses</li>
          <li>Share your account with others</li>
          <li>Collect information about other users</li>
          <li>Use the service in a way that harms other users</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">6. Intellectual Property</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          All rights in the service, including but not limited to design, code,
          logo, and content, belong to SemesterHub or our licensors.
        </p>
        <p className="text-[var(--color-text-secondary)]">
          You receive a limited, non-exclusive, non-transferable license to use
          the service for personal, non-commercial use only.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">7. Limitation of Liability</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          The service is provided &quot;AS IS&quot; without any warranty, express
          or implied. We do not guarantee that:
        </p>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>The service will be available continuously and without errors</li>
          <li>Synced information will be 100% accurate</li>
          <li>The service will meet all your requirements</li>
        </ul>
        <p className="text-[var(--color-text-secondary)] mt-4">
          In no event shall we be liable for any direct, indirect, incidental, or
          consequential damages arising from use of the service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">8. Indemnification</h2>
        <p className="text-[var(--color-text-secondary)]">
          You agree to indemnify and hold harmless SemesterHub from any claims,
          damages, losses, and expenses (including attorney&apos;s fees) arising
          from your use of the service or violation of these terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">9. Termination</h2>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>You can stop using the service and delete your account at any time</li>
          <li>We can suspend or close your account if you violate these terms</li>
          <li>After termination, certain parts of these terms will continue to apply</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">10. Changes to Terms</h2>
        <p className="text-[var(--color-text-secondary)]">
          We reserve the right to update these terms at any time. We will notify
          you of significant changes through the website or via email. Continued
          use of the service after updates constitutes acceptance of the updated
          terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">11. Governing Law and Jurisdiction</h2>
        <p className="text-[var(--color-text-secondary)]">
          These terms are governed by the laws of the State of Israel. Any dispute
          shall be resolved in the competent courts in Israel.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">12. Contact Us</h2>
        <p className="text-[var(--color-text-secondary)]">
          For questions about these Terms of Service, please contact us:
        </p>
        <ul className="list-none text-[var(--color-text-secondary)] mt-2 space-y-1">
          <li>
            <strong>Email:</strong>{" "}
            <a
              href="mailto:semesterhub.club@gmail.com"
              className="text-[var(--color-primary)] hover:underline"
            >
              semesterhub.club@gmail.com
            </a>
          </li>
          <li>
            <strong>Website:</strong>{" "}
            <a
              href="https://www.semesterhub.club"
              className="text-[var(--color-primary)] hover:underline"
            >
              www.semesterhub.club
            </a>
          </li>
        </ul>
      </section>
    </article>
  );
}
