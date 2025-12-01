"use client";

import { cn } from "@/lib/utils";
import type { CalendarAssignment } from "@/hooks/useCalendar";
import { CalendarEventCard } from "@/components/calendar";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * CalendarDayView Component
 *
 * Displays a single day timeline with assignments.
 *
 * Features:
 * - Time slots from 00:00 to 23:00
 * - Assignments shown at their due time
 * - All-day section for assignments without specific time
 * - Current time indicator line
 *
 * UX (from ux-research.md):
 * - Collapsible empty time slots (mobile-friendly)
 * - Touch targets 44px minimum
 * - Current time highlight
 */

interface CalendarDayViewProps {
  /** Current date being viewed */
  date: Date;
  /** Assignments for this day */
  assignments: CalendarAssignment[];
  /** Called when status changes (quick complete) */
  onStatusChange?: (assignmentId: string, completed: boolean) => void;
  /** Called when edit clicked in popover */
  onEdit?: (assignment: CalendarAssignment) => void;
  /** Called when navigate to course clicked */
  onNavigateToCourse?: (courseId: string) => void;
}

/** Hours to display in the timeline */
const DISPLAY_HOURS = Array.from({ length: 24 }, (_, i) => i);

/** Group assignments by hour */
function groupAssignmentsByHour(
  assignments: CalendarAssignment[]
): Map<number, CalendarAssignment[]> {
  const grouped = new Map<number, CalendarAssignment[]>();

  assignments.forEach((assignment) => {
    const hour = new Date(assignment.dueDate).getHours();
    const existing = grouped.get(hour) || [];
    grouped.set(hour, [...existing, assignment]);
  });

  return grouped;
}

/** Check if current time is in this hour */
function isCurrentHour(hour: number): boolean {
  return new Date().getHours() === hour;
}

export function CalendarDayView({
  date,
  assignments,
  onStatusChange,
  onEdit,
  onNavigateToCourse,
}: CalendarDayViewProps) {
  const assignmentsByHour = groupAssignmentsByHour(assignments);
  const currentHour = new Date().getHours();
  const isViewingToday =
    date.toDateString() === new Date().toDateString();

  // Empty state
  if (assignments.length === 0) {
    return (
      <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] p-8">
        <EmptyState
          illustration="empty-calendar"
          title="יום פנוי"
          description="אין משימות מתוכננות להיום. תהנה!"
        />
      </div>
    );
  }

  return (
    <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-surface)]">
      {/* Day header */}
      <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-background)]">
        <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
          {format(date, "EEEE, d בMMMM yyyy", { locale: he })}
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          {assignments.length} משימות
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Current time indicator (only on today) */}
        {isViewingToday && (
          <div
            className="absolute inset-x-0 z-10 pointer-events-none"
            style={{
              top: `${(currentHour / 24) * 100}%`,
            }}
          >
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-[var(--color-danger)]" />
              <div className="flex-1 h-[2px] bg-[var(--color-danger)]" />
            </div>
          </div>
        )}

        {/* Hour rows */}
        {DISPLAY_HOURS.map((hour) => {
          const hourAssignments = assignmentsByHour.get(hour) || [];
          const isCurrent = isViewingToday && isCurrentHour(hour);

          // Skip empty hours that are far from assignments (collapsible)
          // For now, show all hours but could be optimized for mobile

          return (
            <div
              key={hour}
              className={cn(
                "flex border-b border-[var(--color-border)] last:border-b-0 min-h-[60px]",
                isCurrent && "bg-[var(--color-primary)]/5"
              )}
            >
              {/* Hour label */}
              <div className="w-16 p-2 border-e border-[var(--color-border)] flex-shrink-0">
                <span
                  className={cn(
                    "text-sm",
                    isCurrent
                      ? "text-[var(--color-primary)] font-medium"
                      : "text-[var(--color-text-muted)]"
                  )}
                >
                  {hour.toString().padStart(2, "0")}:00
                </span>
              </div>

              {/* Assignments for this hour */}
              <div className="flex-1 p-2">
                {hourAssignments.length > 0 ? (
                  <div className="space-y-2">
                    {hourAssignments.map((assignment) => (
                      <CalendarEventCard
                        key={assignment.id}
                        assignment={assignment}
                        variant="expanded"
                        onStatusChange={onStatusChange}
                        onEdit={onEdit}
                        onNavigateToCourse={onNavigateToCourse}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
