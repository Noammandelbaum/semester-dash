"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./LogoutButton";
import { SemesterSelector, SyncSemesterDialog } from "@/components/semesters";
import { NotificationBell } from "@/components/notifications";
import type { NavItemConfig } from "./nav-items";

// Legacy NavItem interface for backwards compatibility
export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  items: NavItemConfig[];
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Sidebar({ items, user }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [syncSemesterOpen, setSyncSemesterOpen] = useState(false);

  const handleSyncComplete = () => {
    // Refresh the page to update semester context
    window.location.reload();
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col w-64 h-screen",
        "bg-[var(--color-surface)] border-s border-[var(--color-border)]",
        "fixed inset-inline-start-0 top-0 z-40"
      )}
    >
      {/* Logo / Brand + Notifications */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-border)]">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <span className="text-white font-bold text-sm">SH</span>
          </div>
          <span className="text-lg font-semibold text-[var(--color-primary)]">
            SemesterHub
          </span>
        </Link>
        <NotificationBell />
      </div>

      {/* Semester Selector */}
      <SemesterSelector onCreateNew={() => setSyncSemesterOpen(true)} />

      {/* Sync Semester Dialog (Moodle-only) */}
      <SyncSemesterDialog
        open={syncSemesterOpen}
        onOpenChange={setSyncSemesterOpen}
        onSyncComplete={handleSyncComplete}
      />

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                "min-h-[44px]", // Touch-friendly target size
                isActive
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
              )}
            >
              <span className="w-5 h-5 flex items-center justify-center">
                {item.icon}
              </span>
              <span className="font-medium">{t(item.labelKey)}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={cn(
                    "ms-auto px-2 py-0.5 text-xs rounded-full",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  )}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      {user && (
        <div className="p-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-background)]">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                <span className="text-white font-medium">
                  {user.name?.charAt(0) || "U"}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {user.name}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">
                {user.email}
              </p>
            </div>
          </div>
          <LogoutButton className="mt-2" />
        </div>
      )}
    </aside>
  );
}
