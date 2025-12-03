"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateCourseDialog } from "@/components/courses/create-course-dialog";
import { EditCourseDialog } from "@/components/courses/edit-course-dialog";
import { PageHeader } from "@/components/layout";
import { BookOpen, Trash2 } from "lucide-react";

interface Course {
  id: string;
  name: string;
  courseCode: string | null;
  credits: number | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/courses");

      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await response.json();
      console.log("Fetched courses:", data.courses);
      setCourses(data.courses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "אירעה שגיאה לא צפויה");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את הקורס?")) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete course");
      }

      // Refresh courses list
      fetchCourses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "שגיאה במחיקת הקורס");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Get color classes for badges
  const getColorClasses = (color: string | null) => {
    const colorMap: Record<string, string> = {
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

    return colorMap[color || "indigo"] || colorMap.indigo;
  };

  return (
    <>
      {/* Page Header */}
      <PageHeader
        title="הקורסים שלי"
        subtitle="נהל את כל הקורסים שלך במקום אחד"
        actions={
          !isLoading && courses.length > 0 ? (
            <CreateCourseDialog onCourseCreated={fetchCourses} />
          ) : undefined
        }
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-lg bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && courses.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-16 w-16 mx-auto text-[var(--color-text-muted)] mb-4" />
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              אין קורסים עדיין
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              בוא נוסיף את הקורס הראשון שלך!
            </p>
            <CreateCourseDialog onCourseCreated={fetchCourses} />
          </CardContent>
        </Card>
      )}

      {/* Courses Grid */}
      {!isLoading && !error && courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="mb-2">
                      <span className="text-lg font-semibold text-[var(--color-text-primary)]">
                        {course.name}
                      </span>
                      {(() => {
                        console.log("Course:", course.name, "Credits:", course.credits, "Type:", typeof course.credits);
                        return course.credits && course.credits > 0 ? (
                          <span className="text-sm font-normal text-[var(--color-text-secondary)] ms-2">
                            {" "}({course.credits} נ״ז)
                          </span>
                        ) : null;
                      })()}
                    </div>
                    {course.courseCode && (
                      <Badge className={getColorClasses(course.color)}>
                        {course.courseCode}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Actions */}
                <div className="flex gap-2">
                  <EditCourseDialog
                    course={course}
                    onCourseUpdated={fetchCourses}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                    onClick={() => handleDeleteCourse(course.id)}
                  >
                    <Trash2 className="h-4 w-4 ms-2" />
                    מחק
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
