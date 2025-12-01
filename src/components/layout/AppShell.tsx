"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { MobileHeader } from "./MobileHeader";
import { mainNavItems } from "./nav-items";

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Desktop Sidebar (RTL: positioned on the right) */}
      <Sidebar items={mainNavItems} user={user} />

      {/* Mobile Header */}
      <MobileHeader user={user} />

      {/* Main Content */}
      <main
        className={cn(
          // Desktop: offset for sidebar (RTL: margin on right side where sidebar is)
          "lg:ms-64",
          // Mobile: bottom padding for bottom nav
          "pb-20 lg:pb-0"
        )}
      >
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav items={mainNavItems} />
    </div>
  );
}
