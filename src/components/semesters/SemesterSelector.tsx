"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Plus, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { calculateSemesterProgress, getCurrentWeek, getTotalWeeks } from "@/lib/semester-templates";
import type { Semester } from "@prisma/client";

/**
 * SemesterSelector
 * Dropdown component in the sidebar for switching between semesters
 *
 * Features:
 * - Shows current active semester
 * - Displays semester progress
 * - Quick switch between semesters
 * - Link to create new semester
 *
 * UX: Compact design, clear progress indication
 */

interface SemesterWithCount extends Semester {
  _count?: {
    courses: number;
  };
}

interface SemesterSelectorProps {
  onCreateNew?: () => void;
  className?: string;
}

export function SemesterSelector({ onCreateNew, className }: SemesterSelectorProps) {
  const [semesters, setSemesters] = useState<SemesterWithCount[]>([]);
  const [activeSemester, setActiveSemester] = useState<SemesterWithCount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Fetch semesters on mount
  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/semesters");
      if (response.ok) {
        const data = await response.json();
        setSemesters(data.semesters);
        const active = data.semesters.find((s: SemesterWithCount) => s.isActive);
        setActiveSemester(active || null);
      }
    } catch (error) {
      console.error("Error fetching semesters:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async (semesterId: string) => {
    if (isSwitching) return;

    try {
      setIsSwitching(true);
      const response = await fetch(`/api/semesters/${semesterId}/activate`, {
        method: "POST",
      });

      if (response.ok) {
        // Refresh semesters list
        await fetchSemesters();
        setIsOpen(false);

        // Trigger page refresh to update dashboard context
        window.location.reload();
      }
    } catch (error) {
      console.error("Error activating semester:", error);
    } finally {
      setIsSwitching(false);
    }
  };

  // Calculate progress for active semester
  const progress = activeSemester
    ? calculateSemesterProgress(activeSemester.startDate, activeSemester.endDate)
    : 0;

  const currentWeek = activeSemester
    ? getCurrentWeek(activeSemester.startDate)
    : 0;

  const totalWeeks = activeSemester
    ? getTotalWeeks(activeSemester.startDate, activeSemester.endDate)
    : 0;

  if (isLoading) {
    return (
      <div className={cn("px-4 py-3", className)}>
        <div className="h-10 rounded-lg bg-[var(--color-border)] animate-pulse" />
      </div>
    );
  }

  // No semesters - show create prompt
  if (semesters.length === 0) {
    return (
      <div className={cn("px-4 py-3", className)}>
        <Button
          variant="ghost"
          onClick={onCreateNew}
          className="w-full justify-start gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
        >
          <Plus className="h-4 w-4" />
          <span>צור סמסטר ראשון</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("px-4 py-3", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg",
              "bg-[var(--color-background)] hover:bg-[var(--color-primary)]/5",
              "border border-[var(--color-border)]",
              "transition-colors duration-200",
              "text-start"
            )}
          >
            {/* Calendar Icon with Progress */}
            <div className="relative">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  "bg-[var(--color-primary)]/10"
                )}
              >
                <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
              </div>
              {/* Progress indicator */}
              <div
                className="absolute -bottom-1 -end-1 w-5 h-5 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-[10px] font-medium text-[var(--color-primary)] border border-[var(--color-border)]"
              >
                {progress}%
              </div>
            </div>

            {/* Semester Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {activeSemester?.name || "בחר סמסטר"}
              </p>
              {activeSemester && currentWeek > 0 && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  שבוע {currentWeek} מתוך {totalWeeks}
                </p>
              )}
            </div>

            {/* Chevron */}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-[var(--color-text-muted)] transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-64 p-2">
          <div className="space-y-1">
            {/* Semester List */}
            {semesters.map((semester) => {
              const isActive = semester.isActive;
              const semProgress = calculateSemesterProgress(
                semester.startDate,
                semester.endDate
              );

              return (
                <button
                  key={semester.id}
                  onClick={() => !isActive && handleActivate(semester.id)}
                  disabled={isSwitching}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg transition-colors",
                    "text-start",
                    isActive
                      ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                      : "hover:bg-[var(--color-background)] text-[var(--color-text-secondary)]",
                    isSwitching && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{semester.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {semester._count?.courses || 0} קורסים
                    </p>
                  </div>

                  {/* Progress Badge */}
                  <div
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      isActive
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-border)] text-[var(--color-text-muted)]"
                    )}
                  >
                    {semProgress}%
                  </div>
                </button>
              );
            })}

            {/* Divider */}
            <div className="h-px bg-[var(--color-border)] my-2" />

            {/* Create New Semester */}
            <button
              onClick={() => {
                setIsOpen(false);
                onCreateNew?.();
              }}
              className="w-full flex items-center gap-2 p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] hover:text-[var(--color-primary)] transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">סמסטר חדש</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
