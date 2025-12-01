"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Notification } from "@prisma/client";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Format relative time in Hebrew
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "עכשיו";
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  if (diffDays === 1) return "אתמול";
  if (diffDays < 7) return `לפני ${diffDays} ימים`;

  return new Date(date).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
  });
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(notification.id);
  };

  const content = (
    <div
      className={cn(
        "group relative px-4 py-3 transition-colors",
        "hover:bg-[var(--color-background)]",
        !notification.isRead && "bg-[var(--color-primary)]/5"
      )}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute inset-inline-start-1 top-1/2 -translate-y-1/2">
          <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
        </div>
      )}

      <div className="flex flex-col gap-1 pe-6">
        {/* Title */}
        <p
          className={cn(
            "text-sm",
            notification.isRead
              ? "text-[var(--color-text-secondary)]"
              : "text-[var(--color-text-primary)] font-medium"
          )}
        >
          {notification.title}
        </p>

        {/* Message */}
        <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">
          {notification.message}
        </p>

        {/* Time */}
        <p className="text-xs text-[var(--color-text-muted)]">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className={cn(
          "absolute inset-inline-end-2 top-1/2 -translate-y-1/2",
          "w-6 h-6 flex items-center justify-center rounded",
          "text-[var(--color-text-muted)]",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
        )}
        aria-label="מחק התראה"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );

  // If there's an action URL, wrap in Link
  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
