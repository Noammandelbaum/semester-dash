"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  isSameDay,
  isToday,
  format,
} from "date-fns";
import { he } from "date-fns/locale";
import type { AssignmentStatus, AssignmentPriority } from "@prisma/client";

/**
 * Calendar View Types
 */
export type CalendarView = "day" | "week" | "month";

/**
 * Assignment with course info for calendar display
 */
export interface CalendarAssignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  weight: number | null;
  courseId: string;
  course: {
    id: string;
    name: string;
    color: string | null;
    courseCode: string | null;
  };
}

/**
 * Date range for fetching assignments
 */
interface DateRange {
  start: Date;
  end: Date;
}

/**
 * useCalendar Hook Return Type
 */
interface UseCalendarReturn {
  // Current state
  view: CalendarView;
  currentDate: Date;
  dateRange: DateRange;

  // Data
  assignments: CalendarAssignment[];
  isLoading: boolean;
  error: string | null;

  // Navigation
  setView: (view: CalendarView) => void;
  goToToday: () => void;
  goToPrev: () => void;
  goToNext: () => void;
  goToDate: (date: Date) => void;

  // Helpers
  getAssignmentsForDate: (date: Date) => CalendarAssignment[];
  refresh: () => Promise<void>;

  // Formatting helpers
  formatHeaderDate: () => string;
  getWeekDays: () => Date[];
  getMonthDays: () => (Date | null)[][];
}

/**
 * Hebrew day names (short) - Sunday first (Israeli week)
 */
export const HEBREW_DAY_NAMES_SHORT = [
  "א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"
];

/**
 * Hebrew day names (full)
 */
export const HEBREW_DAY_NAMES_FULL = [
  "ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"
];

/**
 * Get date range based on view and current date
 */
function getDateRangeForView(view: CalendarView, date: Date): DateRange {
  switch (view) {
    case "day":
      return {
        start: startOfDay(date),
        end: endOfDay(date),
      };
    case "week":
      // Israeli week starts on Sunday
      return {
        start: startOfWeek(date, { weekStartsOn: 0 }),
        end: endOfWeek(date, { weekStartsOn: 0 }),
      };
    case "month":
      // Include days from prev/next month that appear in the grid
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      return {
        start: startOfWeek(monthStart, { weekStartsOn: 0 }),
        end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
      };
    default:
      return {
        start: startOfDay(date),
        end: endOfDay(date),
      };
  }
}

/**
 * useCalendar Hook
 *
 * Manages calendar state including view mode, navigation, and assignment fetching.
 *
 * UX Philosophy (from ux-research.md):
 * - Default view by context: week on desktop, today on mobile
 * - RTL week layout: Sunday on right
 * - Current day highlight with primary color
 * - Supportive, not overwhelming
 */
