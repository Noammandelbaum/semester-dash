"use client";

import { useState } from "react";
import { Pencil, Trash2, Calendar, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AssignmentStatus, AssignmentPriority } from "@prisma/client";

/**
 * AssignmentItem
 * Single assignment row with checkbox toggle
 *
 * Features:
 * - Checkbox to toggle completion status
 * - Due date with urgency coloring
 * - Priority indicator
 * - Edit/Delete actions
 * - Smooth animation on completion
 *
 * UX: 44px touch targets, gentle celebration on completion
 */

interface AssignmentItemProps {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  weight?: number | null;
  onToggleStatus: (id: string, newStatus: AssignmentStatus) => Promise<void>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const priorityLabels: Record<AssignmentPriority, string> = {
  LOW: "נמוכה",
  MEDIUM: "בינונית",
  HIGH: "גבוהה",
};

const priorityVariants: Record<AssignmentPriority, "secondary" | "warning" | "danger"> = {
  LOW: "secondary",
  MEDIUM: "warning",
  HIGH: "danger",
};

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Future dates
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 1) return "אתמול";
    if (absDays <= 7) return `לפני ${absDays} ימים`;
    if (absDays <= 14) return "לפני שבוע";
    return date.toLocaleDateString("he-IL", { day: "numeric", month: "short" });
  }
  if (diffDays === 0) return "היום";
  if (diffDays === 1) return "מחר";
  if (diffDays <= 7) return `עוד ${diffDays} ימים`;
  if (diffDays <= 14) return `עוד שבוע ו-${diffDays - 7} ימים`;
  return date.toLocaleDateString("he-IL", { day: "numeric", month: "short" });
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

export function AssignmentItem({
  id,
  title,
  description,
  dueDate,
  status,
  priority,
  weight,
  onToggleStatus,
  onEdit,
  onDelete,
}: AssignmentItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const isCompleted = status === "COMPLETED";
  const urgency = getDeadlineUrgency(dueDate);

  const handleToggle = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    const newStatus: AssignmentStatus = isCompleted ? "NOT_STARTED" : "COMPLETED";

    try {
      await onToggleStatus(id, newStatus);

      // Show success animation when completing (not when uncompleting)
      if (!isCompleted && newStatus === "COMPLETED") {
        setJustCompleted(true);
        setTimeout(() => setJustCompleted(false), 500);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const urgencyStyles = {
    overdue: "text-[var(--color-danger)]",
    urgent: "text-[var(--color-danger)]",
    soon: "text-[var(--color-warning)]",
    normal: "text-[var(--color-text-secondary)]",
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-3 p-4 rounded-lg border transition-all duration-200",
        "bg-[var(--color-surface)] border-[var(--color-border)]",
        "hover:shadow-sm",
        isCompleted && "opacity-75",
        justCompleted && "bg-[var(--color-success)]/5 border-[var(--color-success)] animate-scale-in"
      )}
      role="listitem"
    >
      {/* Checkbox - wrapper provides 44px touch target */}
      <label className="flex items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer shrink-0">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleToggle}
          disabled={isUpdating}
          aria-label={isCompleted ? `סמן "${title}" כלא הושלם` : `סמן "${title}" כהושלם`}
        />
      </label>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4
              className={cn(
                "font-medium text-[var(--color-text-primary)] truncate",
                isCompleted && "line-through text-[var(--color-text-muted)]"
              )}
            >
              {title}
            </h4>
            {description && (
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {/* Actions - always visible on mobile, hover on desktop */}
          <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(id)}
              className="min-h-[44px] min-w-[44px] p-2"
              aria-label="ערוך משימה"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(id)}
              className="min-h-[44px] min-w-[44px] p-2 text-[var(--color-danger)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
              aria-label="מחק משימה"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {/* Due date */}
          <div className={cn("flex items-center gap-1 text-sm", urgencyStyles[urgency])}>
            {urgency === "overdue" ? (
              <AlertCircle className="w-3.5 h-3.5" />
            ) : (
              <Calendar className="w-3.5 h-3.5" />
            )}
            <span>
              {urgency === "overdue" ? "באיחור: " : "הגשה: "}
              {formatDueDate(dueDate)}
            </span>
          </div>

          {/* Priority badge */}
          {priority !== "MEDIUM" && (
            <Badge variant={priorityVariants[priority]}>
              {priorityLabels[priority]}
            </Badge>
          )}

          {/* Weight badge */}
          {weight && (
            <Badge variant="secondary">
              {weight}% מהציון
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
