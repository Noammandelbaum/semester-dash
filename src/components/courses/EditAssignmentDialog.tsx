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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { UpdateAssignmentSchema } from "@/schemas/assignment";
import type { AssignmentPriority, AssignmentStatus } from "@prisma/client";

/**
 * EditAssignmentDialog
 * Dialog for editing an existing assignment
 *
 * Features:
 * - Pre-filled form with current values
 * - All fields editable
 * - Status change option
 * - Hebrew date picker
 *
 * UX: Quick edits without leaving the page
 */

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  weight: number | null;
}

interface EditAssignmentDialogProps {
  assignment: Assignment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignmentUpdated?: () => void;
}

interface FormData {
  title: string;
  description: string;
  dueDate: Date | undefined;
  priority: AssignmentPriority;
  status: AssignmentStatus;
  weight: number | undefined;
}

const priorityOptions: { value: AssignmentPriority; label: string }[] = [
  { value: "LOW", label: "נמוכה" },
  { value: "MEDIUM", label: "בינונית" },
  { value: "HIGH", label: "גבוהה" },
];

const statusOptions: { value: AssignmentStatus; label: string }[] = [
  { value: "NOT_STARTED", label: "לא התחיל" },
  { value: "IN_PROGRESS", label: "בתהליך" },
  { value: "COMPLETED", label: "הושלם" },
];

export function EditAssignmentDialog({
  assignment,
  open,
  onOpenChange,
  onAssignmentUpdated,
}: EditAssignmentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: assignment.title,
    description: assignment.description || "",
    dueDate: new Date(assignment.dueDate),
    priority: assignment.priority,
    status: assignment.status,
    weight: assignment.weight || undefined,
  });

  // Reset form when assignment changes
  useEffect(() => {
    setFormData({
      title: assignment.title,
      description: assignment.description || "",
      dueDate: new Date(assignment.dueDate),
      priority: assignment.priority,
      status: assignment.status,
      weight: assignment.weight || undefined,
    });
    setError(null);
  }, [assignment]);

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
        dueDate: formData.dueDate.toISOString(),
        priority: formData.priority,
        status: formData.status,
        weight: formData.weight || undefined,
      };

      // Client-side validation
      UpdateAssignmentSchema.parse(apiData);

      // API call
      const response = await fetch(`/api/assignments/${assignment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();

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

        throw new Error(errorData.error || "שגיאה בעדכון המשימה");
      }

      // Success!
      onOpenChange(false);
      onAssignmentUpdated?.();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>עריכת משימה</DialogTitle>
          <DialogDescription>
            עדכן את פרטי המשימה
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">שם המשימה *</Label>
            <Input
              id="edit-title"
              type="text"
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
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>סטטוס</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value as AssignmentStatus }))
              }
            >
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder="בחר סטטוס" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label htmlFor="edit-weight">משקל בציון (%)</Label>
            <Input
              id="edit-weight"
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
            <Label htmlFor="edit-description">תיאור</Label>
            <Textarea
              id="edit-description"
              placeholder="אופציונלי"
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
              onClick={() => onOpenChange(false)}
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
