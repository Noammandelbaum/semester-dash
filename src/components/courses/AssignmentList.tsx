"use client";

import { AssignmentItem } from "./AssignmentItem";
import { EmptyState } from "@/components/ui/empty-state";
import type { AssignmentStatus, AssignmentPriority } from "@prisma/client";

/**
 * AssignmentList
 * List of assignments for a course
 *
 * Features:
 * - Sorted by due date (upcoming first)
 * - Empty state when no assignments
 * - All done celebration when all completed
 *
 * UX: Clear visual hierarchy, grouped by completion status
 */

export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  weight: number | null;
}

interface AssignmentListProps {
  assignments: Assignment[];
  onToggleStatus: (id: string, newStatus: AssignmentStatus) => Promise<void>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

export function AssignmentList({
  assignments,
  onToggleStatus,
  onEdit,
  onDelete,
  onAddNew,
}: AssignmentListProps) {
  // Empty state
  if (assignments.length === 0) {
    return (
      <EmptyState
        illustration="empty-assignments"
        title="אין משימות עדיין"
        description="הוסף את המשימות הראשונות שלך לקורס הזה"
        actionLabel="הוסף משימה"
        onAction={onAddNew}
      />
    );
  }

  // Check if all completed
  const completedCount = assignments.filter((a) => a.status === "COMPLETED").length;
  const allCompleted = completedCount === assignments.length && assignments.length > 0;

  // Sort: incomplete first (by due date), then completed
  const sortedAssignments = [...assignments].sort((a, b) => {
    // Completed assignments go to the bottom
    if (a.status === "COMPLETED" && b.status !== "COMPLETED") return 1;
    if (a.status !== "COMPLETED" && b.status === "COMPLETED") return -1;

    // Sort by due date (ascending)
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // Separate incomplete and completed
  const incompleteAssignments = sortedAssignments.filter((a) => a.status !== "COMPLETED");
  const completedAssignments = sortedAssignments.filter((a) => a.status === "COMPLETED");

  return (
    <div className="space-y-4">
      {/* All done celebration */}
      {allCompleted && (
        <div className="p-4 rounded-lg bg-[var(--color-success)]/10 text-center">
          <span className="text-lg">🎉</span>
          <p className="font-medium text-[var(--color-success)] mt-1">
            סיימת את כל המשימות!
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            מגיע לך להנות
          </p>
        </div>
      )}

      {/* Incomplete assignments */}
      {incompleteAssignments.length > 0 && (
        <div className="space-y-3" role="list" aria-label="משימות פתוחות">
          {incompleteAssignments.map((assignment) => (
            <AssignmentItem
              key={assignment.id}
              id={assignment.id}
              title={assignment.title}
              description={assignment.description}
              dueDate={assignment.dueDate}
              status={assignment.status}
              priority={assignment.priority}
              weight={assignment.weight}
              onToggleStatus={onToggleStatus}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Completed assignments (collapsible section) */}
      {completedAssignments.length > 0 && !allCompleted && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
            <span>הושלמו</span>
            <span className="bg-[var(--color-success)]/10 text-[var(--color-success)] px-2 py-0.5 rounded-full text-xs">
              {completedAssignments.length}
            </span>
          </h3>
          <div className="space-y-3" role="list" aria-label="משימות שהושלמו">
            {completedAssignments.map((assignment) => (
              <AssignmentItem
                key={assignment.id}
                id={assignment.id}
                title={assignment.title}
                description={assignment.description}
                dueDate={assignment.dueDate}
                status={assignment.status}
                priority={assignment.priority}
                weight={assignment.weight}
                onToggleStatus={onToggleStatus}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
