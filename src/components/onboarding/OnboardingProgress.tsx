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
    <div className={cn("w-full", className)} role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`שלב ${currentStep} מתוך ${totalSteps}`}>
      {/* Step indicator dots */}
      <div className="flex items-center justify-center gap-2 mb-3">
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
                isCompleted && "bg-[var(--color-success)]",
                !isActive && !isCompleted && "bg-[var(--color-border)]"
              )}
              aria-label={isCompleted ? `שלב ${stepNum} הושלם` : isActive ? `שלב ${stepNum} פעיל` : `שלב ${stepNum}`}
              aria-current={isActive ? 'step' : undefined}
            />
          );
        })}
      </div>

      {/* Step label - larger and clearer */}
      <p className="text-center text-[var(--color-text-primary)] font-medium">
        <span className="text-[var(--color-primary)]">{stepLabels[currentStep - 1]}</span>
        <span className="text-[var(--color-text-muted)] mx-2">•</span>
        <span className="text-[var(--color-text-secondary)]">צעד {currentStep} מתוך {totalSteps}</span>
      </p>
    </div>
  );
}
