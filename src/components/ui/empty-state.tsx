import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/**
 * Empty State component
 * Based on UX Research: docs/private/research/ux-research.md
 *
 * Structure:
 * 1. Illustration/Icon - Brand-appropriate, decorative (aria-hidden)
 * 2. Headline - Short, clear explanation (1 line)
 * 3. Description - What to do next (2-3 lines max)
 * 4. CTA - Clear action button
 */

// Built-in illustration types
type IllustrationType =
  | "empty-courses"
  | "empty-assignments"
  | "all-done"
  | "no-results"
  | "error";

interface EmptyStateProps {
  /** Illustration type or custom React node */
  illustration?: IllustrationType | React.ReactNode;
  /** Icon - alias for illustration (for backwards compatibility) */
  icon?: React.ReactNode;
  /** Main headline text */
  title: string;
  /** Supporting description text */
  description?: string;
  /** Primary action button label */
  actionLabel?: string;
  /** Primary action callback */
  onAction?: () => void;
  /** Custom action element (alternative to actionLabel/onAction) */
  action?: React.ReactNode;
  /** Secondary action button label */
  secondaryActionLabel?: string;
  /** Secondary action callback */
  onSecondaryAction?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// SVG Illustrations - simple, brand-appropriate
const illustrations: Record<IllustrationType, React.ReactNode> = {
  "empty-courses": (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Empty bookshelf illustration */}
      <rect x="20" y="90" width="80" height="4" rx="2" fill="var(--color-border)" />
      <rect x="20" y="60" width="80" height="4" rx="2" fill="var(--color-border)" />
      <rect x="20" y="30" width="80" height="4" rx="2" fill="var(--color-border)" />
      <rect x="20" y="30" width="4" height="64" rx="2" fill="var(--color-border)" />
      <rect x="96" y="30" width="4" height="64" rx="2" fill="var(--color-border)" />
      {/* Single tilted book */}
      <rect
        x="55"
        y="65"
        width="12"
        height="20"
        rx="2"
        fill="var(--color-primary)"
        transform="rotate(-10 55 65)"
      />
      <path
        d="M58 68L64 67"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        transform="rotate(-10 55 65)"
      />
    </svg>
  ),
  "empty-assignments": (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Clipboard with empty checkboxes */}
      <rect x="30" y="25" width="60" height="75" rx="6" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="2" />
      <rect x="45" y="15" width="30" height="20" rx="4" fill="var(--color-primary)" />
      <rect x="40" y="50" width="16" height="16" rx="3" stroke="var(--color-border)" strokeWidth="2" fill="none" />
      <rect x="40" y="75" width="16" height="16" rx="3" stroke="var(--color-border)" strokeWidth="2" fill="none" />
      <line x1="64" y1="56" x2="80" y2="56" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
      <line x1="64" y1="62" x2="75" y2="62" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
      <line x1="64" y1="81" x2="80" y2="81" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
      <line x1="64" y1="87" x2="75" y2="87" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "all-done": (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Celebration illustration */}
      <circle cx="60" cy="60" r="35" fill="var(--color-success)" fillOpacity="0.15" />
      <circle cx="60" cy="60" r="25" fill="var(--color-success)" fillOpacity="0.3" />
      <path
        d="M45 60L55 70L75 50"
        stroke="var(--color-success)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Confetti dots */}
      <circle cx="30" cy="35" r="3" fill="var(--color-secondary)" />
      <circle cx="90" cy="40" r="3" fill="var(--color-primary)" />
      <circle cx="25" cy="70" r="2" fill="var(--color-warning)" />
      <circle cx="95" cy="75" r="2" fill="var(--color-accent)" />
      <circle cx="40" cy="25" r="2" fill="var(--color-info)" />
      <circle cx="80" cy="90" r="2" fill="var(--color-secondary)" />
    </svg>
  ),
  "no-results": (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Magnifying glass with nothing found */}
      <circle cx="52" cy="52" r="25" stroke="var(--color-border)" strokeWidth="4" fill="none" />
      <line
        x1="72"
        y1="72"
        x2="95"
        y2="95"
        stroke="var(--color-border)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="42"
        y1="52"
        x2="62"
        y2="52"
        stroke="var(--color-text-muted)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  ),
  "error": (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Error/warning illustration - soft, not alarming */}
      <circle cx="60" cy="60" r="35" fill="var(--color-warning)" fillOpacity="0.15" />
      <circle cx="60" cy="75" r="4" fill="var(--color-warning)" />
      <rect x="56" y="40" width="8" height="28" rx="4" fill="var(--color-warning)" />
    </svg>
  ),
};

// Type guard for illustration types
function isIllustrationType(value: string): value is IllustrationType {
  return value in illustrations;
}

export function EmptyState({
  illustration = "empty-courses",
  icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
  secondaryActionLabel,
  onSecondaryAction,
  className,
}: EmptyStateProps) {
  // Use icon prop as override for illustration, otherwise use illustration
  const illustrationSource = icon || illustration;
  const illustrationNode =
    typeof illustrationSource === "string" && isIllustrationType(illustrationSource)
      ? illustrations[illustrationSource]
      : typeof illustrationSource === "string"
        ? illustrations["empty-courses"] // Fallback for unknown string types
        : illustrationSource;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8",
        "min-h-[300px]",
        className
      )}
      role="status"
      aria-label={title}
    >
      {/* Illustration - decorative, skipped by screen readers */}
      <div className="mb-6 animate-fade-in" aria-hidden="true">
        {illustrationNode}
      </div>

      {/* Headline */}
      <h3 className="text-xl font-medium text-[var(--color-text-primary)] mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-[var(--color-text-secondary)] max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || actionLabel || secondaryActionLabel) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action ? (
            action
          ) : (
            <>
              {actionLabel && onAction && (
                <Button
                  variant="primary"
                  onClick={onAction}
                  className="min-h-[44px] min-w-[44px]" // Touch target
                >
                  {actionLabel}
                </Button>
              )}
              {secondaryActionLabel && onSecondaryAction && (
                <Button
                  variant="ghost"
                  onClick={onSecondaryAction}
                  className="min-h-[44px] min-w-[44px]" // Touch target
                >
                  {secondaryActionLabel}
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

EmptyState.displayName = "EmptyState";
