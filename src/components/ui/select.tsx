"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelect() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a Select");
  }
  return context;
}

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

function Select({ value, defaultValue = "", onValueChange, children }: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const setValue = (newValue: string) => {
    if (!isControlled) setInternalValue(newValue);
    onValueChange?.(newValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value: currentValue, onValueChange: setValue, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps {
  className?: string;
  placeholder?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

function SelectTrigger({ className, placeholder = "בחר...", children, disabled }: SelectTriggerProps) {
  const { value, open, setOpen } = useSelect();
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.parentElement?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen(!open)}
      disabled={disabled}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm",
        "bg-[var(--color-surface)] border-[var(--color-border)]",
        "text-[var(--color-text-primary)]",
        "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      <span className={cn(!value && "text-[var(--color-text-muted)]")}>
        {children || (value ? undefined : placeholder)}
      </span>
      <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
    </button>
  );
}

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useSelect();
  return <span>{value || placeholder}</span>;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

function SelectContent({ children, className }: SelectContentProps) {
  const { open } = useSelect();

  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute z-50 mt-1 w-full rounded-lg border",
        "bg-[var(--color-surface)] border-[var(--color-border)]",
        "shadow-[var(--shadow-lg)] animate-slide-down",
        "max-h-60 overflow-auto",
        className
      )}
    >
      {children}
    </div>
  );
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function SelectItem({ value, children, className }: SelectItemProps) {
  const { value: selectedValue, onValueChange } = useSelect();
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={cn(
        "flex w-full items-center justify-between px-3 py-2 text-sm",
        "text-[var(--color-text-primary)]",
        "hover:bg-[var(--color-primary)]/10",
        isSelected && "bg-[var(--color-primary)]/5",
        className
      )}
    >
      <span>{children}</span>
      {isSelected && <Check className="h-4 w-4 text-[var(--color-primary)]" />}
    </button>
  );
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
