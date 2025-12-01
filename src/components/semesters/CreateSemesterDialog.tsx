"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar } from "lucide-react";
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
import { DatePicker } from "@/components/ui/date-picker";
import { CreateSemesterSchema } from "@/schemas/semester";
import {
  SEMESTER_TEMPLATES,
  getSuggestedSemester,
  generateSemesterName,
  getSemesterDates,
} from "@/lib/semester-templates";
import type { SemesterType } from "@/schemas/semester";

/**
 * CreateSemesterDialog
 * Dialog for creating a new semester with Israeli academic calendar templates
 *
 * Features:
 * - Pre-filled templates for Semester A, B, and Summer
 * - Auto-suggested based on current date
 * - Hebrew date picker
 * - Auto-generated semester name
 *
 * UX: Minimal friction, smart defaults, clear labels
 */

interface CreateSemesterDialogProps {
  onSemesterCreated?: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface FormData {
  name: string;
  type: SemesterType;
  year: number;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

const semesterTypeOptions: { value: SemesterType; label: string }[] = [
  { value: "A", label: "סמסטר א'" },
  { value: "B", label: "סמסטר ב'" },
  { value: "SUMMER", label: "סמסטר קיץ" },
];

// Generate year options (current year +/- 2)
const currentYear = new Date().getFullYear();
const yearOptions = [
  currentYear - 1,
  currentYear,
  currentYear + 1,
];

export function CreateSemesterDialog({
  onSemesterCreated,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateSemesterDialogProps) {
  // Support both controlled and uncontrolled modes
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get suggested semester based on current date
  const suggested = getSuggestedSemester();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    type: suggested.type,
    year: suggested.year,
    startDate: undefined,
    endDate: undefined,
  });

  // Auto-fill dates and name when type or year changes
  useEffect(() => {
    const dates = getSemesterDates(formData.type, formData.year);
    const name = generateSemesterName(formData.type, formData.year);

    setFormData((prev) => ({
      ...prev,
      name,
      startDate: dates.start,
      endDate: dates.end,
    }));
  }, [formData.type, formData.year]);

  const resetForm = () => {
    const suggested = getSuggestedSemester();
    setFormData({
      name: "",
      type: suggested.type,
      year: suggested.year,
      startDate: undefined,
      endDate: undefined,
    });
    setError(null);
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value as SemesterType }));
  };

  const handleYearChange = (value: string) => {
    setFormData((prev) => ({ ...prev, year: parseInt(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate dates
      if (!formData.startDate || !formData.endDate) {
        throw new Error("יש לבחור תאריכי התחלה וסיום");
      }

      // Prepare data for API
      const apiData = {
        name: formData.name,
        type: formData.type,
        year: formData.year,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
      };

      // Client-side validation
      CreateSemesterSchema.parse(apiData);

      // API call
      const response = await fetch("/api/semesters", {
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
              if (issue.path?.includes("name")) {
                return "שם הסמסטר הוא שדה חובה";
              }
              if (issue.path?.includes("startDate")) {
                return "תאריך התחלה לא תקין";
              }
              if (issue.path?.includes("endDate")) {
                return "תאריך סיום לא תקין";
              }
              return issue.message;
            }
          );
          throw new Error(hebrewErrors.join(", "));
        }

        throw new Error(errorData.error || "שגיאה ביצירת הסמסטר");
      }

      // Success! Close dialog and reset form
      setOpen(false);
      resetForm();

      // Notify parent
      onSemesterCreated?.();
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
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="primary" size="md" className="min-h-[44px]">
            <Plus className="h-4 w-4" />
            סמסטר חדש
          </Button>
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
            צור סמסטר חדש
          </DialogTitle>
          <DialogDescription>
            בחר את סוג הסמסטר והשנה, והתאריכים יתמלאו אוטומטית
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Semester Type */}
          <div className="space-y-2">
            <Label>סוג סמסטר *</Label>
            <Select value={formData.type} onValueChange={handleTypeChange}>
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder="בחר סוג סמסטר" />
              </SelectTrigger>
              <SelectContent>
                {semesterTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Academic Year */}
          <div className="space-y-2">
            <Label>שנה אקדמית *</Label>
            <Select
              value={formData.year.toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder="בחר שנה" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}-{year + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Auto-generated Name */}
          <div className="space-y-2">
            <Label htmlFor="name">שם הסמסטר</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={isLoading}
            />
            <p className="text-xs text-[var(--color-text-muted)]">
              השם נוצר אוטומטית, ניתן לערוך
            </p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>תאריך התחלה *</Label>
              <DatePicker
                value={formData.startDate}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, startDate: date }))
                }
                placeholder="בחר תאריך"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>תאריך סיום *</Label>
              <DatePicker
                value={formData.endDate}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, endDate: date }))
                }
                placeholder="בחר תאריך"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Template Info */}
          <div className="p-3 rounded-lg bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10">
            <p className="text-sm text-[var(--color-text-secondary)]">
              <span className="font-medium text-[var(--color-primary)]">
                {SEMESTER_TEMPLATES[formData.type].hebrewLabel}
              </span>
              {" - "}
              התאריכים מותאמים ללוח השנה האקדמי הישראלי הטיפוסי
            </p>
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
              צור סמסטר
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
