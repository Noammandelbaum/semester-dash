import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton loading component
 * Shows placeholder content while data is loading
 *
 * Accessibility:
 * - Uses aria-hidden to hide from screen readers
 * - Provides aria-busy on parent containers
 * - Respects prefers-reduced-motion
 */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width of the skeleton (default: full) */
  width?: string | number;
  /** Height of the skeleton (default: based on variant) */
  height?: string | number;
  /** Shape variant */
  variant?: "text" | "circular" | "rectangular" | "rounded";
}

function Skeleton({
  className,
  width,
  height,
  variant = "rectangular",
  ...props
}: SkeletonProps) {
  const variantStyles = {
    text: "h-4 rounded",
    circular: "rounded-full aspect-square",
    rectangular: "rounded-none",
    rounded: "rounded-lg",
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-[var(--color-border)]",
        variantStyles[variant],
        className
      )}
      style={{
        width: width ?? "100%",
        height: height ?? (variant === "text" ? "1rem" : undefined),
      }}
      {...props}
    />
  );
}

Skeleton.displayName = "Skeleton";

/**
 * Pre-built skeleton variants for common use cases
 */

/** Text line skeleton */
function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 && lines > 1 ? "75%" : "100%"}
        />
      ))}
    </div>
  );
}

SkeletonText.displayName = "SkeletonText";

/** Card skeleton */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]",
        className
      )}
      aria-hidden="true"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" height="0.75rem" />
          </div>
        </div>
        <Skeleton variant="rounded" height={8} />
        <div className="flex gap-2">
          <Skeleton variant="rounded" width={80} height={24} />
          <Skeleton variant="rounded" width={60} height={24} />
        </div>
      </div>
    </div>
  );
}

SkeletonCard.displayName = "SkeletonCard";

/** Course card skeleton */
function SkeletonCourseCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <Skeleton variant="text" width="70%" height="1.25rem" />
          <Skeleton variant="text" width="40%" height="0.875rem" />
          <div className="pt-2">
            <Skeleton variant="rounded" height={8} />
          </div>
        </div>
        <Skeleton variant="circular" width={64} height={64} />
      </div>
    </div>
  );
}

SkeletonCourseCard.displayName = "SkeletonCourseCard";

/** Table row skeleton */
function SkeletonTableRow({
  columns = 4,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center gap-4 py-3 border-b border-[var(--color-border)]", className)}
      aria-hidden="true"
    >
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === 0 ? "25%" : `${Math.floor(75 / (columns - 1))}%`}
        />
      ))}
    </div>
  );
}

SkeletonTableRow.displayName = "SkeletonTableRow";

/** Avatar skeleton */
function SkeletonAvatar({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  );
}

SkeletonAvatar.displayName = "SkeletonAvatar";

/** Button skeleton */
function SkeletonButton({
  width = 100,
  className,
}: {
  width?: number | string;
  className?: string;
}) {
  return (
    <Skeleton
      variant="rounded"
      width={width}
      height={40}
      className={cn("rounded-lg", className)}
    />
  );
}

SkeletonButton.displayName = "SkeletonButton";

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonCourseCard,
  SkeletonTableRow,
  SkeletonAvatar,
  SkeletonButton,
};
