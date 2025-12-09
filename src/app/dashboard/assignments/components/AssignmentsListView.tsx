"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AssignmentItem } from "@/components/courses/AssignmentItem";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AssignmentStatus, AssignmentPriority } from "@prisma/client";

/**
 * AssignmentsListView
 * List/table view of all assignments
 *
 * Features:
 * - Shows course badge for each assignment
 * - Sorted by due date (upcoming first)
 * - Click to edit, checkbox to toggle status
 * - Group by status or date (optional)
 *
 * UX: Scannable list with clear visual hierarchy
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

interface AssignmentsListViewProps {
  assignments: Assignment[];
  onStatusChange: (id: string, newStatus: AssignmentStatus) => Promise<void>;
  onRefresh: () => Promise<void>;
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

export function AssignmentsListView({
  assignments,
  onStatusChange,
  onRefresh,
}: AssignmentsListViewProps) {
  const router = useRouter();
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const getCourseColorClasses = (color: string | null) => {
    return courseColorMap[color || "indigo"] || courseColorMap.indigo;
  };

  return (
    <div className="space-y-3">
      {/* Assignment list with course badges */}
      {assignments.map((assignment) => (
        <div key={assignment.id} className="relative">
          {/* Course badge - positioned above the item */}
          <div className="mb-1">
            <Badge
              className={cn(
                "text-xs border cursor-pointer hover:opacity-80 transition-opacity",
                getCourseColorClasses(assignment.course.color)
              )}
              onClick={() => router.push(`/dashboard/courses/${assignment.courseId}`)}
            >
              {assignment.course.name}
            </Badge>
          </div>

          {/* Assignment item */}
          <AssignmentItem
            id={assignment.id}
            title={assignment.title}
            description={assignment.description}
            dueDate={assignment.dueDate}
            status={assignment.status}
            priority={assignment.priority}
            weight={assignment.weight}
            onToggleStatus={onStatusChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      ))}

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
              האם אתה בטוח שברצונך למחוק את המשימה &quot;{deletingAssignment?.title}&quot;?
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
    </div>
  );
}
