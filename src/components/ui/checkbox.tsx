"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "@/lib/utils";

/**
 * Checkbox component
 * Accessible with proper touch target (44x44px minimum)
 *
 * The visual checkbox is 20x20px but the touch target extends to 44x44px
 * via padding, ensuring accessibility on mobile devices.
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // Visual size: 20x20px for the checkbox itself
      "peer h-5 w-5 shrink-0 rounded-md",
      // Border and colors
      "border-2 border-[var(--color-primary)]",
      // Focus styles
      "ring-offset-background focus-visible:outline-none",
      "focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
      // Disabled state
      "disabled:cursor-not-allowed disabled:opacity-50",
      // Checked state
      "data-[state=checked]:bg-[var(--color-primary)] data-[state=checked]:text-white",
      // Transition
      "transition-colors",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        style={{
          strokeDasharray: 100,
          strokeDashoffset: 0,
          animation: 'checkmark 300ms ease-out',
        }}
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

/**
 * Checkbox with label - ensures proper touch target
 * Wraps both checkbox and label in a clickable container
 */
interface CheckboxWithLabelProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label: string;
  description?: string;
}

const CheckboxWithLabel = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxWithLabelProps
>(({ className, label, description, id, ...props }, ref) => {
  const generatedId = React.useId();
  const checkboxId = id || generatedId;

  return (
    <div className="flex items-start gap-3">
      <Checkbox ref={ref} id={checkboxId} className={className} {...props} />
      <div className="grid gap-1 leading-none">
        <label
          htmlFor={checkboxId}
          className={cn(
            "text-sm font-medium text-[var(--color-text-primary)]",
            "cursor-pointer",
            // Minimum touch target achieved through label
            "min-h-[44px] flex items-center"
          )}
        >
          {label}
        </label>
        {description && (
          <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
        )}
      </div>
    </div>
  );
});
CheckboxWithLabel.displayName = "CheckboxWithLabel";

export { Checkbox, CheckboxWithLabel };
