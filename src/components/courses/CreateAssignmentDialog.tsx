"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { CreateAssignmentSchema } from "@/schemas/assignment";
import type { AssignmentPriority } from "@prisma/client";

/**
 * CreateAssignmentDialog
 * Dialog for creating a new assignment
 *
 * Features:
 * - Title, description, due date
 * - Priority selection
 * - Optional weight (percentage of grade)
 * - Hebrew date picker
 *
 * UX: Minimal required fields, smart defaults
 */

interface CreateAssignmentDialogProps {
  courseId: string;
  onAssignmentCreated?: () => void;
}

interface FormData {
  title: string;
  description: string;
  dueDate: Date | undefined;
  priority: AssignmentPriority;
  weight: number | undefined;
}

const priorityOptions: { value: AssignmentPriority; label: string }[] = [
  { value: "LOW", label: "נמוכה" },
  { value: "MEDIUM", label: "בינונית" },
  { value: "HIGH", label: "גבוהה" },
];

export function CreateAssignmentDialog({
  courseId,
  onAssignmentCreated,
}: CreateAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    dueDate: undefined,
    priority: "MEDIUM",
    weight: undefined,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      dueDate: undefined,
      priority: "MEDIUM",
      weight: undefined,
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate due date
      if (!formData.dueDate) {
        throw new Error("יש לבחור תאריך הגשה");
      }

      // Prepare data for API
      const apiData = {
        title: formData.title,
        description: formData.description || undefined,
        courseId,
        dueDate: formData.dueDate.toISOString(),
        priority: formData.priority,
        weight: formData.weight || undefined,
      };

      // Client-side validation
      CreateAssignmentSchema.parse(apiData);

      // API call
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle validation errors from server
        if (errorData.details && Array.isArray(errorData.details)) {
          const hebrewErrors = errorData.details.map(
            (issue: { path?: string[]; message: string }) => {
              if (issue.path?.includes("title")) {
                return "שם המשימה הוא שדה חובה";
              }
              if (issue.path?.includes("dueDate")) {
                return "תאריך הגשה לא תקין";
              }
              if (issue.path?.includes("weight")) {
                return "משקל הציון חייב להיות בין 0 ל-100";
              }
              return issue.message;
            }
          );
          throw new Error(hebrewErrors.join(", "));
        }

        throw new Error(errorData.error || "שגיאה ביצירת המשימה");
      }

      // Success! Close dialog and reset form
      setOpen(false);
      resetForm();

      // Notify parent
      onAssignmentCreated?.();
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
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="primary" size="md" className="min-h-[44px]">
          <Plus className="h-4 w-4" />
          הוסף משימה
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>הוסף משימה חדשה</DialogTitle>
          <DialogDescription>
            הזן את פרטי המשימה כדי להוסיף אותה לקורס
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">שם המשימה *</Label>
            <Input
              id="title"
              type="text"
              placeholder='לדוגמה: "תרגיל 3 - עצים בינאריים"'
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              required
              disabled={isLoading}
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>תאריך הגשה *</Label>
            <DatePicker
              value={formData.dueDate}
              onChange={(date) =>
                setFormData((prev) => ({ ...prev, dueDate: date }))
              }
              placeholder="בחר תאריך הגשה"
              disabled={isLoading}
              fromDate={new Date()}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>עדיפות</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, priority: value as AssignmentPriority }))
              }
            >
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder="בחר עדיפות" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Weight (optional) */}
          <div className="space-y-2">
            <Label htmlFor="weight">משקל בציון (%)</Label>
            <Input
              id="weight"
              type="number"
              min="0"
              max="100"
              step="1"
              placeholder="אופציונלי (0-100)"
              value={formData.weight ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setFormData((prev) => ({ ...prev, weight: undefined }));
                } else {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue)) {
                    setFormData((prev) => ({ ...prev, weight: numValue }));
                  }
                }
              }}
              disabled={isLoading}
            />
          </div>

          {/* Description (optional) */}
          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              placeholder="אופציונלי - הוסף פרטים נוספים על המשימה"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              disabled={isLoading}
              rows={3}
            />
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
              הוסף משימה
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
