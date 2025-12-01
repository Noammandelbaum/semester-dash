"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, GripVertical, Pencil, Trash2, AlertCircle } from "lucide-react";
import type { AssignmentStatus, AssignmentPriority } from "@prisma/client";

/**
 * KanbanCard
 * Draggable card for Kanban board
 *
 * Features:
 * - Drag handle for accessibility
 * - Course badge with color
 * - Due date with urgency indicator
 * - Priority badge
 * - Edit/Delete actions on hover
 *
 * UX: Touch-friendly, clear visual hierarchy
 */

interface Course {
  id: string;
  name: string;
  color: string | null;
  courseCode: string | null;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  weight: number | null;
  courseId: string;
  course: Course;
}

interface KanbanCardProps {
  assignment: Assignment;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigateToCourse: () => void;
  isDragging?: boolean;
}

const courseColorMap: Record<string, string> = {
  red: "bg-red-100 text-red-700 border-red-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  green: "bg-green-100 text-green-700 border-green-200",
  teal: "bg-teal-100 text-teal-700 border-teal-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  pink: "bg-pink-100 text-pink-700 border-pink-200",
};

const priorityVariants: Record<AssignmentPriority, "secondary" | "warning" | "danger"> = {
  LOW: "secondary",
  MEDIUM: "warning",
  HIGH: "danger",
};

const priorityLabels: Record<AssignmentPriority, string> = {
  LOW: "נמוכה",
  MEDIUM: "בינונית",
  HIGH: "גבוהה",
};

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
  });
}

function getDeadlineUrgency(dateStr: string): "overdue" | "urgent" | "soon" | "normal" {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "urgent";
  if (diffDays <= 3) return "soon";
  return "normal";
}

export function KanbanCard({
  assignment,
  onEdit,
  onDelete,
  onNavigateToCourse,
  isDragging = false,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: assignment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const urgency = getDeadlineUrgency(assignment.dueDate);
  const isCompleted = assignment.status === "COMPLETED";

  const urgencyStyles = {
    overdue: "text-[var(--color-danger)]",
    urgent: "text-[var(--color-danger)]",
    soon: "text-[var(--color-warning)]",
    normal: "text-[var(--color-text-secondary)]",
  };

  const getCourseColorClasses = (color: string | null) => {
    return courseColorMap[color || "indigo"] || courseColorMap.indigo;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-3 transition-all duration-200",
        "hover:shadow-md cursor-grab active:cursor-grabbing",
        isDragging && "shadow-lg opacity-90 rotate-2",
        isSortableDragging && "opacity-50",
        isCompleted && "opacity-75"
      )}
    >
      {/* Header with drag handle */}
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          className="touch-none p-1 -m-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] min-h-[44px] min-w-[24px] flex items-center justify-center"
          {...attributes}
          {...listeners}
          aria-label="גרור כדי להזיז"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Course badge */}
          <Badge
            className={cn(
              "text-xs border mb-2 cursor-pointer hover:opacity-80 transition-opacity",
              getCourseColorClasses(assignment.course.color)
            )}
            onClick={(e) => {
              e.stopPropagation();
              onNavigateToCourse();
            }}
          >
            {assignment.course.name}
          </Badge>

          {/* Title */}
          <h4
            className={cn(
              "font-medium text-sm text-[var(--color-text-primary)] line-clamp-2",
              isCompleted && "line-through text-[var(--color-text-muted)]"
            )}
          >
            {assignment.title}
          </h4>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Due date */}
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isCompleted ? "text-[var(--color-text-muted)]" : urgencyStyles[urgency]
              )}
            >
              {urgency === "overdue" && !isCompleted ? (
                <AlertCircle className="w-3 h-3" />
              ) : (
                <Calendar className="w-3 h-3" />
              )}
              <span>{formatDueDate(assignment.dueDate)}</span>
            </div>

            {/* Priority badge */}
            {assignment.priority !== "MEDIUM" && (
              <Badge variant={priorityVariants[assignment.priority]} className="text-xs">
                {priorityLabels[assignment.priority]}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions - visible on hover */}
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(assignment.id);
            }}
            className="min-h-[32px] min-w-[32px] p-1"
            aria-label="ערוך משימה"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(assignment.id);
            }}
            className="min-h-[32px] min-w-[32px] p-1 text-[var(--color-danger)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
            aria-label="מחק משימה"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
