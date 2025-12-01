"use client";

import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * CourseHeader
 * Displays course name with color accent and action buttons
 *
 * Features:
 * - Back navigation (RTL: arrow points right)
 * - Color stripe matching course color
 * - Edit/Delete actions
 * - RTL-first design with CSS logical properties
 *
 * UX: 44px touch targets, clear hierarchy
 */

interface CourseHeaderProps {
  course: {
    id: string;
    name: string;
    color: string | null;
    courseCode?: string | null;
    credits?: number | null;
  };
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const colorClasses: Record<string, string> = {
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

export function CourseHeader({
  course,
  onBack,
  onEdit,
  onDelete,
}: CourseHeaderProps) {
  const colorClass = colorClasses[course.color || "indigo"] || "bg-indigo-500";

  return (
    <div className="space-y-4">
      {/* Top row: Back button and actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="min-h-[44px] gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          חזור
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="min-h-[44px] gap-2"
            aria-label="ערוך קורס"
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">עריכה</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="min-h-[44px] gap-2 text-[var(--color-danger)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
            aria-label="מחק קורס"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">מחיקה</span>
          </Button>
        </div>
      </div>

      {/* Course title with color stripe */}
      <div className="flex items-center gap-4">
        <div
          className={cn("w-2 h-14 rounded-full shrink-0", colorClass)}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] truncate">
            {course.name}
          </h1>
          {(course.courseCode || course.credits) && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
              {[
                course.courseCode,
                course.credits && `${course.credits} נ״ז`,
              ]
                .filter(Boolean)
                .join(" • ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
