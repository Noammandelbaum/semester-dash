"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Calendar,
  BookOpen,
  ChevronLeft,
  RefreshCw,
  Loader2,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { SyncSemesterDialog } from "@/components/semesters";
import {
  calculateSemesterProgress,
  getCurrentWeek,
  getTotalWeeks,
  SEMESTER_TEMPLATES,
} from "@/lib/semester-templates";
import { cn } from "@/lib/utils";

/**
 * Semester Detail Page
 *
 * Shows full semester overview:
 * - Semester info (name, dates, progress)
 * - List of synced courses
 * - Sections (teaching units) per course
 * - Sync settings button
 * - Re-sync button
 */

interface Course {
  id: string;
  name: string;
  color: string | null;
  moodleId?: string | null;
  _count: {
    assignments: number;
  };
}

interface Semester {
  id: string;
  name: string;
  type: "A" | "B" | "SUMMER";
  year: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  courses: Course[];
}

// Color display mapping
const colorMap: Record<string, string> = {
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

export default function SemesterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [semester, setSemester] = useState<Semester | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/semesters/${resolvedParams.id}?include=courses,sections`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("הסמסטר לא נמצא");
          } else {
            setError("שגיאה בטעינת הסמסטר");
          }
          return;
        }

        const data = await response.json();
        setSemester(data);
      } catch (err) {
        console.error("Error fetching semester:", err);
        setError("שגיאה בטעינת הסמסטר");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id]);

  const handleSyncComplete = () => {
    window.location.reload();
  };

  // Format date for display
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  if (error || !semester) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/semesters"
          className="inline-flex items-center gap-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          <ChevronLeft className="w-4 h-4" />
          חזרה לסמסטרים
        </Link>

        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title={error || "הסמסטר לא נמצא"}
          description="לא הצלחנו למצוא את הסמסטר המבוקש"
          action={
            <Link href="/dashboard/semesters">
              <Button variant="primary">חזור לסמסטרים</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const progress = calculateSemesterProgress(
    new Date(semester.startDate),
    new Date(semester.endDate)
  );
  const currentWeek = getCurrentWeek(new Date(semester.startDate));
  const totalWeeks = getTotalWeeks(
    new Date(semester.startDate),
    new Date(semester.endDate)
  );
  const template = SEMESTER_TEMPLATES[semester.type];
  const totalAssignments = semester.courses.reduce(
    (sum, course) => sum + course._count.assignments,
    0
  );

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/dashboard/semesters"
        className="inline-flex items-center gap-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
      >
        <ChevronLeft className="w-4 h-4" />
        חזרה לסמסטרים
      </Link>

      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center",
                  semester.isActive
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                )}
              >
                <Calendar className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                    {semester.name}
                  </h1>
                  {semester.isActive && (
                    <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-white text-xs font-medium">
                      פעיל
                    </span>
                  )}
                </div>
                <p className="text-[var(--color-text-muted)]">
                  {template.hebrewLabel} | {formatDate(semester.startDate)} -{" "}
                  {formatDate(semester.endDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSyncDialogOpen(true)}
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                סנכרן מחדש
              </Button>
              <SyncSemesterDialog
                open={syncDialogOpen}
                onOpenChange={setSyncDialogOpen}
                onSyncComplete={handleSyncComplete}
              />
            </div>
          </div>

          {/* Progress Section */}
          <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">התקדמות</p>
                <p className="text-2xl font-bold text-[var(--color-primary)]">
                  {progress}%
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">שבוע</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {currentWeek > 0 && currentWeek <= totalWeeks
                    ? `${currentWeek}/${totalWeeks}`
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">קורסים</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {semester.courses.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">מטלות</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {totalAssignments}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            קורסים מסונכרנים
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {semester.courses.length} קורסים
          </p>
        </div>

        {semester.courses.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-10 w-10" />}
            title="אין קורסים בסמסטר"
            description="סנכרן קורסים מ-Moodle כדי להתחיל"
            action={
              <Button
                variant="primary"
                onClick={() => setSyncDialogOpen(true)}
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                סנכרן מ-Moodle
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {semester.courses.map((course) => (
              <Card key={course.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        course.color ? colorMap[course.color] : "bg-teal-500"
                      )}
                    />
                    <CardTitle className="text-base">{course.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Course Stats */}
                  <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course._count.assignments} מטלות
                    </span>
                  </div>

                  {/* Moodle Link Indicator */}
                  {course.moodleId && (
                    <div className="flex items-center gap-1 text-xs text-[var(--color-success)]">
                      <CheckCircle className="w-3 h-3" />
                      מסונכרן מ-Moodle
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
