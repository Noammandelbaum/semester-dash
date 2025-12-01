"use client";

import { cn } from "@/lib/utils";
import type { CalendarAssignment } from "@/hooks/useCalendar";
import { getDeadlineColorClass } from "@/hooks/useCalendar";

/**
 * CalendarEvent Component
 *
 * Displays a single assignment event in the calendar.
 * Used by all calendar views (day, week, month).
 *
 * UX (from ux-research.md):
 * - Anxiety-reducing colors
 * - Touch targets 44px minimum
 * - Course color coding
 * - Priority visual indicators (subtle, not alarming)
 */

interface CalendarEventProps {
  /** Assignment data */
  assignment: CalendarAssignment;
  /** Size variant */
  variant?: "compact" | "default" | "expanded";
  /** Click handler */
  onClick?: (assignment: CalendarAssignment) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get priority indicator (dot or icon)
 * Using color sparingly - teal for high, amber for medium, gray for low
 */
function getPriorityDot(priority: CalendarAssignment["priority"]): string {
  switch (priority) {
    case "HIGH":
      return "bg-[var(--color-primary)]"; // Teal - important but calm
    case "MEDIUM":
      return "bg-[var(--color-warning)]"; // Amber
    case "LOW":
      return "bg-[var(--color-text-muted)]"; // Gray
    default:
      return "bg-[var(--color-text-muted)]";
  }
}

/**
 * Get status background style
 * Completed items are visually de-emphasized
 */
function getStatusStyle(status: CalendarAssignment["status"]): string {
  if (status === "COMPLETED") {
    return "opacity-60 line-through";
  }
  return "";
}

export function CalendarEvent({
  assignment,
  variant = "default",
  onClick,
  className,
}: CalendarEventProps) {
  const dueDate = new Date(assignment.dueDate);
  const deadlineColor = getDeadlineColorClass(dueDate, assignment.status);
  const courseColor = assignment.course.color || "var(--color-primary)";

  // Compact variant for month view (limited space)
  if (variant === "compact") {
    return (
      <button
        onClick={() => onClick?.(assignment)}
        className={cn(
          "w-full text-start rounded px-1.5 py-0.5 text-xs truncate",
          "min-h-[24px]", // Smaller for compact view
          "hover:opacity-80 transition-opacity",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
          getStatusStyle(assignment.status),
          className
        )}
        style={{
          backgroundColor: `${courseColor}20`,
          borderInlineStart: `3px solid ${courseColor}`,
        }}
        title={assignment.title}
      >
        {assignment.title}
      </button>
    );
  }

  // Default variant for week view
  if (variant === "default") {
    return (
      <button
        onClick={() => onClick?.(assignment)}
        className={cn(
          "w-full text-start rounded-md p-2",
          "min-h-[44px]", // Touch target
          "hover:shadow-md transition-shadow",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
          getStatusStyle(assignment.status),
          className
        )}
        style={{
          backgroundColor: `${courseColor}15`,
          borderInlineStart: `4px solid ${courseColor}`,
        }}
      >
        <div className="flex items-start gap-2">
          {/* Priority dot */}
          <span
            className={cn(
              "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
              getPriorityDot(assignment.priority)
            )}
          />

          <div className="flex-1 min-w-0">
            {/* Title */}
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
              {assignment.title}
            </p>

            {/* Course name */}
            <p className="text-xs text-[var(--color-text-secondary)] truncate">
              {assignment.course.name}
            </p>
          </div>
        </div>
      </button>
    );
  }

  // Expanded variant for day view (more details)
  return (
    <button
      onClick={() => onClick?.(assignment)}
      className={cn(
        "w-full text-start rounded-lg p-3",
        "min-h-[44px]", // Touch target
        "hover:shadow-md transition-shadow",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
        getStatusStyle(assignment.status),
        className
      )}
      style={{
        backgroundColor: `${courseColor}15`,
        borderInlineStart: `4px solid ${courseColor}`,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Priority dot */}
        <span
          className={cn(
            "w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0",
            getPriorityDot(assignment.priority)
          )}
        />

        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-base font-medium text-[var(--color-text-primary)]">
            {assignment.title}
          </p>

          {/* Course name */}
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            {assignment.course.name}
          </p>

          {/* Description preview (if exists) */}
          {assignment.description && (
            <p className="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-2">
              {assignment.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-3 mt-2 text-xs">
            {/* Due time */}
            <span className={deadlineColor}>
              {dueDate.toLocaleTimeString("he-IL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

            {/* Weight (if exists) */}
            {assignment.weight && (
              <span className="text-[var(--color-text-muted)]">
                {assignment.weight}% מהציון
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
