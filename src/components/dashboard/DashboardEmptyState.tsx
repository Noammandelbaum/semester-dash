"use client";

import { EmptyState } from "@/components/ui/empty-state";

/**
 * DashboardEmptyState
 * Shown when user has no courses yet
 *
 * UX: Guide user to sync from Moodle via extension
 */
interface DashboardEmptyStateProps {
  onCourseCreated: () => void;
  hasSemester: boolean;
}

export function DashboardEmptyState({
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
          window.location.href = "/dashboard/settings";
        }}
      />
    );
  }

  return (
    <EmptyState
      illustration="empty-courses"
      title="עדיין אין לך קורסים"
      description="סנכרן את הקורסים שלך מ-Moodle באמצעות התוסף של SemesterHub"
      actionLabel="פתח את Moodle"
      onAction={() => {
        window.open("https://moodle.jct.ac.il/my/courses.php", "_blank");
      }}
    />
  );
}
