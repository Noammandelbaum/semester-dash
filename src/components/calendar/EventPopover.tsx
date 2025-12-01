"use client";

import { useState } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  BookOpen,
  Flag,
  Percent,
  Pencil,
  ExternalLink,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarAssignment } from "@/hooks/useCalendar";
import { getDeadlineColorClass, getDeadlineLabel } from "@/hooks/useCalendar";

/**
 * EventPopover Component
 *
 * Displays assignment details in a popover when clicking on a calendar event.
 *
 * Features (from plan):
 * - Assignment title and course
 * - Due date/time
 * - Priority badge
 * - Weight (if exists)
 * - Quick complete toggle
 * - Edit button (opens EditAssignmentDialog)
 * - Navigate to course link
 * - Click outside to dismiss
 *
 * UX (from ux-research.md):
 * - Touch targets 44px minimum
 * - Supportive messaging, not guilt-inducing
 * - Anxiety-reducing colors
 */

interface EventPopoverProps {
  /** Assignment data */
  assignment: CalendarAssignment;
  /** Trigger element (the calendar event) */
  children: React.ReactNode;
  /** Called when status changes (quick complete) */
  onStatusChange?: (assignmentId: string, completed: boolean) => void;
  /** Called when edit button clicked */
  onEdit?: (assignment: CalendarAssignment) => void;
  /** Called when navigate to course clicked */
  onNavigateToCourse?: (courseId: string) => void;
  /** Control open state externally */
  open?: boolean;
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Get priority label and color
 */
function getPriorityDisplay(priority: CalendarAssignment["priority"]): {
  label: string;
  colorClass: string;
} {
  switch (priority) {
    case "HIGH":
      return {
        label: "גבוהה",
        colorClass: "text-[var(--color-primary)] bg-[var(--color-primary)]/10",
      };
    case "MEDIUM":
      return {
        label: "בינונית",
        colorClass: "text-[var(--color-warning)] bg-[var(--color-warning)]/10",
      };
    case "LOW":
      return {
        label: "נמוכה",
        colorClass: "text-[var(--color-text-muted)] bg-[var(--color-background)]",
      };
    default:
      return {
        label: "בינונית",
        colorClass: "text-[var(--color-text-muted)] bg-[var(--color-background)]",
      };
  }
}

/**
 * Get status display info
 */
function getStatusDisplay(status: CalendarAssignment["status"]): {
  label: string;
  colorClass: string;
} {
  switch (status) {
    case "COMPLETED":
      return {
        label: "הושלם",
        colorClass: "text-[var(--color-success)] bg-[var(--color-success)]/10",
      };
    case "IN_PROGRESS":
      return {
        label: "בתהליך",
        colorClass: "text-[var(--color-primary)] bg-[var(--color-primary)]/10",
      };
    case "NOT_STARTED":
    default:
      return {
        label: "לא התחיל",
        colorClass: "text-[var(--color-text-muted)] bg-[var(--color-background)]",
      };
  }
}

export function EventPopover({
  assignment,
  children,
  onStatusChange,
  onEdit,
  onNavigateToCourse,
  open,
  onOpenChange,
}: EventPopoverProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const dueDate = new Date(assignment.dueDate);
  const deadlineColor = getDeadlineColorClass(dueDate, assignment.status);
  const deadlineLabel = getDeadlineLabel(dueDate, assignment.status);
  const priorityDisplay = getPriorityDisplay(assignment.priority);
  const statusDisplay = getStatusDisplay(assignment.status);
  const isCompleted = assignment.status === "COMPLETED";
  const courseColor = assignment.course.color || "var(--color-primary)";

  const handleQuickComplete = async () => {
    if (!onStatusChange || isUpdating) return;

    setIsUpdating(true);
    try {
      await onStatusChange(assignment.id, !isCompleted);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="start"
        side="bottom"
        sideOffset={8}
      >
        {/* Header with course color */}
        <div
          className="p-4 border-b border-[var(--color-border)]"
          style={{ borderTopColor: courseColor, borderTopWidth: 4 }}
        >
          {/* Title */}
          <h3 className="text-base font-medium text-[var(--color-text-primary)] mb-1">
            {assignment.title}
          </h3>

          {/* Course name */}
          <p className="text-sm text-[var(--color-text-secondary)]">
            {assignment.course.name}
          </p>
        </div>

        {/* Details */}
        <div className="p-4 space-y-3">
          {/* Due date */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-[var(--color-text-muted)] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-[var(--color-text-secondary)]">
                תאריך הגשה
              </p>
              <p className={cn("text-sm font-medium", deadlineColor)}>
                {format(dueDate, "EEEE, d בMMMM yyyy", { locale: he })}
                <span className="ms-2 text-[var(--color-text-muted)]">
                  {format(dueDate, "HH:mm")}
                </span>
              </p>
              <p className={cn("text-xs mt-0.5", deadlineColor)}>
                {deadlineLabel}
              </p>
            </div>
          </div>

          {/* Course */}
          <div className="flex items-center gap-3">
            <BookOpen className="h-4 w-4 text-[var(--color-text-muted)] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-[var(--color-text-secondary)]">קורס</p>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {assignment.course.name}
                {assignment.course.courseCode && (
                  <span className="ms-2 text-[var(--color-text-muted)]">
                    ({assignment.course.courseCode})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-3">
            <Flag className="h-4 w-4 text-[var(--color-text-muted)] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-[var(--color-text-secondary)]">עדיפות</p>
              <span
                className={cn(
                  "inline-block px-2 py-0.5 rounded text-xs font-medium",
                  priorityDisplay.colorClass
                )}
              >
                {priorityDisplay.label}
              </span>
            </div>
          </div>

          {/* Weight (if exists) */}
          {assignment.weight && (
            <div className="flex items-center gap-3">
              <Percent className="h-4 w-4 text-[var(--color-text-muted)] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-[var(--color-text-secondary)]">משקל</p>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {assignment.weight}% מהציון
                </p>
              </div>
            </div>
          )}

          {/* Description (if exists) */}
          {assignment.description && (
            <div className="pt-2 border-t border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-text-muted)] line-clamp-3">
                {assignment.description}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-background)]">
          <div className="flex items-center gap-2">
            {/* Quick complete toggle */}
            <button
              onClick={handleQuickComplete}
              disabled={isUpdating}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg",
                "min-h-[44px] flex-1",
                "transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
                isCompleted
                  ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                  : "bg-[var(--color-background)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)]"
              )}
            >
              {isCompleted ? (
                <>
                  <Check className="h-4 w-4" />
                  <span className="text-sm">הושלם</span>
                </>
              ) : (
                <>
                  <Checkbox
                    checked={false}
                    className="pointer-events-none"
                    aria-hidden
                  />
                  <span className="text-sm">סמן כהושלם</span>
                </>
              )}
            </button>

            {/* Edit button */}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(assignment)}
                className="min-h-[44px] min-w-[44px]"
                aria-label="ערוך משימה"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}

            {/* Navigate to course */}
            {onNavigateToCourse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateToCourse(assignment.courseId)}
                className="min-h-[44px] min-w-[44px]"
                aria-label="עבור לקורס"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
