"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={cn(
        "w-full px-4 py-2 rounded-lg text-sm",
        "text-[var(--color-text-secondary)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]",
        "transition-colors min-h-[44px]",
        className
      )}
    >
      התנתק
    </button>
  );
}
