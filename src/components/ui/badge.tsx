import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
        success: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
        warning: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
        danger: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
        info: "bg-[var(--color-info)]/10 text-[var(--color-info)]",
        secondary: "bg-[var(--color-border)] text-[var(--color-text-secondary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
