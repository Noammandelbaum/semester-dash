"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { NotificationItem } from "./NotificationItem";
import type { Notification } from "@prisma/client";

interface NotificationDropdownProps {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function NotificationDropdown({
  notifications,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClose,
}: NotificationDropdownProps) {
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div
      className={cn(
        "absolute inset-inline-end-0 top-full mt-2",
        "w-64 max-h-[400px] overflow-hidden",
        "bg-[var(--color-surface)] rounded-lg shadow-lg",
        "border border-[var(--color-border)]",
        "z-50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
          התראות
        </h3>
        {hasUnread && (
          <button
            onClick={onMarkAllAsRead}
            className={cn(
              "text-xs text-[var(--color-primary)]",
              "hover:underline focus:outline-none focus:underline"
            )}
          >
            סמן הכל כנקרא
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="max-h-[320px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            {/* Empty state illustration */}
            <div className="w-16 h-16 mb-3 rounded-full bg-[var(--color-background)] flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--color-text-muted)]"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              אין התראות חדשות
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              נעדכן אותך כשיהיה משהו חדש
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
