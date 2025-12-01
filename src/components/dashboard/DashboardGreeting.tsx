"use client";

import { getTimeBasedGreeting, getStatusMessage } from "@/lib/dashboard-utils";

/**
 * DashboardGreeting
 * Time-based Hebrew greeting with supportive status message
 *
 * UX: No guilt messaging - always supportive tone
 * Examples:
 * - "בוקר טוב! מצוין! אתה על המסלול"
 * - "ערב טוב! יש קצת עבודה, אבל אתה יכול!"
 */
interface DashboardGreetingProps {
  /** Number of courses with "green" status */
  greenCoursesCount: number;
  /** Total number of courses */
  totalCoursesCount: number;
  /** Optional user name for personalization */
  userName?: string;
}

export function DashboardGreeting({
  greenCoursesCount,
  totalCoursesCount,
  userName,
}: DashboardGreetingProps) {
  const greeting = getTimeBasedGreeting();
  const statusMessage = getStatusMessage(greenCoursesCount, totalCoursesCount);

  return (
    <div className="mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
        {greeting}
        {userName && `, ${userName}`}!
      </h1>
      <p className="text-[var(--color-text-secondary)] mt-1">{statusMessage}</p>
    </div>
  );
}
