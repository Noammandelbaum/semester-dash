"use client";

import { cn } from "@/lib/utils";
import { OnboardingProgress } from "./OnboardingProgress";

/**
 * OnboardingCard
 *
 * Wrapper component for onboarding steps with consistent styling.
 * Includes progress indicator at top.
 *
 * UX: Clean, calm design with generous white space
 */

interface OnboardingCardProps {
  currentStep: number;
  totalSteps?: number;
  showProgress?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function OnboardingCard({
  currentStep,
  totalSteps = 4,
  showProgress = true,
  className,
  children,
}: OnboardingCardProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Progress indicator */}
      {showProgress && (
        <OnboardingProgress currentStep={currentStep} totalSteps={totalSteps} />
      )}

      {/* Card content */}
      <div
        className={cn(
          "bg-[var(--color-bg-primary)] rounded-2xl shadow-lg border border-[var(--color-border)]",
          "p-6 sm:p-8",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
