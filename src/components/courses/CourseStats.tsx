"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

/**
 * CourseStats
 * Assignment statistics summary for course detail page
 *
 * Features:
 * - Total/Completed/Pending counts
 * - Progress bar with percentage
 * - RTL-aware layout
 *
 * UX: Quick overview of course health at a glance
 */

interface CourseStatsProps {
  total: number;
  completed: number;
  inProgress: number;
}

export function CourseStats({ total, completed, inProgress }: CourseStatsProps) {
  const notStarted = total - completed - inProgress;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            התקדמות כללית
          </span>
          <span className="text-sm text-[var(--color-text-secondary)]">
            {percent}%
          </span>
        </div>
        <Progress
          value={completed}
          max={total || 1}
          size="md"
          showLabel={false}
          colorByProgress={true}
          label={`${completed} מתוך ${total} משימות הושלמו`}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Circle className="w-4 h-4 text-[var(--color-text-muted)]" />
            <span className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {total}
            </span>
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">
            סה״כ משימות
          </span>
        </div>

        {/* Completed */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />
            <span className="text-2xl font-semibold text-[var(--color-success)]">
              {completed}
            </span>
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">
            הושלמו
          </span>
        </div>

        {/* In Progress / Pending */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Clock className="w-4 h-4 text-[var(--color-warning)]" />
            <span className="text-2xl font-semibold text-[var(--color-warning)]">
              {inProgress + notStarted}
            </span>
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">
            בהמתנה
          </span>
        </div>
      </div>
    </div>
  );
}
