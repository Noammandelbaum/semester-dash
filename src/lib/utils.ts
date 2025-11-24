import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with clsx
 * Usage: cn("px-4 py-2", condition && "bg-primary", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date for display (Hebrew locale)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format relative date (e.g., "בעוד 3 ימים", "לפני שעה")
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "היום";
  if (diffDays === 1) return "מחר";
  if (diffDays === -1) return "אתמול";
  if (diffDays > 0 && diffDays <= 7) return `בעוד ${diffDays} ימים`;
  if (diffDays < 0 && diffDays >= -7) return `לפני ${Math.abs(diffDays)} ימים`;

  return formatDate(d);
}

/**
 * Get deadline status for styling
 */
export function getDeadlineStatus(
  dueDate: Date | string
): "safe" | "warning" | "danger" | "overdue" {
  const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "danger";
  if (diffDays <= 7) return "warning";
  return "safe";
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Get progress color based on percentage
 */
export function getProgressColor(percentage: number): string {
  if (percentage >= 70) return "var(--color-success)";
  if (percentage >= 40) return "var(--color-warning)";
  return "var(--color-danger)";
}
