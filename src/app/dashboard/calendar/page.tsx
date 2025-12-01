"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout";
import { useCalendar, type CalendarAssignment } from "@/hooks/useCalendar";
import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarDayView } from "./components/CalendarDayView";
import { CalendarWeekView } from "./components/CalendarWeekView";
import { CalendarMonthView } from "./components/CalendarMonthView";
import { EditAssignmentDialog } from "@/components/courses";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Calendar Page
 *
 * Full calendar view with day/week/month modes.
 *
 * UX Philosophy (from ux-research.md):
 * - "Less is more" - show only relevant assignments
 * - Anxiety-reducing - supportive colors and messaging
 * - RTL-first - Hebrew native experience
 *
 * Default View:
 * - Desktop: Week view (most useful overview)
 * - Mobile: Could auto-detect (future enhancement)
 */

export default function CalendarPage() {
  const router = useRouter();
  const {
    view,
    currentDate,
    assignments,
    isLoading,
    error,
    setView,
    goToToday,
    goToPrev,
    goToNext,
    goToDate,
    getAssignmentsForDate,
    formatHeaderDate,
    getWeekDays,
    getMonthDays,
    refresh,
  } = useCalendar("week");

  // Edit dialog state
  const [editingAssignment, setEditingAssignment] = useState<CalendarAssignment | null>(null);

  // Handle edit
  const handleEdit = (assignment: CalendarAssignment) => {
    setEditingAssignment(assignment);
  };

  // Handle status change (quick complete from popover)
  const handleStatusChange = async (assignmentId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: completed ? "COMPLETED" : "NOT_STARTED",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Refresh calendar data
      await refresh();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Handle navigate to course
  const handleNavigateToCourse = (courseId: string) => {
    router.push(`/dashboard/courses/${courseId}`);
  };

  // Handle day click - navigate to day view
  const handleDayClick = (date: Date) => {
    goToDate(date);
    setView("day");
  };

  // Loading state
  if (isLoading && assignments.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="לוח שנה" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="לוח שנה" />
        <EmptyState
          illustration="error"
          title="שגיאה בטעינת הלוח שנה"
          description={error}
          actionLabel="נסה שוב"
          onAction={refresh}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <PageHeader
        title="לוח שנה"
        subtitle="צפה במשימות שלך לפי תאריכים"
      />

      {/* Calendar navigation and view toggle */}
      <CalendarHeader
        view={view}
        headerDate={formatHeaderDate()}
        onViewChange={setView}
        onPrev={goToPrev}
        onNext={goToNext}
        onToday={goToToday}
      />

      {/* Calendar content based on view */}
      {view === "day" && (
        <CalendarDayView
          date={currentDate}
          assignments={getAssignmentsForDate(currentDate)}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onNavigateToCourse={handleNavigateToCourse}
        />
      )}

      {view === "week" && (
        <CalendarWeekView
          weekDays={getWeekDays()}
          assignments={assignments}
          getAssignmentsForDate={getAssignmentsForDate}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onNavigateToCourse={handleNavigateToCourse}
          onDayClick={handleDayClick}
        />
      )}

      {view === "month" && (
        <CalendarMonthView
          monthDays={getMonthDays()}
          currentDate={currentDate}
          getAssignmentsForDate={getAssignmentsForDate}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onNavigateToCourse={handleNavigateToCourse}
          onDayClick={handleDayClick}
        />
      )}

      {/* Edit Assignment Dialog */}
      {editingAssignment && (
        <EditAssignmentDialog
          assignment={{
            id: editingAssignment.id,
            title: editingAssignment.title,
            description: editingAssignment.description,
            dueDate: editingAssignment.dueDate,
            status: editingAssignment.status,
            priority: editingAssignment.priority,
            weight: editingAssignment.weight,
          }}
          open={!!editingAssignment}
          onOpenChange={(open) => !open && setEditingAssignment(null)}
          onAssignmentUpdated={() => {
            setEditingAssignment(null);
            refresh();
          }}
        />
      )}

      {/* Loading overlay for navigation */}
      {isLoading && (
        <div className="fixed inset-0 bg-[var(--color-background)]/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] p-4 rounded-lg shadow-lg">
            <p className="text-sm text-[var(--color-text-secondary)]">טוען...</p>
          </div>
        </div>
      )}
    </div>
  );
}
