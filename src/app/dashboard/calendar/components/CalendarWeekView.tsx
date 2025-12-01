"use client";

import { cn } from "@/lib/utils";
import {
  isToday,
  type CalendarAssignment,
  HEBREW_DAY_NAMES_SHORT,
} from "@/hooks/useCalendar";
import { CalendarEventCard } from "@/components/calendar";
import { format } from "date-fns";
import { he } from "date-fns/locale";

/**
 * CalendarWeekView Component
 *
 * Displays a 7-day week grid with assignments.
 *
 * RTL Layout (from ux-research.md):
 * - Sunday (ראשון) on the RIGHT side
 * - Saturday (שבת) on the LEFT side
 * - Week flows right-to-left
 *
 * UX:
 * - Current day highlighted with primary color
 * - Touch targets 44px minimum
 * - Assignments positioned by due date
 * - Collapsible empty time slots on mobile (future)
 */

interface CalendarWeekViewProps {
  /** Array of 7 dates (Sunday to Saturday) */
  weekDays: Date[];
  /** Assignments to display */
  assignments: CalendarAssignment[];
  /** Get assignments for a specific date */
  getAssignmentsForDate: (date: Date) => CalendarAssignment[];
  /** Called when status changes (quick complete) */
  onStatusChange?: (assignmentId: string, completed: boolean) => void;
  /** Called when edit clicked in popover */
  onEdit?: (assignment: CalendarAssignment) => void;
  /** Called when navigate to course clicked */
  onNavigateToCourse?: (courseId: string) => void;
  /** Click handler for empty day (to add assignment) */
  onDayClick?: (date: Date) => void;
}

export function CalendarWeekView({
  weekDays,
  getAssignmentsForDate,
  onStatusChange,
  onEdit,
  onNavigateToCourse,
  onDayClick,
}: CalendarWeekViewProps) {
  // Reverse for RTL display (Sunday on right)
  const rtlWeekDays = [...weekDays].reverse();
  const rtlDayNames = [...HEBREW_DAY_NAMES_SHORT].reverse();

  return (
    <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-surface)]">
      {/* Day headers - RTL order */}
      <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-background)]">
        {rtlDayNames.map((dayName, index) => {
          const date = rtlWeekDays[index];
          const today = isToday(date);

          return (
            <div
              key={dayName}
              className={cn(
                "p-3 text-center border-e border-[var(--color-border)] last:border-e-0",
                today && "bg-[var(--color-primary)]/5"
              )}
            >
              <p className="text-sm text-[var(--color-text-secondary)]">
                {dayName}
              </p>
              <p
                className={cn(
                  "text-lg font-medium mt-1",
                  today
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-text-primary)]"
                )}
              >
                {format(date, "d", { locale: he })}
              </p>
            </div>
          );
        })}
      </div>

      {/* Week content - single row with day columns */}
      <div className="grid grid-cols-7 min-h-[400px]">
        {rtlWeekDays.map((date) => {
          const today = isToday(date);
          const dayAssignments = getAssignmentsForDate(date);

          return (
            <div
              key={date.toISOString()}
              className={cn(
                "border-e border-[var(--color-border)] last:border-e-0",
                "p-2 flex flex-col gap-2",
                today && "bg-[var(--color-primary)]/5"
              )}
              onClick={() => onDayClick?.(date)}
              role="button"
              tabIndex={0}
              aria-label={`${format(date, "EEEE d בMMMM", { locale: he })}. ${dayAssignments.length} משימות`}
            >
              {/* Assignments */}
              {dayAssignments.length > 0 ? (
                dayAssignments.map((assignment) => (
                  <CalendarEventCard
                    key={assignment.id}
                    assignment={assignment}
                    variant="default"
                    onStatusChange={onStatusChange}
                    onEdit={onEdit}
                    onNavigateToCourse={onNavigateToCourse}
                  />
                ))
              ) : (
                // Empty state - subtle indication
                <div className="flex-1 flex items-center justify-center min-h-[100px]">
                  <p className="text-xs text-[var(--color-text-muted)] opacity-50">
                    אין משימות
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
