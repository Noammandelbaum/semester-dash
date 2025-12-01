"use client";

import { cn } from "@/lib/utils";

/**
 * OnboardingProgress
 *
 * Step indicator for onboarding flow.
 * Shows current step out of total steps with visual progress.
 *
 * UX: Progress indicator always visible per UX research
 */

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

const stepLabels = ["ברוך הבא", "סמסטר", "קורס", "סיום"];

export function OnboardingProgress({
  currentStep,
  totalSteps,
  className,
}: OnboardingProgressProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Step indicator dots */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <div
              key={i}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all duration-300",
                isActive && "w-8 bg-[var(--color-primary)]",
                isCompleted && "bg-[var(--color-primary)]",
                !isActive && !isCompleted && "bg-[var(--color-border)]"
              )}
            />
          );
        })}
      </div>

      {/* Step label */}
      <p className="text-center text-sm text-[var(--color-text-muted)]">
        {stepLabels[currentStep - 1]} • שלב {currentStep} מתוך {totalSteps}
      </p>
    </div>
  );
}
