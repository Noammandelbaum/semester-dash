"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COURSE_COLORS, CreateCourseSchema } from "@/schemas/course";
import type { CreateCourseInput } from "@/schemas/course";
import { cn } from "@/lib/utils";

interface Semester {
  id: string;
  name: string;
  isActive: boolean;
}

interface CreateCourseDialogProps {
  onCourseCreated?: () => void;
}

export function CreateCourseDialog({ onCourseCreated }: CreateCourseDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const [formData, setFormData] = useState<CreateCourseInput>({
    name: "",
    courseCode: "",
    credits: undefined,
    color: "indigo",
    semesterId: undefined,
  });

  // Fetch semesters when dialog opens
  useEffect(() => {
    if (open) {
      fetchSemesters();
    }
  }, [open]);

  const fetchSemesters = async () => {
    try {
      const response = await fetch("/api/semesters");
      if (response.ok) {
        const data = await response.json();
        setSemesters(data.semesters || []);

        // Set default to active semester if exists
        const activeSemester = data.semesters?.find((s: Semester) => s.isActive);
        if (activeSemester) {
          setFormData((prev) => ({ ...prev, semesterId: activeSemester.id }));
        }
      }
    } catch (err) {
      console.error("Error fetching semesters:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Client-side validation
      const validated = CreateCourseSchema.parse(formData);

      // API call
      const response = await fetch("/api/courses", {
        method: "POST",
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

        throw new Error(errorData.error || "שגיאה ביצירת הקורס");
      }

      // Success! Close dialog and reset form
      setOpen(false);
      setFormData({
        name: "",
        courseCode: "",
        credits: undefined,
        color: "indigo",
        semesterId: undefined,
      });

      // Notify parent
      onCourseCreated?.();
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
        <Button variant="primary" size="md">
          <Plus className="h-4 w-4" />
          הוסף קורס
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>הוסף קורס חדש</DialogTitle>
          <DialogDescription>
            הזן את פרטי הקורס כדי להוסיף אותו לסמסטר שלך
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Course Name */}
          <div className="space-y-2">
            <Label htmlFor="name">שם הקורס *</Label>
            <Input
              id="name"
              type="text"
              placeholder='לדוגמה: "מבוא למדעי המחשב"'
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
              disabled={isLoading}
            />
          </div>

          {/* Credits */}
          <div className="space-y-2">
            <Label htmlFor="credits">נקודות זכות (נ״ז)</Label>
            <Input
              id="credits"
              type="number"
              min="0"
              max="20"
              step="0.5"
              placeholder="אופציונלי (0.5 - 20)"
              value={formData.credits ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                console.log("Credits onChange:", value, typeof value);

                if (value === "" || value === null) {
                  setFormData((prev) => ({ ...prev, credits: undefined }));
                  return;
                }

                const numValue = parseFloat(value);
                console.log("Parsed numValue:", numValue, typeof numValue);

                // Allow typing any number (including 0 for intermediate state)
                if (!isNaN(numValue)) {
                  setFormData((prev) => ({ ...prev, credits: numValue }));
                }
              }}
              onBlur={(e) => {
                const value = e.target.value;
                console.log("Credits onBlur:", value, typeof value);

                // On blur, validate: if empty or 0, set to undefined
                if (value === "" || value === "0" || parseFloat(value) === 0) {
                  setFormData((prev) => ({ ...prev, credits: undefined }));
                }
              }}
              disabled={isLoading}
            />
          </div>

          {/* Semester Selection */}
          <div className="space-y-2">
            <Label htmlFor="semester">סמסטר (אופציונלי)</Label>
            <Select
              value={formData.semesterId || "none"}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  semesterId: value === "none" ? undefined : value,
                }))
              }
              disabled={isLoading}
            >
              <SelectTrigger id="semester" className="w-full">
                <SelectValue placeholder="בחר סמסטר" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ללא סמסטר</SelectItem>
                {semesters.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id}>
                    {semester.name}
                    {semester.isActive && " (פעיל)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              הוסף קורס
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
