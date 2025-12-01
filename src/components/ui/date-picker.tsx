"use client";

import * as React from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Date Picker component
 * Hebrew-first with RTL support, built on react-day-picker
 *
 * Features:
 * - Hebrew locale by default
 * - RTL layout
 * - Accessible (WCAG 2.1 AA)
 * - 44x44px touch targets
 */

interface DatePickerProps {
  /** Selected date */
  value?: Date;
  /** Called when date changes */
  onChange?: (date: Date | undefined) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disable the picker */
  disabled?: boolean;
  /** Minimum selectable date */
  fromDate?: Date;
  /** Maximum selectable date */
  toDate?: Date;
  /** Additional CSS classes */
  className?: string;
  /** Label for accessibility */
  label?: string;
}

/**
 * Format date in Hebrew
 */
export function formatDateHebrew(date: Date): string {
  return format(date, "d בMMMM yyyy", { locale: he });
}

/**
 * Format date in Hebrew with day of week
 */
export function formatDateHebrewFull(date: Date): string {
  return format(date, "EEEE, d בMMMM yyyy", { locale: he });
}

export function DatePicker({
  value,
  onChange,
  placeholder = "בחר תאריך",
  disabled = false,
  fromDate,
  toDate,
  className,
  label,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date);
    setOpen(false);
  };

  return (
    <div className={cn("grid gap-1.5", className)}>
      {label && (
        <label className="text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-start font-normal",
              "min-h-[44px]", // Touch target
              !value && "text-[var(--color-text-muted)]"
            )}
            aria-label={label || placeholder}
          >
            <CalendarIcon className="me-2 h-4 w-4" />
            {value ? formatDateHebrew(value) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            disabled={(date) => {
              if (fromDate && date < fromDate) return true;
              if (toDate && date > toDate) return true;
              return false;
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

DatePicker.displayName = "DatePicker";

/**
 * Date Range Picker component
 * For selecting a date range (e.g., semester dates)
 */
interface DateRangePickerProps {
  /** Selected date range */
  value?: DateRange;
  /** Called when range changes */
  onChange?: (range: DateRange | undefined) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disable the picker */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Label for accessibility */
  label?: string;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "בחר טווח תאריכים",
  disabled = false,
  className,
  label,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const formatRange = () => {
    if (!value?.from) return placeholder;
    if (!value.to) return formatDateHebrew(value.from);
    return `${formatDateHebrew(value.from)} - ${formatDateHebrew(value.to)}`;
  };

  return (
    <div className={cn("grid gap-1.5", className)}>
      {label && (
        <label className="text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-start font-normal",
              "min-h-[44px]", // Touch target
              !value?.from && "text-[var(--color-text-muted)]"
            )}
            aria-label={label || placeholder}
          >
            <CalendarIcon className="me-2 h-4 w-4" />
            {formatRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

DateRangePicker.displayName = "DateRangePicker";
