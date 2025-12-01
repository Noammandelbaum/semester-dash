"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { CourseHeader } from "@/components/courses/CourseHeader";
import { CourseStats } from "@/components/courses/CourseStats";
import { AssignmentList, type Assignment } from "@/components/courses/AssignmentList";
import { CreateAssignmentDialog } from "@/components/courses/CreateAssignmentDialog";
import { EditAssignmentDialog } from "@/components/courses/EditAssignmentDialog";
import { EditCourseDialog } from "@/components/courses/edit-course-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AssignmentStatus } from "@prisma/client";

/**
 * Course Detail Page
 * Shows course info with all assignments
 *
 * Features:
 * - Course header with edit/delete actions
 * - Assignment statistics
 * - Assignment list with toggle, edit, delete
 * - Add assignment button
 *
 * Route: /dashboard/courses/[id]
 */

interface Course {
  id: string;
  name: string;
  courseCode: string | null;
  credits: number | null;
  color: string | null;
  description: string | null;
}

interface CourseWithAssignments extends Course {
  assignments: Assignment[];
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<CourseWithAssignments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Assignment being edited/deleted
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);

  // Fetch course with assignments
  const fetchCourse = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch course details
      const courseResponse = await fetch(`/api/courses/${courseId}`);
      if (!courseResponse.ok) {
        if (courseResponse.status === 404) {
          throw new Error("הקורס לא נמצא");
        }
        throw new Error("שגיאה בטעינת הקורס");
      }
      const courseData = await courseResponse.json();

      // Fetch assignments for this course
      const assignmentsResponse = await fetch(
        `/api/assignments?courseId=${courseId}`
      );
      if (!assignmentsResponse.ok) {
        throw new Error("שגיאה בטעינת המשימות");
      }
      const assignmentsData = await assignmentsResponse.json();

      setCourse({
        ...courseData,
        assignments: assignmentsData.assignments,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "אירעה שגיאה לא צפויה");
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId, fetchCourse]);

  // Navigation
  const handleBack = () => {
    router.push("/dashboard");
  };

  // Course actions
  const handleEditCourse = () => {
    setIsEditDialogOpen(true);
  };

  const handleDeleteCourse = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCourse = async () => {
    try {
      setIsDeleting(true);

      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("שגיאה במחיקת הקורס");
      }

      // Navigate back to dashboard
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה במחיקת הקורס");
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Assignment actions
  const handleToggleAssignmentStatus = async (
    assignmentId: string,
    newStatus: AssignmentStatus
  ) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("שגיאה בעדכון המשימה");
      }

      // Refresh data
      await fetchCourse();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בעדכון המשימה");
    }
  };

  const handleEditAssignment = (assignmentId: string) => {
    setEditingAssignmentId(assignmentId);
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    setDeletingAssignmentId(assignmentId);
  };

  const confirmDeleteAssignment = async () => {
    if (!deletingAssignmentId) return;

    try {
      const response = await fetch(`/api/assignments/${deletingAssignmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("שגיאה במחיקת המשימה");
      }

      // Refresh data
      await fetchCourse();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה במחיקת המשימה");
    } finally {
      setDeletingAssignmentId(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-20" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-2 h-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>

        {/* Stats skeleton */}
        <Skeleton className="h-32 w-full rounded-xl" />

        {/* Assignments skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          חזור
        </Button>
        <div className="p-6 rounded-xl bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
          <p className="font-medium">שגיאה</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchCourse}
            className="mt-4 text-sm underline hover:no-underline"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  // No course found
  if (!course) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          חזור
        </Button>
        <div className="p-6 rounded-xl bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
          <p className="font-medium">הקורס לא נמצא</p>
          <p className="text-sm mt-1">ייתכן שהקורס נמחק או שאין לך הרשאה לצפות בו</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    total: course.assignments.length,
    completed: course.assignments.filter((a) => a.status === "COMPLETED").length,
    inProgress: course.assignments.filter((a) => a.status === "IN_PROGRESS").length,
  };

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <CourseHeader
        course={course}
        onBack={handleBack}
        onEdit={handleEditCourse}
        onDelete={handleDeleteCourse}
      />

      {/* Course Stats */}
      <CourseStats
        total={stats.total}
        completed={stats.completed}
        inProgress={stats.inProgress}
      />

      {/* Assignments Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            משימות
          </h2>
          <CreateAssignmentDialog
            courseId={course.id}
            onAssignmentCreated={fetchCourse}
          />
        </div>

        <AssignmentList
          assignments={course.assignments}
          onToggleStatus={handleToggleAssignmentStatus}
          onEdit={handleEditAssignment}
          onDelete={handleDeleteAssignment}
          onAddNew={() => {
            // The CreateAssignmentDialog button is already visible
            // This is used by empty state
          }}
        />
      </div>

      {/* Edit Course Dialog */}
      {isEditDialogOpen && (
        <EditCourseDialog
          course={course}
          onCourseUpdated={() => {
            fetchCourse();
            setIsEditDialogOpen(false);
          }}
        />
      )}

      {/* Delete Course Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחיקת קורס</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק את הקורס "{course.name}"?
              <br />
              <span className="text-[var(--color-danger)]">
                פעולה זו תמחק גם את כל המשימות של הקורס ולא ניתן לבטל אותה.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              ביטול
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteCourse}
              isLoading={isDeleting}
            >
              מחק קורס
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Assignment Confirmation Dialog */}
      <Dialog
        open={!!deletingAssignmentId}
        onOpenChange={() => setDeletingAssignmentId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחיקת משימה</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק את המשימה?
              <br />
              פעולה זו לא ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeletingAssignmentId(null)}
            >
              ביטול
            </Button>
            <Button variant="danger" onClick={confirmDeleteAssignment}>
              מחק משימה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      {editingAssignmentId && (() => {
        const assignmentToEdit = course.assignments.find(
          (a) => a.id === editingAssignmentId
        );
        if (!assignmentToEdit) return null;
        return (
          <EditAssignmentDialog
            assignment={assignmentToEdit}
            open={!!editingAssignmentId}
            onOpenChange={(open) => {
              if (!open) setEditingAssignmentId(null);
            }}
            onAssignmentUpdated={() => {
              fetchCourse();
              setEditingAssignmentId(null);
            }}
          />
        );
      })()}
    </div>
  );
}
