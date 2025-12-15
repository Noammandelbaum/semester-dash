"use client";

import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getDeadlineUrgency,
  getDeadlineUrgencyClasses,
  type DeadlineUrgency,
} from "@/lib/dashboard-utils";
import { cleanCourseName } from "@/lib/utils";
import { Calendar, ChevronLeft } from "lucide-react";
import type { AssignmentWithCourse } from "@/app/api/dashboard/stats/route";

/**
 * UpcomingDeadlines (STUDDASH-28)
 * Priority-sorted deadline list for dashboard
 *
 * Features:
 * - Shows next 5 deadlines (default)
 * - Color by urgency (overdue → urgent → soon → normal)
 * - Course name badge with course color
 * - Empty state: "אין משימות קרובות"
 * - "הצג הכל" link to full assignments view
 *
 * UX: Soft amber for "soon", coral only for overdue
 */
interface UpcomingDeadlinesProps {
  assignments: AssignmentWithCourse[];
  maxItems?: number;
}

const courseColors: Record<string, string> = {
  red: "bg-red-100 text-red-700",
  orange: "bg-orange-100 text-orange-700",
  amber: "bg-amber-100 text-amber-700",
  green: "bg-green-100 text-green-700",
  teal: "bg-teal-100 text-teal-700",
  blue: "bg-blue-100 text-blue-700",
  indigo: "bg-indigo-100 text-indigo-700",
  purple: "bg-purple-100 text-purple-700",
  pink: "bg-pink-100 text-pink-700",
};

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 1) return "איחור יום אחד";
    return `איחור ${absDays} ימים`;
  }
  if (diffDays === 0) return "היום";
  if (diffDays === 1) return "מחר";
  if (diffDays <= 7) return `בעוד ${diffDays} ימים`;

  return date.toLocaleDateString("he-IL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getUrgencyIcon(urgency: DeadlineUrgency): string {
  switch (urgency) {
    case "overdue":
      return "⚠️";
    case "urgent":
      return "🔥";
    case "soon":
      return "⏰";
    default:
      return "📅";
  }
}

export function UpcomingDeadlines({
  assignments,
  maxItems = 5,
}: UpcomingDeadlinesProps) {
  const router = useRouter();
  const displayedAssignments = assignments.slice(0, maxItems);

  if (assignments.length === 0) {
    return (
      <Card hover={false}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" aria-hidden="true" />
            משימות קרובות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-[var(--color-text-secondary)]">
              אין משימות קרובות
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              כל המשימות לשבוע הקרוב הושלמו!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card hover={false}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" aria-hidden="true" />
            משימות קרובות
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/assignments")}
            className="text-[var(--color-primary)] min-h-[44px]"
          >
            הצג הכל
            <ChevronLeft className="w-4 h-4 ms-1" aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3" role="list" aria-label="רשימת משימות קרובות">
          {displayedAssignments.map((assignment) => {
            const urgency = getDeadlineUrgency(assignment.dueDate);
            const urgencyClasses = getDeadlineUrgencyClasses(urgency);
            const courseColorClass =
              courseColors[assignment.course.color] || courseColors.indigo;

            return (
              <li
                key={assignment.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-alt)] hover:bg-[var(--color-border)]/30 transition-colors cursor-pointer min-h-[44px]"
                onClick={() =>
                  router.push(`/dashboard/courses/${assignment.course.id}`)
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    router.push(`/dashboard/courses/${assignment.course.id}`);
                  }
                }}
              >
                {/* Urgency indicator */}
                <span
                  className="text-lg flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  {getUrgencyIcon(urgency)}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--color-text-primary)] truncate">
                    {assignment.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {/* Course badge */}
                    <Badge className={courseColorClass} variant="secondary">
                      {cleanCourseName(assignment.course.name)}
                    </Badge>
                    {/* Due date */}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${urgencyClasses}`}
                    >
                      {formatDueDate(assignment.dueDate)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
