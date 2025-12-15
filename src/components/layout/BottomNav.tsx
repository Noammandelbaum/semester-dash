"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { NavItemConfig } from "./nav-items";

interface BottomNavProps {
  items: NavItemConfig[];
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  // Show max 5 items in bottom nav (UX research recommendation)
  const visibleItems = items.slice(0, 5);

  return (
    <nav
      className={cn(
        "lg:hidden fixed bottom-0 inset-x-0 z-50",
        "bg-[var(--color-surface)] border-t border-[var(--color-border)]",
        "safe-area-inset-bottom" // PWA safe area
      )}
    >
      <div className="flex items-stretch justify-around">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={`${t(item.labelKey)}${item.badge && item.badge > 0 ? ` - ${item.badge} פריטים` : ''}`}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                "flex flex-col items-center justify-center",
                "py-2 px-3 flex-1",
                "min-h-[56px] min-w-[64px]", // Touch-friendly 44x44px+ target
                "transition-colors",
                isActive
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)]"
              )}
            >
              <span
                className={cn(
                  "relative w-6 h-6 flex items-center justify-center",
                  isActive && "scale-110"
                )}
              >
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className="absolute -top-1 -end-1 w-4 h-4 flex items-center justify-center text-[10px] bg-[var(--color-danger)] text-white rounded-full"
                    aria-label={`${item.badge} התראות`}
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-xs mt-1",
                  isActive ? "font-medium" : "font-normal"
                )}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
