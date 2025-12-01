"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { CreateCourseDialog } from "@/components/courses/create-course-dialog";

/**
 * DashboardEmptyState
 * Shown when user has no courses yet
 *
 * UX: Encouraging, educational - guide user to add first course
 */
interface DashboardEmptyStateProps {
  onCourseCreated: () => void;
  hasSemester: boolean;
}

export function DashboardEmptyState({
  onCourseCreated,
  hasSemester,
}: DashboardEmptyStateProps) {
  if (!hasSemester) {
    return (
      <EmptyState
        illustration="empty-courses"
        title="בוא נתחיל את הסמסטר!"
        description="הגדר את הסמסטר הנוכחי שלך כדי לראות את התמונה המלאה"
        actionLabel="הגדר סמסטר"
        onAction={() => {
          // TODO: Navigate to semester setup or open dialog
          window.location.href = "/dashboard/settings";
        }}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <EmptyState
        illustration="empty-courses"
        title="עדיין אין לך קורסים"
        description="הוסף את הקורסים שלך כדי לראות את התמונה המלאה של הסמסטר"
      />
      <div className="mt-6">
        <CreateCourseDialog onCourseCreated={onCourseCreated} />
      </div>
    </div>
  );
}
