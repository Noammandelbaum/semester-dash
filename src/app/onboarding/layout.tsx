import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

/**
 * Onboarding Layout
 *
 * Minimal layout for onboarding flow:
 * - No sidebar (distraction-free)
 * - Centered content
 * - Skip button always visible
 * - Clean, calm design
 *
 * UX: Maximum 2 minutes total, always show skip option
 */

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-bg-primary)] to-[var(--color-bg-secondary)]">
      {/* Header with skip button */}
      <header className="fixed top-0 inset-x-0 z-10 bg-[var(--color-bg-primary)]/80 backdrop-blur-sm border-b border-[var(--color-border)]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <span className="text-lg font-semibold text-[var(--color-primary)]">
            SemesterHub
          </span>

          {/* Skip button - always visible */}
          <Link
            href="/dashboard"
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            דלג לדשבורד
          </Link>
        </div>
      </header>

      {/* Main content area */}
      <main className="pt-14 min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">{children}</div>
        </div>
      </main>
    </div>
  );
}
