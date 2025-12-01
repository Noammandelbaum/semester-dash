"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { AssignmentStatus } from "@prisma/client";

/**
 * KanbanColumn
 * Droppable column for Kanban board
 *
 * Features:
 * - Drop zone for assignments
 * - Visual feedback when dragging over
 * - Status-specific styling
 * - Count badge
 *
 * UX: Clear drop targets, visual hierarchy
 */

interface KanbanColumnProps {
  id: AssignmentStatus;
  title: string;
  count: number;
  children: React.ReactNode;
}

const columnStyles: Record<AssignmentStatus, { bg: string; border: string; accent: string }> = {
  NOT_STARTED: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    accent: "bg-slate-200 text-slate-600",
  },
  IN_PROGRESS: {
    bg: "bg-[var(--color-primary)]/5",
    border: "border-[var(--color-primary)]/20",
    accent: "bg-[var(--color-primary)]/20 text-[var(--color-primary)]",
  },
  COMPLETED: {
    bg: "bg-[var(--color-success)]/5",
    border: "border-[var(--color-success)]/20",
    accent: "bg-[var(--color-success)]/20 text-[var(--color-success)]",
  },
};

export function KanbanColumn({ id, title, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const styles = columnStyles[id];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border-2 p-4 min-h-[400px] transition-all duration-200",
        styles.bg,
        styles.border,
        isOver && "ring-2 ring-[var(--color-primary)] ring-offset-2"
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
        <span
          className={cn(
            "text-sm font-medium px-2 py-0.5 rounded-full",
            styles.accent
          )}
        >
          {count}
        </span>
      </div>

      {/* Column content */}
      <div className="space-y-2">{children}</div>

      {/* Empty state */}
      {count === 0 && (
        <div className="flex items-center justify-center h-32 text-[var(--color-text-muted)] text-sm">
          {id === "COMPLETED" ? "אין משימות שהושלמו" : "גרור משימות לכאן"}
        </div>
      )}
    </div>
  );
}
