"use client";

import * as React from "react";
import { cn, getProgressColor } from "@/lib/utils";

/**
 * Linear Progress Bar
 * RTL-aware: Fills from right-to-left in RTL mode
 * Accessible: WCAG 2.1 AA compliant with proper ARIA attributes
 */
interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  colorByProgress?: boolean;
  color?: string;
  /** Accessible label for screen readers */
  label?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value,
      max = 100,
      showLabel = false,
      size = "md",
      colorByProgress = true,
      color,
      label = "התקדמות",
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const progressColor = color || (colorByProgress ? getProgressColor(percentage) : "var(--color-primary)");

    const heights = {
      sm: "h-1.5",
      md: "h-2.5",
      lg: "h-4",
    };

    return (
      <div className={cn("w-full", className)} ref={ref} {...props}>
        {showLabel && (
          <div className="flex justify-between mb-1">
            <span className="text-sm text-[var(--color-text-secondary)]">
              {label}
            </span>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div
          role="progressbar"
          aria-valuenow={Math.round(percentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
          className={cn(
            "w-full bg-[var(--color-border)] rounded-full overflow-hidden",
            heights[size]
          )}
        >
          {/* RTL: Progress bar fills from right using margin-inline-start */}
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${percentage}%`,
              backgroundColor: progressColor,
            }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = "Progress";

/**
 * Circular Progress Ring
 * Universal clockwise direction (consistent across LTR/RTL)
 * Accessible: WCAG 2.1 AA compliant with proper ARIA attributes
 *
 * Usage:
 * - Semester completion percentage
 * - Course grade progress
 * - Individual goal tracking
 */
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  colorByProgress?: boolean;
  color?: string;
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 64,
  strokeWidth = 6,
  showLabel = true,
  colorByProgress = true,
  color,
  className,
  label = "התקדמות",
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const progressColor = color || (colorByProgress ? getProgressColor(percentage) : "var(--color-primary)");

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("relative inline-flex items-center justify-center", className)}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle - clockwise fill (universal) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showLabel && (
        <span
          className="absolute text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
          aria-hidden="true"
        >
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

export { Progress };
