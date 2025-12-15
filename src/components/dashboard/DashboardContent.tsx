"use client";

import * as React from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { DashboardGreeting } from "./DashboardGreeting";
import { SemesterProgressRing } from "./SemesterProgressRing";
import { QuickStats } from "./QuickStats";
import { CourseCard } from "./CourseCard";
import { UpcomingDeadlines } from "./UpcomingDeadlines";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { DashboardEmptyState } from "./DashboardEmptyState";
import type { DashboardStats } from "@/app/api/dashboard/stats/route";

/**
 * DashboardContent
 * Main client component for the dashboard
 *
 * Layout (Desktop - lg:grid-cols-3):
 * ┌─────────────────────────────────────────────────────────┐
 * │ DashboardGreeting                                       │
 * ├────────────────────────────┬────────────────────────────┤
 * │ SemesterProgressRing       │ QuickStats                 │
 * │ (large, central)           │ (3 cards)                  │
 * ├────────────────────────────┼────────────────────────────┤
 * │ CourseCards Grid           │ UpcomingDeadlines          │
 * │ (2x3 max)                  │ (5 items)                  │
 * ├────────────────────────────┼────────────────────────────┤
 * │                            │ QuickAddButtons            │
 * └────────────────────────────┴────────────────────────────┘
 *
 * Mobile: Single column, stacked
 */
interface DashboardContentProps {
  initialData?: DashboardStats;
}

export function DashboardContent({ initialData }: DashboardContentProps) {
  const { data, isLoading, error, refresh } = useDashboard(initialData);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as Element;
      const isInputField = target.tagName === 'INPUT' ||
                          target.tagName === 'TEXTAREA' ||
                          target.tagName === 'SELECT';

      if (isInputField) return;

      // Add specific shortcut handlers here when needed
      // For now, just setup the infrastructure
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Loading state
  if (isLoading && !data) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 rounded-xl bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
        <p className="font-medium">שגיאה בטעינת הדשבורד</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={refresh}
          className="mt-4 text-sm underline hover:no-underline"
        >
          נסה שוב
        </button>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <DashboardEmptyState
        hasSemester={false}
        onCourseCreated={refresh}
      />
    );
  }

  // Empty courses state
  if (data.courses.total === 0) {
    return (
      <DashboardEmptyState
        hasSemester={!!data.semester}
        onCourseCreated={refresh}
      />
    );
  }

  // Calculate green courses count for greeting
  const greenCoursesCount = data.courses.list.filter(
    (course) => course.status === "green"
  ).length;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <DashboardGreeting
        greenCoursesCount={greenCoursesCount}
        totalCoursesCount={data.courses.total}
      />

      {/* Main grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Progress + Courses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Semester progress (if active semester) */}
          {data.semester && (
            <div className="flex justify-center py-4">
              <SemesterProgressRing
                currentWeek={data.semester.currentWeek}
                totalWeeks={data.semester.totalWeeks}
                progressPercent={data.semester.progressPercent}
                semesterName={data.semester.name}
              />
            </div>
          )}

          {/* Quick stats */}
          <QuickStats
            coursesTotal={data.courses.total}
            assignmentsCompleted={data.assignments.completed}
            assignmentsTotal={data.assignments.total}
            thisWeekDeadlines={data.assignments.thisWeek}
          />

          {/* Course cards grid */}
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              הקורסים שלי
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.courses.list.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  name={course.name}
                  courseCode={course.courseCode}
                  color={course.color}
                  assignmentStats={course.assignmentStats}
                  status={course.status}
                  nextDeadline={course.nextDeadline}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Deadlines */}
        <div className="space-y-6">
          {/* Upcoming deadlines */}
          <UpcomingDeadlines
            assignments={data.assignments.upcoming}
            maxItems={5}
          />
        </div>
      </div>
    </div>
  );
}
