"use client";

import { cn } from "@/lib/utils";
import {
  isToday,
  isCurrentMonth,
  type CalendarAssignment,
  HEBREW_DAY_NAMES_SHORT,
} from "@/hooks/useCalendar";
import { CalendarEventCard } from "@/components/calendar";
import { format } from "date-fns";
import { he } from "date-fns/locale";

/**
 * CalendarMonthView Component
 *
 * Displays a full month grid with assignment indicators.
 *
 * RTL Layout:
 * - Sunday on RIGHT, Saturday on LEFT
 * - Progress bars fill right-to-left (future)
 *
 * UX (from ux-research.md):
 * - Dots/badges on dates with assignments
 * - Click date → show day assignments in popover or navigate to day view
 * - Today highlight
 * - Outside-month days are dimmed
 */

interface CalendarMonthViewProps {
  /** 2D array of dates (weeks x 7 days) */
  monthDays: (Date | null)[][];
  /** Current viewing date (to determine current month) */
  currentDate: Date;
  /** Get assignments for a specific date */
  getAssignmentsForDate: (date: Date) => CalendarAssignment[];
  /** Called when status changes (quick complete) */
  onStatusChange?: (assignmentId: string, completed: boolean) => void;
  /** Called when edit clicked in popover */
  onEdit?: (assignment: CalendarAssignment) => void;
  /** Called when navigate to course clicked */
  onNavigateToCourse?: (courseId: string) => void;
  /** Click handler for day (navigate to day view) */
  onDayClick?: (date: Date) => void;
}

/** Maximum events to show in a cell before "+more" */
const MAX_EVENTS_SHOWN = 2;

export function CalendarMonthView({
  monthDays,
  currentDate,
  getAssignmentsForDate,
  onStatusChange,
  onEdit,
  onNavigateToCourse,
  onDayClick,
}: CalendarMonthViewProps) {
  // Reverse day names for RTL
  const rtlDayNames = [...HEBREW_DAY_NAMES_SHORT].reverse();

  return (
    <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-surface)]">
      {/* Day headers - RTL order */}
      <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-background)]">
        {rtlDayNames.map((dayName) => (
          <div
            key={dayName}
            className="p-2 text-center border-e border-[var(--color-border)] last:border-e-0"
          >
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              {dayName}
            </p>
          </div>
        ))}
      </div>

      {/* Month grid */}
      {monthDays.map((week, weekIndex) => {
        // Reverse each week for RTL
        const rtlWeek = [...week].reverse();

        return (
          <div
            key={weekIndex}
            className="grid grid-cols-7 border-b border-[var(--color-border)] last:border-b-0"
          >
            {rtlWeek.map((date, dayIndex) => {
              if (!date) return <div key={dayIndex} />;

              const today = isToday(date);
              const inCurrentMonth = isCurrentMonth(date, currentDate);
              const dayAssignments = getAssignmentsForDate(date);
              const visibleAssignments = dayAssignments.slice(0, MAX_EVENTS_SHOWN);
              const hiddenCount = dayAssignments.length - MAX_EVENTS_SHOWN;

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => onDayClick?.(date)}
                  className={cn(
                    "min-h-[100px] p-1.5 text-start",
                    "border-e border-[var(--color-border)] last:border-e-0",
                    "hover:bg-[var(--color-background)] transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]",
                    !inCurrentMonth && "bg-[var(--color-background)]/50",
                    today && "bg-[var(--color-primary)]/5"
                  )}
                  aria-label={`${format(date, "d בMMMM", { locale: he })}. ${dayAssignments.length} משימות`}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-full text-sm",
                        today
                          ? "bg-[var(--color-primary)] text-white font-medium"
                          : inCurrentMonth
                          ? "text-[var(--color-text-primary)]"
                          : "text-[var(--color-text-muted)]"
                      )}
                    >
                      {format(date, "d")}
                    </span>

                    {/* Assignment count badge (if many) */}
                    {dayAssignments.length > MAX_EVENTS_SHOWN && (
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {dayAssignments.length}
                      </span>
                    )}
                  </div>

                  {/* Visible assignments */}
                  <div className="space-y-1">
                    {visibleAssignments.map((assignment) => (
                      <CalendarEventCard
                        key={assignment.id}
                        assignment={assignment}
                        variant="compact"
                        onStatusChange={onStatusChange}
                        onEdit={onEdit}
                        onNavigateToCourse={onNavigateToCourse}
                      />
                    ))}

                    {/* "More" indicator */}
                    {hiddenCount > 0 && (
                      <p className="text-xs text-[var(--color-text-muted)] px-1">
                        +{hiddenCount} נוספים
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
