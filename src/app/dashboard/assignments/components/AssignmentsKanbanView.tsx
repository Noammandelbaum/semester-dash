"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { EditAssignmentDialog } from "@/components/courses/EditAssignmentDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AssignmentStatus, AssignmentPriority } from "@prisma/client";

/**
 * AssignmentsKanbanView
 * Kanban board with 3 columns for assignment status
 *
 * Features:
 * - Three columns: לא התחיל | בתהליך | הושלם
 * - Drag-and-drop between columns
 * - Touch-friendly (44px targets)
 * - RTL layout (first column on right)
 *
 * UX: Visual progress, satisfying drag interaction
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

interface AssignmentsKanbanViewProps {
  assignments: Assignment[];
  onStatusChange: (id: string, newStatus: AssignmentStatus) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const columns: { id: AssignmentStatus; title: string }[] = [
  { id: "NOT_STARTED", title: "לא התחיל" },
  { id: "IN_PROGRESS", title: "בתהליך" },
  { id: "COMPLETED", title: "הושלם" },
];

export function AssignmentsKanbanView({
  assignments,
  onStatusChange,
  onRefresh,
}: AssignmentsKanbanViewProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Group assignments by status
  const assignmentsByStatus = columns.reduce(
    (acc, column) => {
      acc[column.id] = assignments.filter((a) => a.status === column.id);
      return acc;
    },
    {} as Record<AssignmentStatus, Assignment[]>
  );

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const assignmentId = active.id as string;
    const newStatus = over.id as AssignmentStatus;

    // Find the assignment
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment || assignment.status === newStatus) return;

    // Update status via API
    await onStatusChange(assignmentId, newStatus);
  };

  const handleEdit = (assignmentId: string) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (assignment) {
      setEditingAssignment(assignment);
    }
  };

  const handleDelete = (assignmentId: string) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (assignment) {
      setDeletingAssignment(assignment);
    }
  };

  const confirmDelete = async () => {
    if (!deletingAssignment) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/assignments/${deletingAssignment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      await onRefresh();
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
      setDeletingAssignment(null);
    }
  };

  const activeAssignment = activeId
    ? assignments.find((a) => a.id === activeId)
    : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Kanban board - RTL: first column on right */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              count={assignmentsByStatus[column.id].length}
            >
              <SortableContext
                items={assignmentsByStatus[column.id].map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {assignmentsByStatus[column.id].map((assignment) => (
                    <KanbanCard
                      key={assignment.id}
                      assignment={assignment}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onNavigateToCourse={() =>
                        router.push(`/dashboard/courses/${assignment.courseId}`)
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </KanbanColumn>
          ))}
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeAssignment && (
            <KanbanCard
              assignment={activeAssignment}
              onEdit={() => {}}
              onDelete={() => {}}
              onNavigateToCourse={() => {}}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Edit dialog */}
      {editingAssignment && (
        <EditAssignmentDialog
          assignment={editingAssignment}
          open={!!editingAssignment}
          onOpenChange={(open) => !open && setEditingAssignment(null)}
          onAssignmentUpdated={() => {
            onRefresh();
            setEditingAssignment(null);
          }}
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deletingAssignment}
        onOpenChange={() => setDeletingAssignment(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחיקת משימה</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק את המשימה "{deletingAssignment?.title}"?
              <br />
              פעולה זו לא ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeletingAssignment(null)}
              disabled={isDeleting}
            >
              ביטול
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              isLoading={isDeleting}
            >
              מחק משימה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
