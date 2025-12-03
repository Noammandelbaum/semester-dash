"use client";

import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COURSE_COLORS, UpdateCourseSchema } from "@/schemas/course";
import type { UpdateCourseInput } from "@/schemas/course";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  name: string;
  courseCode: string | null;
  credits: number | null;
  color: string | null;
}

interface EditCourseDialogProps {
  course: Course;
  onCourseUpdated?: () => void;
  trigger?: React.ReactNode;
}

export function EditCourseDialog({
  course,
  onCourseUpdated,
  trigger,
}: EditCourseDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateCourseInput>({
    name: course.name,
    courseCode: course.courseCode || "",
    credits: course.credits ?? undefined,
    color: (course.color || "indigo") as "red" | "orange" | "amber" | "green" | "teal" | "blue" | "indigo" | "purple" | "pink" | undefined,
  });

  // Reset form when dialog opens with new course data
  useEffect(() => {
    if (open) {
      setFormData({
        name: course.name,
        courseCode: course.courseCode || "",
        credits: course.credits ?? undefined,
        color: (course.color || "indigo") as "red" | "orange" | "amber" | "green" | "teal" | "blue" | "indigo" | "purple" | "pink" | undefined,
      });
      setError(null);
    }
  }, [open, course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Client-side validation
      const validated = UpdateCourseSchema.parse(formData);

      // API call
      const response = await fetch(`/api/courses/${course.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validated),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle validation errors from server
        if (errorData.details && Array.isArray(errorData.details)) {
          const hebrewErrors = errorData.details.map((issue: { path?: string[]; message: string }) => {
            if (issue.path && issue.path.includes("credits")) {
              if (issue.message.includes("multipleOf")) {
                return "נקודות הזכות חייבות להיות במכפלות של 0.5 (לדוגמה: 2.5, 3.0)";
              }
              if (issue.message.includes("Expected number")) {
                return "נקודות הזכות חייבות להיות מספר";
              }
            }
            if (issue.path && issue.path.includes("name")) {
              return "שם הקורס הוא שדה חובה";
            }
            if (issue.path && issue.path.includes("courseCode")) {
              return "קוד הקורס חייב להכיל רק אותיות גדולות באנגלית, מספרים ומקפים";
            }
            return issue.message;
          });
          throw new Error(hebrewErrors.join(", "));
        }

        throw new Error(errorData.error || "שגיאה בעדכון הקורס");
      }

      // Success! Close dialog
      setOpen(false);

      // Notify parent
      onCourseUpdated?.();
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4 ms-2" />
            ערוך
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>ערוך קורס</DialogTitle>
          <DialogDescription>
            עדכן את פרטי הקורס
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Course Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">שם הקורס *</Label>
            <Input
              id="edit-name"
              type="text"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
              disabled={isLoading}
            />
          </div>

          {/* Credits */}
          <div className="space-y-2">
            <Label htmlFor="edit-credits">נקודות זכות (נ״ז)</Label>
            <Input
              id="edit-credits"
              type="number"
              min="0"
              max="20"
              step="0.5"
              placeholder="אופציונלי (0.5 - 20)"
              value={formData.credits ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || value === null) {
                  setFormData((prev) => ({ ...prev, credits: undefined }));
                } else {
                  const numValue = parseFloat(value);
                  // Allow typing intermediate values (like "0" when typing "0.5")
                  if (!isNaN(numValue)) {
                    setFormData((prev) => ({ ...prev, credits: numValue }));
                  }
                }
              }}
              onBlur={(e) => {
                // On blur, validate: if 0, set to undefined
                const value = parseFloat(e.target.value);
                if (value === 0 || isNaN(value)) {
                  setFormData((prev) => ({ ...prev, credits: undefined }));
                }
              }}
              disabled={isLoading}
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>צבע</Label>
            <div className="grid grid-cols-9 gap-2">
              {COURSE_COLORS.map((color) => {
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

                const isSelected = formData.color === color;

                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                    className={cn(
                      "w-10 h-10 rounded-lg transition-all",
                      colorClasses[color],
                      isSelected
                        ? "ring-2 ring-offset-2 ring-[var(--color-primary)] scale-110"
                        : "hover:scale-105 opacity-80 hover:opacity-100"
                    )}
                    title={color}
                    disabled={isLoading}
                  />
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
              {error}
            </div>
          )}

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              ביטול
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              שמור שינויים
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
