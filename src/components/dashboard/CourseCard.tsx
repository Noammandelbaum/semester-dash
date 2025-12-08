"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  getCourseStatusLabel,
  getDeadlineUrgency,
  type CourseStatus,
} from "@/lib/dashboard-utils";

/**
 * CourseCard (STUDDASH-27)
 * Course status card for dashboard grid
 *
 * Features:
 * - Course name + color stripe
 * - Mini progress bar (RTL)
 * - Traffic light dot (green/yellow/red)
 * - Next deadline if <7 days
 * - Click navigates to /dashboard/courses/[id]
 *
 * UX: Maximum 6 visible on dashboard without scroll
 */
interface CourseCardProps {
  id: string;
  name: string;
  courseCode: string | null;
  color: string;
  assignmentStats: {
    total: number;
    completed: number;
    percent: number;
  };
  status: CourseStatus;
  nextDeadline: string | null;
}

const statusColors: Record<CourseStatus, string> = {
  green: "bg-[var(--color-success)]",
  yellow: "bg-[var(--color-warning)]",
  red: "bg-[var(--color-danger)]",
};

const courseColors: Record<string, string> = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  green: "bg-green-500",
  teal: "bg-teal-500",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
};

function formatDeadline(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "היום";
  if (diffDays === 1) return "מחר";
  if (diffDays <= 7) return `בעוד ${diffDays} ימים`;
  return date.toLocaleDateString("he-IL", { day: "numeric", month: "short" });
}

export function CourseCard({
  id,
  name,
  courseCode,
  color,
  assignmentStats,
  status,
  nextDeadline,
}: CourseCardProps) {
  const router = useRouter();
  const colorClass = courseColors[color] || courseColors.indigo;
  const statusLabel = getCourseStatusLabel(status);

  const handleClick = () => {
    router.push(`/dashboard/courses/${id}`);
  };

  const deadlineUrgency = nextDeadline ? getDeadlineUrgency(nextDeadline) : null;
  const showDeadline = nextDeadline && deadlineUrgency !== "normal";

  return (
    <Card
      onClick={handleClick}
      className="relative cursor-pointer overflow-hidden min-h-[44px]"
      role="article"
      aria-label={`קורס ${name}, ${statusLabel}`}
    >
      {/* Color stripe on the right (RTL) */}
      <div
        className={`absolute top-0 bottom-0 end-0 w-1.5 ${colorClass}`}
        aria-hidden="true"
      />

      <div className="pe-4">
        {/* Header: name + status dot */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--color-text-primary)] truncate">
              {name}
            </h3>
          </div>

          {/* Traffic light status indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${statusColors[status]}`}
              role="img"
              aria-label={statusLabel}
            />
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <Progress
            value={assignmentStats.completed}
            max={assignmentStats.total || 1}
            size="sm"
            showLabel={false}
            colorByProgress={true}
            label={`${assignmentStats.completed} מתוך ${assignmentStats.total} משימות הושלמו`}
          />
          <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mt-1">
            <span>
              {assignmentStats.completed}/{assignmentStats.total} משימות
            </span>
            <span>{assignmentStats.percent}%</span>
          </div>
        </div>

        {/* Next deadline badge (if urgent) */}
        {showDeadline && (
          <Badge
            variant="secondary"
            className={
              deadlineUrgency === "urgent" || deadlineUrgency === "overdue"
                ? "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
                : "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
            }
          >
            הגשה: {formatDeadline(nextDeadline)}
          </Badge>
        )}
      </div>
    </Card>
  );
}
