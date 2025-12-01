"use client";

import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import type { CalendarView } from "@/hooks/useCalendar";
import { cn } from "@/lib/utils";

/**
 * CalendarHeader Component
 *
 * Navigation and view controls for the calendar.
 * RTL: Previous arrow on right, Next arrow on left (flipped in RTL context)
 *
 * UX: Clean, minimal navigation with clear current date display
 */

interface CalendarHeaderProps {
  /** Current view mode */
  view: CalendarView;
  /** Formatted date string for current view */
  headerDate: string;
  /** Change view mode */
  onViewChange: (view: CalendarView) => void;
  /** Go to previous period */
  onPrev: () => void;
  /** Go to next period */
  onNext: () => void;
  /** Go to today */
  onToday: () => void;
}

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: "day", label: "יום" },
  { value: "week", label: "שבוע" },
  { value: "month", label: "חודש" },
];

export function CalendarHeader({
  view,
  headerDate,
  onViewChange,
  onPrev,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        {/* Previous - In RTL, ChevronRight goes backward */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          className="min-h-[44px] min-w-[44px]"
          aria-label="הקודם"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        {/* Current date display */}
        <h2 className="text-lg font-medium text-[var(--color-text-primary)] min-w-[200px] text-center">
          {headerDate}
        </h2>

        {/* Next - In RTL, ChevronLeft goes forward */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          className="min-h-[44px] min-w-[44px]"
          aria-label="הבא"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Today button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onToday}
          className="min-h-[44px] ms-2"
        >
          היום
        </Button>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 bg-[var(--color-background)] p-1 rounded-lg border border-[var(--color-border)]">
        {VIEW_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={view === option.value ? "primary" : "ghost"}
            size="sm"
            onClick={() => onViewChange(option.value)}
            className={cn(
              "min-h-[36px] px-4",
              view !== option.value && "text-[var(--color-text-secondary)]"
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
