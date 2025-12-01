"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { he } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Calendar component based on react-day-picker
 * Hebrew-first with RTL support
 *
 * Usage:
 * <Calendar
 *   mode="single"
 *   selected={date}
 *   onSelect={setDate}
 * />
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = he,
  dir = "rtl",
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={locale}
      dir={dir}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "absolute start-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          // RTL: flip arrows
          "rtl:rotate-180"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "absolute end-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          // RTL: flip arrows
          "rtl:rotate-180"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-[var(--color-text-muted)] rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal",
          "hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]",
          "focus-visible:bg-[var(--color-primary)]/10 focus-visible:text-[var(--color-primary)]",
          // Ensure touch target
          "min-h-[44px] min-w-[44px]"
        ),
        range_end: "day-range-end",
        selected:
          "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)] hover:text-white focus:bg-[var(--color-primary)] focus:text-white rounded-md",
        today: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
        outside:
          "text-[var(--color-text-muted)] opacity-50 aria-selected:bg-[var(--color-primary)]/50 aria-selected:text-[var(--color-text-muted)] aria-selected:opacity-30",
        disabled: "text-[var(--color-text-muted)] opacity-50",
        range_middle:
          "aria-selected:bg-[var(--color-primary)]/10 aria-selected:text-[var(--color-text-primary)]",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          // In RTL, we flip the icons
          const Icon = orientation === "left" ? ChevronRight : ChevronLeft;
          return <Icon className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
