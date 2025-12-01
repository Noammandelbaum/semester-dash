"use client";

import { useState, useEffect } from "react";
import { Calendar, MoreVertical, Trash2, Edit, CheckCircle, Settings } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateSemesterDialog } from "@/components/semesters";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  calculateSemesterProgress,
  getCurrentWeek,
  getTotalWeeks,
  SEMESTER_TEMPLATES,
} from "@/lib/semester-templates";
import { cn } from "@/lib/utils";
import type { Semester } from "@prisma/client";

/**
 * Semesters Management Page
 *
 * Features:
 * - List all semesters
 * - Create new semester
 * - Activate/switch semesters
 * - Edit/delete semesters
 *
 * UX: Clear visual hierarchy, active semester highlighted
 */

interface SemesterWithCount extends Semester {
  _count?: {
    courses: number;
  };
}

export default function SemestersPage() {
  const [semesters, setSemesters] = useState<SemesterWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/semesters?limit=50");
      if (response.ok) {
        const data = await response.json();
        setSemesters(data.semesters);
      }
    } catch (error) {
      console.error("Error fetching semesters:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async (semesterId: string) => {
    try {
      setActionLoading(semesterId);
      const response = await fetch(`/api/semesters/${semesterId}/activate`, {
        method: "POST",
      });
      if (response.ok) {
        await fetchSemesters();
      }
    } catch (error) {
      console.error("Error activating semester:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (semesterId: string) => {
    const semester = semesters.find((s) => s.id === semesterId);
    const courseCount = semester?._count?.courses || 0;

    const message = courseCount > 0
      ? `האם אתה בטוח שברצונך למחוק את הסמסטר? פעולה זו תסיר גם ${courseCount} קורסים.`
      : "האם אתה בטוח שברצונך למחוק את הסמסטר?";

    if (!confirm(message)) return;

    try {
      setActionLoading(semesterId);
      const response = await fetch(`/api/semesters/${semesterId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchSemesters();
      }
    } catch (error) {
      console.error("Error deleting semester:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("he-IL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-[var(--color-border)] rounded animate-pulse" />
          <div className="h-10 w-32 bg-[var(--color-border)] rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-[var(--color-border)] rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            הסמסטרים שלי
          </h1>
          <p className="text-[var(--color-text-muted)]">
            נהל את הסמסטרים והחלף ביניהם
          </p>
        </div>
        <CreateSemesterDialog onSemesterCreated={fetchSemesters} />
      </div>

      {/* Semesters Grid */}
      {semesters.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="עדיין אין סמסטרים"
          description="צור את הסמסטר הראשון שלך כדי להתחיל לעקוב אחרי הקורסים והמשימות"
          action={
            <CreateSemesterDialog
              onSemesterCreated={fetchSemesters}
              trigger={
                <Button variant="primary" size="lg">
                  צור סמסטר ראשון
                </Button>
              }
            />
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {semesters.map((semester) => {
            const progress = calculateSemesterProgress(
              semester.startDate,
              semester.endDate
            );
            const currentWeek = getCurrentWeek(semester.startDate);
            const totalWeeks = getTotalWeeks(semester.startDate, semester.endDate);
            const template = SEMESTER_TEMPLATES[semester.type];
            const isActionLoading = actionLoading === semester.id;

            return (
              <Card
                key={semester.id}
                className={cn(
                  "relative transition-all",
                  semester.isActive && "ring-2 ring-[var(--color-primary)]"
                )}
              >
                {/* Active Badge */}
                {semester.isActive && (
                  <div className="absolute -top-2 start-4 px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-white text-xs font-medium">
                    פעיל
                  </div>
                )}

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          semester.isActive
                            ? "bg-[var(--color-primary)] text-white"
                            : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        )}
                      >
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{semester.name}</CardTitle>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {template.hebrewLabel}
                        </p>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className="p-1 rounded hover:bg-[var(--color-background)] text-[var(--color-text-muted)]"
                          disabled={isActionLoading}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-40 p-1">
                        {!semester.isActive && (
                          <button
                            onClick={() => handleActivate(semester.id)}
                            disabled={isActionLoading}
                            className="w-full flex items-center gap-2 p-2 rounded text-sm hover:bg-[var(--color-background)] text-[var(--color-text-secondary)]"
                          >
                            <CheckCircle className="h-4 w-4" />
                            הפוך לפעיל
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(semester.id)}
                          disabled={isActionLoading}
                          className="w-full flex items-center gap-2 p-2 rounded text-sm hover:bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
                        >
                          <Trash2 className="h-4 w-4" />
                          מחק
                        </button>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Date Range */}
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    {formatDate(semester.startDate)} - {formatDate(semester.endDate)}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-text-muted)]">התקדמות</span>
                      <span className="font-medium text-[var(--color-primary)]">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-[var(--color-text-muted)]">
                      {semester._count?.courses || 0} קורסים
                    </div>
                    {currentWeek > 0 && currentWeek <= totalWeeks && (
                      <div className="text-[var(--color-text-secondary)]">
                        שבוע {currentWeek}/{totalWeeks}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
