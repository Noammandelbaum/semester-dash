"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications";

interface MobileHeaderProps {
  user?: {
    name?: string | null;
    image?: string | null;
  };
  showLogo?: boolean;
}

export function MobileHeader({ user, showLogo = true }: MobileHeaderProps) {
  return (
    <header
      className={cn(
        "lg:hidden sticky top-0 z-40",
        "h-14 px-4",
        "bg-[var(--color-surface)] border-b border-[var(--color-border)]",
        "flex items-center justify-between"
      )}
    >
      {/* Logo */}
      {showLogo && (
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <span className="text-white font-bold text-sm">SH</span>
          </div>
          <span className="text-base font-semibold text-[var(--color-primary)]">
            SemesterHub
          </span>
        </Link>
      )}

      {/* Notifications + User Avatar */}
      <div className="flex items-center gap-2">
        <NotificationBell />
        {user && (
          <Link href="/dashboard/settings" className="flex items-center">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.name?.charAt(0) || "U"}
                </span>
              </div>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
