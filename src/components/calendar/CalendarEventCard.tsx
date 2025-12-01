"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { CalendarAssignment } from "@/hooks/useCalendar";
import { EventPopover } from "./EventPopover";

/**
 * CalendarEventCard Component
 *
 * Wrapper for calendar events that adds popover functionality.
 * Provides consistent click handling and touch interactions.
 *
 * Touch Interactions (from plan):
 * - Desktop: Click event → open popover
 * - Mobile: Tap event → open popover
 * - Long press → quick complete action (future enhancement)
 * - Swipe left/right → navigate days/weeks (handled by parent)
 *
 * Accessibility:
 * - Keyboard accessible (Enter/Space to open)
 * - Focus visible ring
 * - ARIA labels
 */

interface CalendarEventCardProps {
  /** Assignment data */
  assignment: CalendarAssignment;
  /** Size variant */
  variant?: "compact" | "default" | "expanded";
  /** Called when status changes */
  onStatusChange?: (assignmentId: string, completed: boolean) => void;
  /** Called when edit clicked */
  onEdit?: (assignment: CalendarAssignment) => void;
  /** Called when navigate to course clicked */
  onNavigateToCourse?: (courseId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get priority indicator color
 */
function getPriorityDot(priority: CalendarAssignment["priority"]): string {
  switch (priority) {
    case "HIGH":
      return "bg-[var(--color-primary)]";
    case "MEDIUM":
      return "bg-[var(--color-warning)]";
    case "LOW":
      return "bg-[var(--color-text-muted)]";
    default:
      return "bg-[var(--color-text-muted)]";
  }
}

/**
 * Get status style
 */
function getStatusStyle(status: CalendarAssignment["status"]): string {
  if (status === "COMPLETED") {
    return "opacity-60 line-through";
  }
  return "";
}

export function CalendarEventCard({
  assignment,
  variant = "default",
  onStatusChange,
  onEdit,
  onNavigateToCourse,
  className,
}: CalendarEventCardProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const courseColor = assignment.course.color || "var(--color-primary)";

  // Handle status change from popover
  const handleStatusChange = async (
    assignmentId: string,
    completed: boolean
  ) => {
    if (onStatusChange) {
      await onStatusChange(assignmentId, completed);
    }
  };

  // Compact variant for month view
  if (variant === "compact") {
    return (
      <EventPopover
        assignment={assignment}
        open={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
        onStatusChange={handleStatusChange}
        onEdit={onEdit}
        onNavigateToCourse={onNavigateToCourse}
      >
        <button
          className={cn(
            "w-full text-start rounded px-1.5 py-0.5 text-xs truncate",
            "min-h-[24px]",
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
          aria-label={`${assignment.title} - ${assignment.course.name}`}
        >
          {assignment.title}
        </button>
      </EventPopover>
    );
  }

  // Default variant for week view
  if (variant === "default") {
    return (
      <EventPopover
        assignment={assignment}
        open={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
        onStatusChange={handleStatusChange}
        onEdit={onEdit}
        onNavigateToCourse={onNavigateToCourse}
      >
        <button
          className={cn(
            "w-full text-start rounded-md p-2",
            "min-h-[44px]",
            "hover:shadow-md transition-shadow",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
            getStatusStyle(assignment.status),
            className
          )}
          style={{
            backgroundColor: `${courseColor}15`,
            borderInlineStart: `4px solid ${courseColor}`,
          }}
          aria-label={`${assignment.title} - ${assignment.course.name}`}
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
      </EventPopover>
    );
  }

  // Expanded variant for day view
  return (
    <EventPopover
      assignment={assignment}
      open={isPopoverOpen}
      onOpenChange={setIsPopoverOpen}
      onStatusChange={handleStatusChange}
      onEdit={onEdit}
      onNavigateToCourse={onNavigateToCourse}
    >
      <button
        className={cn(
          "w-full text-start rounded-lg p-3",
          "min-h-[44px]",
          "hover:shadow-md transition-shadow",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
          getStatusStyle(assignment.status),
          className
        )}
        style={{
          backgroundColor: `${courseColor}15`,
          borderInlineStart: `4px solid ${courseColor}`,
        }}
        aria-label={`${assignment.title} - ${assignment.course.name}`}
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

            {/* Description preview */}
            {assignment.description && (
              <p className="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-2">
                {assignment.description}
              </p>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-3 mt-2 text-xs">
              {/* Due time */}
              <span className="text-[var(--color-text-muted)]">
                {new Date(assignment.dueDate).toLocaleTimeString("he-IL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>

              {/* Weight */}
              {assignment.weight && (
                <span className="text-[var(--color-text-muted)]">
                  {assignment.weight}% מהציון
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    </EventPopover>
  );
}
