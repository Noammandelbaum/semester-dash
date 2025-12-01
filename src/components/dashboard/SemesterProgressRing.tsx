"use client";

import { CircularProgress } from "@/components/ui/progress";
import { formatWeekIndicator } from "@/lib/dashboard-utils";

/**
 * SemesterProgressRing (STUDDASH-26)
 * Large circular progress indicator for semester completion
 *
 * UX: Central visual element showing "where am I in the semester"
 * Size: 160px desktop, 120px mobile
 * Shows week indicator inside: "שבוע 8 מתוך 14"
 */
interface SemesterProgressRingProps {
  currentWeek: number;
  totalWeeks: number;
  progressPercent: number;
  semesterName?: string;
}

export function SemesterProgressRing({
  currentWeek,
  totalWeeks,
  progressPercent,
  semesterName,
}: SemesterProgressRingProps) {
  const weekText = formatWeekIndicator(currentWeek, totalWeeks);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Semester name */}
      {semesterName && (
        <h2 className="text-lg font-medium text-[var(--color-text-primary)]">
          {semesterName}
        </h2>
      )}

      {/* Large progress ring with week indicator */}
      <div className="relative">
        {/* Desktop: 160px, Mobile: 120px */}
        <div className="hidden sm:block">
          <CircularProgress
            value={progressPercent}
            size={160}
            strokeWidth={12}
            showLabel={false}
            colorByProgress={false}
            color="var(--color-primary)"
            label={`התקדמות בסמסטר: ${progressPercent}%`}
          />
        </div>
        <div className="sm:hidden">
          <CircularProgress
            value={progressPercent}
            size={120}
            strokeWidth={10}
            showLabel={false}
            colorByProgress={false}
            color="var(--color-primary)"
            label={`התקדמות בסמסטר: ${progressPercent}%`}
          />
        </div>

        {/* Week indicator inside the ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
            {progressPercent}%
          </span>
          <span className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
            {weekText}
          </span>
        </div>
      </div>
    </div>
  );
}
