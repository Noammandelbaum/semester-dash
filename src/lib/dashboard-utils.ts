/**
 * Dashboard Utilities
 * Helper functions for dashboard calculations and display
 */

/**
 * Get time-based greeting in Hebrew
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "בוקר טוב";
  if (hour < 17) return "צהריים טובים";
  if (hour < 21) return "ערב טוב";
  return "לילה טוב";
}

/**
 * Get supportive status message based on course health
 * Following UX research: no guilt messaging, supportive tone
 */
export function getStatusMessage(
  greenCount: number,
  totalCourses: number
): string {
  if (totalCourses === 0) return "בוא נתחיל!";

  const greenPercent = (greenCount / totalCourses) * 100;

  if (greenPercent >= 80) return "מצוין! אתה על המסלול";
  if (greenPercent >= 50) return "ממשיך יפה!";
  return "יש קצת עבודה, אבל אתה יכול!";
}

/**
 * Calculate semester progress
 * Returns current week number, total weeks, and percentage complete
 */
export function calculateSemesterProgress(
  startDate: Date | string,
  endDate: Date | string
): {
  currentWeek: number;
  totalWeeks: number;
  progressPercent: number;
  isBeforeStart: boolean;
  isAfterEnd: boolean;
} {
  const start =
    typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  const now = new Date();

  // Calculate total duration
  const totalMs = end.getTime() - start.getTime();
  const totalWeeks = Math.max(1, Math.ceil(totalMs / (7 * 24 * 60 * 60 * 1000)));

  // Calculate elapsed time
  const elapsedMs = now.getTime() - start.getTime();

  // Check boundaries
  const isBeforeStart = now < start;
  const isAfterEnd = now > end;

  // Calculate current week (1-indexed)
  let currentWeek: number;
  if (isBeforeStart) {
    currentWeek = 0;
  } else if (isAfterEnd) {
    currentWeek = totalWeeks;
  } else {
    currentWeek = Math.max(
      1,
      Math.min(totalWeeks, Math.ceil(elapsedMs / (7 * 24 * 60 * 60 * 1000)))
    );
  }

  // Calculate progress percentage
  let progressPercent: number;
  if (isBeforeStart) {
    progressPercent = 0;
  } else if (isAfterEnd) {
    progressPercent = 100;
  } else {
    progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));
  }

  return {
    currentWeek,
    totalWeeks,
    progressPercent,
    isBeforeStart,
    isAfterEnd,
  };
}

/**
 * Traffic light status type
 */
export type CourseStatus = "green" | "yellow" | "red";

/**
 * Determine course status (traffic light) based on assignment completion
 * Green: >= 70% done
 * Yellow: 40-70% done
 * Red: < 40% done
 */
export function getCourseStatus(
  completedAssignments: number,
  totalAssignments: number
): CourseStatus {
  if (totalAssignments === 0) return "green"; // No assignments = all good

  const percent = (completedAssignments / totalAssignments) * 100;

  if (percent >= 70) return "green";
  if (percent >= 40) return "yellow";
  return "red";
}

/**
 * Get Hebrew status label for course status
 */
export function getCourseStatusLabel(status: CourseStatus): string {
  switch (status) {
    case "green":
      return "בזמן";
    case "yellow":
      return "דורש תשומת לב";
    case "red":
      return "דרוש עדכון";
  }
}

/**
 * Get CSS color variable for course status
 */
export function getCourseStatusColor(status: CourseStatus): string {
  switch (status) {
    case "green":
      return "var(--color-success)";
    case "yellow":
      return "var(--color-warning)";
    case "red":
      return "var(--color-danger)";
  }
}

/**
 * Deadline urgency type
 */
export type DeadlineUrgency = "overdue" | "urgent" | "soon" | "normal";

/**
 * Get deadline urgency level for styling
 * Following UX research: soft amber for soon, coral only for overdue
 */
export function getDeadlineUrgency(dueDate: Date | string): DeadlineUrgency {
  const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays <= 1) return "urgent";
  if (diffDays <= 3) return "soon";
  return "normal";
}

/**
 * Get CSS classes for deadline urgency
 */
export function getDeadlineUrgencyClasses(urgency: DeadlineUrgency): string {
  switch (urgency) {
    case "overdue":
      return "text-[var(--color-danger)] bg-[var(--color-danger)]/10";
    case "urgent":
      return "text-[var(--color-secondary)] bg-[var(--color-secondary)]/10";
    case "soon":
      return "text-[var(--color-warning)] bg-[var(--color-warning)]/10";
    case "normal":
      return "text-[var(--color-text-secondary)] bg-[var(--color-surface)]";
  }
}

/**
 * Format week indicator text
 */
export function formatWeekIndicator(
  currentWeek: number,
  totalWeeks: number
): string {
  return `שבוע ${currentWeek} מתוך ${totalWeeks}`;
}
