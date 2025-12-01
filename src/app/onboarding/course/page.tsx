"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowLeft, ArrowRight, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingCard } from "@/components/onboarding";
import { COURSE_COLORS } from "@/schemas/course";
import { cn } from "@/lib/utils";

/**
 * Course Step (Step 3)
 *
 * Add first course:
 * - Simple form with name and color
 * - Option to add more courses or finish
 * - Shows added courses
 *
 * UX: 60 seconds, minimal required fields, ability to add multiple
 */

// Color display mapping
const colorMap: Record<string, { bg: string; text: string; label: string }> = {
  red: { bg: "bg-red-500", text: "text-red-500", label: "אדום" },
  orange: { bg: "bg-orange-500", text: "text-orange-500", label: "כתום" },
  amber: { bg: "bg-amber-500", text: "text-amber-500", label: "צהוב" },
  green: { bg: "bg-green-500", text: "text-green-500", label: "ירוק" },
  teal: { bg: "bg-teal-500", text: "text-teal-500", label: "טורקיז" },
  blue: { bg: "bg-blue-500", text: "text-blue-500", label: "כחול" },
  indigo: { bg: "bg-indigo-500", text: "text-indigo-500", label: "אינדיגו" },
  purple: { bg: "bg-purple-500", text: "text-purple-500", label: "סגול" },
  pink: { bg: "bg-pink-500", text: "text-pink-500", label: "ורוד" },
};

interface AddedCourse {
  id: string;
  name: string;
  color: string;
}

export default function CoursePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedCourses, setAddedCourses] = useState<AddedCourse[]>([]);
  const [activeSemesterId, setActiveSemesterId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    color: "teal" as (typeof COURSE_COLORS)[number],
  });

  // Fetch the active semester ID on mount
  useEffect(() => {
    const fetchActiveSemester = async () => {
      try {
        const response = await fetch("/api/semesters");
        if (response.ok) {
          const data = await response.json();
          // Find active semester
          const active = data.semesters?.find(
            (s: { isActive: boolean }) => s.isActive
          );
          if (active) {
            setActiveSemesterId(active.id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch active semester:", err);
      }
    };

    fetchActiveSemester();
  }, []);

  const handleAddCourse = async () => {
    if (!formData.name.trim()) {
      setError("יש להזין שם קורס");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // API call to create course
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          color: formData.color,
          semesterId: activeSemesterId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "שגיאה בהוספת הקורס");
      }

      const newCourse = await response.json();

      // Add to list
      setAddedCourses((prev) => [
        ...prev,
        {
          id: newCourse.id,
          name: newCourse.name,
          color: newCourse.color,
        },
      ]);

      // Reset form for another course
      setFormData({
        name: "",
        color: getNextColor(),
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("אירעה שגיאה לא צפויה");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get next color that hasn't been used
  const getNextColor = (): (typeof COURSE_COLORS)[number] => {
    const usedColors = addedCourses.map((c) => c.color);
    const availableColors = COURSE_COLORS.filter(
      (c) => !usedColors.includes(c)
    );
    return availableColors.length > 0 ? availableColors[0] : COURSE_COLORS[0];
  };

  const handleFinish = () => {
    router.push("/onboarding/complete");
  };

  const handleBack = () => {
    router.push("/onboarding/semester");
  };

  const canFinish = addedCourses.length > 0;

  return (
    <OnboardingCard currentStep={3}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-6 h-6 text-[var(--color-primary)]" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          הוסף את הקורסים שלך
        </h1>
        <p className="text-[var(--color-text-muted)]">
          הוסף לפחות קורס אחד כדי להתחיל
        </p>
      </div>

      {/* Added Courses List */}
      {addedCourses.length > 0 && (
        <div className="mb-6">
          <Label className="mb-2 block">קורסים שנוספו</Label>
          <div className="space-y-2">
            {addedCourses.map((course) => (
              <div
                key={course.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
              >
                <div
                  className={cn("w-3 h-3 rounded-full", colorMap[course.color]?.bg)}
                />
                <span className="flex-1 text-[var(--color-text-primary)]">
                  {course.name}
                </span>
                <Check className="w-4 h-4 text-[var(--color-success)]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Course Form */}
      <div className="space-y-4">
        {/* Course Name */}
        <div className="space-y-2">
          <Label htmlFor="courseName">שם הקורס</Label>
          <Input
            id="courseName"
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="לדוגמה: מבוא למדעי המחשב"
            disabled={isLoading}
          />
        </div>

        {/* Color Picker */}
        <div className="space-y-2">
          <Label>צבע</Label>
          <div className="flex flex-wrap gap-2">
            {COURSE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, color }))}
                className={cn(
                  "w-8 h-8 rounded-full transition-all",
                  colorMap[color]?.bg,
                  formData.color === color
                    ? "ring-2 ring-offset-2 ring-[var(--color-primary)]"
                    : "hover:scale-110"
                )}
                title={colorMap[color]?.label}
                disabled={isLoading}
              />
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
            {error}
          </div>
        )}

        {/* Add Course Button */}
        <Button
          variant="secondary"
          onClick={handleAddCourse}
          isLoading={isLoading}
          className="w-full"
        >
          <Plus className="w-4 h-4 ml-2" />
          הוסף קורס
        </Button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={isLoading}
          className="flex-1"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          חזרה
        </Button>
        <Button
          variant="primary"
          onClick={handleFinish}
          disabled={!canFinish || isLoading}
          className="flex-1"
        >
          סיים
          <ArrowLeft className="w-4 h-4 mr-2" />
        </Button>
      </div>

      {/* Help text */}
      {!canFinish && (
        <p className="text-center text-sm text-[var(--color-text-muted)] mt-4">
          הוסף לפחות קורס אחד כדי להמשיך
        </p>
      )}
    </OnboardingCard>
  );
}
