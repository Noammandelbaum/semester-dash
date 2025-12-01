"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { OnboardingCard } from "@/components/onboarding";
import {
  SEMESTER_TEMPLATES,
  getSuggestedSemester,
  generateSemesterName,
  getSemesterDates,
} from "@/lib/semester-templates";
import type { SemesterType } from "@/schemas/semester";

/**
 * Semester Step (Step 2)
 *
 * Create first semester:
 * - Select semester type (A/B/Summer)
 * - Auto-fill dates from Israeli academic calendar template
 * - Allow date customization
 *
 * UX: 30 seconds, smart defaults, minimal input required
 */

const semesterTypeOptions: { value: SemesterType; label: string }[] = [
  { value: "A", label: "סמסטר א'" },
  { value: "B", label: "סמסטר ב'" },
  { value: "SUMMER", label: "סמסטר קיץ" },
];

// Generate year options (current year +/- 1)
const currentYear = new Date().getFullYear();
const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

interface FormData {
  type: SemesterType;
  year: number;
  startDate: Date | undefined;
  endDate: Date | undefined;
  name: string;
}

export default function SemesterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get suggested semester based on current date
  const suggested = getSuggestedSemester();

  const [formData, setFormData] = useState<FormData>({
    type: suggested.type,
    year: suggested.year,
    startDate: undefined,
    endDate: undefined,
    name: "",
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

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value as SemesterType }));
  };

  const handleYearChange = (value: string) => {
    setFormData((prev) => ({ ...prev, year: parseInt(value) }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate dates
      if (!formData.startDate || !formData.endDate) {
        throw new Error("יש לבחור תאריכי התחלה וסיום");
      }

      // API call to create semester
      const response = await fetch("/api/semesters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          year: formData.year,
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "שגיאה ביצירת הסמסטר");
      }

      // Success! Move to next step
      router.push("/onboarding/course");
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

  const handleBack = () => {
    router.push("/onboarding/welcome");
  };

  return (
    <OnboardingCard currentStep={2}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-6 h-6 text-[var(--color-primary)]" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          בחר את הסמסטר שלך
        </h1>
        <p className="text-[var(--color-text-muted)]">
          התאריכים יתמלאו אוטומטית לפי לוח השנה האקדמי
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Semester Type */}
        <div className="space-y-2">
          <Label>סוג סמסטר</Label>
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
          <Label>שנה אקדמית</Label>
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

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>תאריך התחלה</Label>
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
            <Label>תאריך סיום</Label>
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
            {formData.name}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
            {error}
          </div>
        )}
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
          onClick={handleSubmit}
          isLoading={isLoading}
          className="flex-1"
        >
          המשך
          <ArrowLeft className="w-4 h-4 mr-2" />
        </Button>
      </div>
    </OnboardingCard>
  );
}