export function useCalendar(initialView: CalendarView = "week"): UseCalendarReturn {
  // State
  const [view, setView] = useState<CalendarView>(initialView);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [assignments, setAssignments] = useState<CalendarAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate date range based on view
  const dateRange = useMemo(
    () => getDateRangeForView(view, currentDate),
    [view, currentDate]
  );

  // Fetch assignments for current date range
  const fetchAssignments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
      });

      const response = await fetch(`/api/assignments?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("נדרשת התחברות מחדש");
        }
        if (response.status === 429) {
          throw new Error("יותר מדי בקשות. נסה שוב בעוד דקה");
        }
        throw new Error("שגיאה בטעינת המשימות");
      }

      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "שגיאה לא צפויה";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  // Fetch on mount and when date range changes
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Navigation handlers
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const goToPrev = useCallback(() => {
    switch (view) {
      case "day":
        setCurrentDate((prev) => subDays(prev, 1));
        break;
      case "week":
        setCurrentDate((prev) => subWeeks(prev, 1));
        break;
      case "month":
        setCurrentDate((prev) => subMonths(prev, 1));
        break;
    }
  }, [view]);

  const goToNext = useCallback(() => {
    switch (view) {
      case "day":
        setCurrentDate((prev) => addDays(prev, 1));
        break;
      case "week":
        setCurrentDate((prev) => addWeeks(prev, 1));
        break;
      case "month":
        setCurrentDate((prev) => addMonths(prev, 1));
        break;
    }
  }, [view]);

  const goToDate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  // Get assignments for a specific date
  const getAssignmentsForDate = useCallback(
    (date: Date): CalendarAssignment[] => {
      return assignments.filter((assignment) => {
        const dueDate = new Date(assignment.dueDate);
        return isSameDay(dueDate, date);
      });
    },
    [assignments]
  );

  // Format header date based on current view (Hebrew)
  const formatHeaderDate = useCallback((): string => {
    switch (view) {
      case "day":
        return format(currentDate, "EEEE, d בMMMM yyyy", { locale: he });
      case "week": {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
        const startMonth = format(weekStart, "MMMM", { locale: he });
        const endMonth = format(weekEnd, "MMMM", { locale: he });
        const year = format(currentDate, "yyyy");

        if (startMonth === endMonth) {
          return `${format(weekStart, "d", { locale: he })}-${format(weekEnd, "d", { locale: he })} ב${startMonth} ${year}`;
        }
        return `${format(weekStart, "d בMMMM", { locale: he })} - ${format(weekEnd, "d בMMMM", { locale: he })} ${year}`;
      }
      case "month":
        return format(currentDate, "MMMM yyyy", { locale: he });
      default:
        return format(currentDate, "d בMMMM yyyy", { locale: he });
    }
  }, [view, currentDate]);

  // Get week days (Sunday to Saturday)
  const getWeekDays = useCallback((): Date[] => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [currentDate]);

  // Get month days grid (6 rows x 7 columns)
  const getMonthDays = useCallback((): (Date | null)[][] => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const weeks: (Date | null)[][] = [];
    let currentWeekStart = gridStart;

    while (currentWeekStart <= gridEnd) {
      const week: (Date | null)[] = [];
      for (let i = 0; i < 7; i++) {
        const day = addDays(currentWeekStart, i);
        // Include all days in the grid (including outside current month)
        week.push(day);
      }
      weeks.push(week);
      currentWeekStart = addDays(currentWeekStart, 7);
    }

    return weeks;
  }, [currentDate]);

  return {
    // State
    view,
    currentDate,
    dateRange,

    // Data
    assignments,
    isLoading,
    error,

    // Navigation
    setView,
    goToToday,
    goToPrev,
    goToNext,
    goToDate,

    // Helpers
    getAssignmentsForDate,
    refresh: fetchAssignments,

    // Formatting
    formatHeaderDate,
    getWeekDays,
    getMonthDays,
  };
}

/**
 * Helper: Check if a date is today
 */
export { isToday };

/**
 * Helper: Check if date is in current month
 */
export function isCurrentMonth(date: Date, currentDate: Date): boolean {
  return (
    date.getMonth() === currentDate.getMonth() &&
    date.getFullYear() === currentDate.getFullYear()
  );
}

/**
 * Helper: Get deadline status color class
 * Based on color-branding-research.md - anxiety-reducing colors
 */
export function getDeadlineColorClass(dueDate: Date, status: AssignmentStatus): string {
  if (status === "COMPLETED") {
    return "text-[var(--color-success)]"; // Green - success
  }

  const now = new Date();
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "text-[var(--color-danger)]"; // Coral - overdue (use sparingly)
  }
  if (diffDays === 0) {
    return "text-[var(--color-secondary)]"; // Orange - today (supportive)
  }
  if (diffDays <= 3) {
    return "text-[var(--color-warning)]"; // Amber - soon
  }
  if (diffDays <= 7) {
    return "text-[var(--color-primary)]"; // Teal - coming up
  }
  return "text-[var(--color-text-secondary)]"; // Gray - neutral
}

/**
 * Helper: Get deadline status label in Hebrew
 * UX: Supportive messaging, not guilt-inducing
 */
export function getDeadlineLabel(dueDate: Date, status: AssignmentStatus): string {
  if (status === "COMPLETED") {
    return "הושלם";
  }

  const now = new Date();
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return overdueDays === 1 ? "אתמול" : `לפני ${overdueDays} ימים`;
  }
  if (diffDays === 0) {
    return "היום";
  }
  if (diffDays === 1) {
    return "מחר";
  }
  if (diffDays <= 7) {
    return `בעוד ${diffDays} ימים`;
  }
  return format(dueDate, "d בMMMM", { locale: he });
}
