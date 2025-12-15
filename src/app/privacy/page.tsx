"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

type Language = "he" | "en";

export default function PrivacyPolicyPage() {
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
            <Link href="/terms" className="hover:text-[var(--color-primary)]">
              {language === "he" ? "תנאי שימוש" : "Terms of Service"}
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
      <h1 className="text-3xl font-bold mb-2">מדיניות פרטיות</h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        עדכון אחרון: דצמבר 2025
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">מבוא</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          מדיניות פרטיות זו מתארת כיצד SemesterHub (&quot;האתר&quot;,
          &quot;השירות&quot;, &quot;אנחנו&quot;) אוסף, משתמש ומגן על המידע שלך.
          השירות מיועד לסייע לסטודנטים לנהל את לימודיהם באמצעות סנכרון נתונים
          ממערכות Moodle.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">מידע שאנחנו אוספים</h2>

        <h3 className="text-lg font-medium mb-3">מידע מחשבון Google</h3>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] mb-4 space-y-1">
          <li>שם מלא</li>
          <li>כתובת אימייל</li>
          <li>תמונת פרופיל</li>
          <li>מזהה Google (לצורך התחברות)</li>
        </ul>

        <h3 className="text-lg font-medium mb-3">מידע מ-Moodle</h3>
        <p className="text-[var(--color-text-secondary)] mb-2">
          באמצעות התוסף לדפדפן, אנחנו אוספים:
        </p>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] mb-4 space-y-1">
          <li>שמות קורסים וקודים</li>
          <li>שמות מטלות ותאריכי הגשה</li>
          <li>סטטוס הגשה (הוגש/לא הוגש)</li>
          <li>כתובות URL של קורסים ומטלות</li>
        </ul>

        <h3 className="text-lg font-medium mb-3">מידע שאנחנו לא אוספים</h3>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] mb-4 space-y-1">
          <li>סיסמאות או פרטי התחברות ל-Moodle</li>
          <li>ציונים או הערכות</li>
          <li>תוכן הקורסים (הרצאות, חומרים)</li>
          <li>הגשות או עבודות</li>
          <li>היסטוריית גלישה מחוץ לדפי Moodle</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">למה אנחנו אוספים את המידע</h2>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>להציג את הקורסים והמטלות שלך בדשבורד</li>
          <li>לשלוח תזכורות על דדליינים קרובים</li>
          <li>לעקוב אחרי ההתקדמות שלך בלימודים</li>
          <li>לשפר את השירות על בסיס שימוש אנונימי</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">אחסון ואבטחה</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          המידע שלך מאוחסן בשרתים מאובטחים:
        </p>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>
            <strong>מסד נתונים:</strong> Neon (PostgreSQL) - מאוחסן באירופה
          </li>
          <li>
            <strong>אחסון אתר:</strong> Vercel - עם הצפנת HTTPS
          </li>
          <li>
            <strong>אימות:</strong> Google OAuth 2.0 - אנחנו לא שומרים סיסמאות
          </li>
        </ul>
        <p className="text-[var(--color-text-secondary)] mt-4">
          אנחנו משתמשים בהצפנה בהעברה (TLS/HTTPS) ומגבילים גישה למידע רק
          לבעלי הרשאות.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">שירותי צד שלישי</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          אנחנו משתמשים בשירותים הבאים:
        </p>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>
            <strong>Google Analytics:</strong> לניתוח שימוש אנונימי באתר
          </li>
          <li>
            <strong>Google OAuth:</strong> להתחברות מאובטחת
          </li>
          <li>
            <strong>Vercel:</strong> לאחסון ולהרצת האתר
          </li>
          <li>
            <strong>Neon:</strong> לאחסון מסד הנתונים
          </li>
        </ul>
        <p className="text-[var(--color-text-secondary)] mt-4">
          אנחנו לא מוכרים או משתפים את המידע שלך עם צדדים שלישיים לצרכי
          פרסום או שיווק.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">הזכויות שלך</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          בהתאם לחוק הגנת הפרטיות הישראלי, יש לך זכות:
        </p>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>
            <strong>לעיין במידע:</strong> לבקש לראות את כל המידע שאנחנו שומרים
            עליך
          </li>
          <li>
            <strong>לתקן מידע:</strong> לבקש תיקון של מידע שגוי
          </li>
          <li>
            <strong>למחוק מידע:</strong> לבקש מחיקת החשבון וכל המידע המשויך אליו
          </li>
          <li>
            <strong>לייצא מידע:</strong> לקבל עותק של המידע שלך בפורמט קריא
          </li>
        </ul>
        <p className="text-[var(--color-text-secondary)] mt-4">
          לממש את הזכויות שלך, פנה אלינו בכתובת:{" "}
          <a
            href="mailto:semesterhub.club@gmail.com"
            className="text-[var(--color-primary)] hover:underline"
          >
            semesterhub.club@gmail.com
          </a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">שמירת מידע</h2>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>המידע נשמר כל עוד החשבון שלך פעיל</li>
          <li>לאחר מחיקת חשבון, המידע יימחק תוך 30 יום</li>
          <li>טוקנים לאימות פגים לאחר 30 יום</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">עדכונים למדיניות</h2>
        <p className="text-[var(--color-text-secondary)]">
          אנחנו עשויים לעדכן מדיניות זו מעת לעת. על שינויים מהותיים נודיע
          באמצעות האתר או בדוא&quot;ל. המשך השימוש בשירות לאחר העדכון מהווה
          הסכמה למדיניות המעודכנת.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">יצירת קשר</h2>
        <p className="text-[var(--color-text-secondary)]">
          לשאלות בנוגע למדיניות הפרטיות, ניתן לפנות אלינו:
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
          <li>
            <strong>מיקום:</strong> ישראל
          </li>
        </ul>
      </section>
    </article>
  );
}

function EnglishContent() {
  return (
    <article className="prose prose-lg max-w-none text-[var(--color-text-primary)]">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        Last Updated: December 2025
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Introduction</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          This Privacy Policy describes how SemesterHub (&quot;the website&quot;,
          &quot;the service&quot;, &quot;we&quot;) collects, uses, and protects your
          information. The service is designed to help students manage their studies
          by syncing data from Moodle learning management systems.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Information We Collect</h2>

        <h3 className="text-lg font-medium mb-3">Information from Google Account</h3>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] mb-4 space-y-1">
          <li>Full name</li>
          <li>Email address</li>
          <li>Profile picture</li>
          <li>Google ID (for authentication)</li>
        </ul>

        <h3 className="text-lg font-medium mb-3">Information from Moodle</h3>
        <p className="text-[var(--color-text-secondary)] mb-2">
          Through the browser extension, we collect:
        </p>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] mb-4 space-y-1">
          <li>Course names and codes</li>
          <li>Assignment names and due dates</li>
          <li>Submission status (submitted/not submitted)</li>
          <li>Course and assignment URLs</li>
        </ul>

        <h3 className="text-lg font-medium mb-3">Information We Do NOT Collect</h3>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] mb-4 space-y-1">
          <li>Moodle passwords or login credentials</li>
          <li>Grades or evaluations</li>
          <li>Course content (lectures, materials)</li>
          <li>Submissions or assignments</li>
          <li>Browsing history outside Moodle pages</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Why We Collect Information</h2>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>To display your courses and assignments in the dashboard</li>
          <li>To send reminders about upcoming deadlines</li>
          <li>To track your study progress</li>
          <li>To improve the service based on anonymous usage</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Storage and Security</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          Your information is stored on secure servers:
        </p>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>
            <strong>Database:</strong> Neon (PostgreSQL) - stored in Europe
          </li>
          <li>
            <strong>Website hosting:</strong> Vercel - with HTTPS encryption
          </li>
          <li>
            <strong>Authentication:</strong> Google OAuth 2.0 - we don&apos;t store
            passwords
          </li>
        </ul>
        <p className="text-[var(--color-text-secondary)] mt-4">
          We use encryption in transit (TLS/HTTPS) and limit access to information
          only to authorized personnel.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Third-Party Services</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          We use the following services:
        </p>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>
            <strong>Google Analytics:</strong> For anonymous usage analysis
          </li>
          <li>
            <strong>Google OAuth:</strong> For secure authentication
          </li>
          <li>
            <strong>Vercel:</strong> For hosting and running the website
          </li>
          <li>
            <strong>Neon:</strong> For database storage
          </li>
        </ul>
        <p className="text-[var(--color-text-secondary)] mt-4">
          We do not sell or share your information with third parties for
          advertising or marketing purposes.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          Under Israeli Privacy Protection Law, you have the right to:
        </p>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>
            <strong>Access:</strong> Request to see all information we store about
            you
          </li>
          <li>
            <strong>Correction:</strong> Request correction of inaccurate
            information
          </li>
          <li>
            <strong>Deletion:</strong> Request deletion of your account and all
            associated data
          </li>
          <li>
            <strong>Export:</strong> Receive a copy of your data in a readable
            format
          </li>
        </ul>
        <p className="text-[var(--color-text-secondary)] mt-4">
          To exercise your rights, contact us at:{" "}
          <a
            href="mailto:semesterhub.club@gmail.com"
            className="text-[var(--color-primary)] hover:underline"
          >
            semesterhub.club@gmail.com
          </a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Data Retention</h2>
        <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
          <li>Data is retained as long as your account is active</li>
          <li>After account deletion, data will be removed within 30 days</li>
          <li>Authentication tokens expire after 30 days</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Policy Updates</h2>
        <p className="text-[var(--color-text-secondary)]">
          We may update this policy from time to time. We will notify you of
          significant changes through the website or via email. Continued use of
          the service after updates constitutes acceptance of the updated policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
        <p className="text-[var(--color-text-secondary)]">
          For questions about this Privacy Policy, please contact us:
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
          <li>
            <strong>Location:</strong> Israel
          </li>
        </ul>
      </section>
    </article>
  );
}
