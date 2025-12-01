/**
 * Notification Service
 *
 * Core service for creating and managing in-app notifications.
 * Follows UX research guidelines: NO guilt messaging, supportive tone.
 */

import { prisma } from "@/lib/prisma";
import type { Assignment, Course, Notification } from "@prisma/client";
import { sendReminderEmail, isEmailEnabled } from "./email-service";

// ========================================
// Types
// ========================================

export type NotificationType = "deadline_reminder" | "assignment_due";

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  assignmentId?: string;
}

// ========================================
// Message Templates (Hebrew, supportive tone)
// ========================================

/**
 * Generate a supportive reminder message
 * UX: NO guilt messaging! "רק תזכורת" not "⚠️ DEADLINE!"
 */
export function getDeadlineReminderMessage(
  assignmentTitle: string,
  courseName: string,
  daysUntilDue: number
): { title: string; message: string } {
  if (daysUntilDue === 0) {
    return {
      title: `${assignmentTitle}`,
      message: `היום זה היום - הגשה ב${courseName}. אפשר!`,
    };
  }

  if (daysUntilDue === 1) {
    return {
      title: `${assignmentTitle}`,
      message: `רק תזכורת: מטלה ב${courseName} מחר`,
    };
  }

  return {
    title: `${assignmentTitle}`,
    message: `בעוד ${daysUntilDue} ימים: מטלה ב${courseName}`,
  };
}

// ========================================
// Core Functions
// ========================================

/**
 * Create an in-app notification
 */
export async function createNotification(
  data: CreateNotificationData
): Promise<Notification> {
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      assignmentId: data.assignmentId,
    },
  });

  return notification;
}

/**
 * Create a deadline reminder notification for an assignment
 */
export async function createDeadlineReminder(
  assignment: Assignment & { course: Course },
  user: { id: string; email?: string | null; name?: string | null }
): Promise<Notification> {
  const now = new Date();
  const dueDate = new Date(assignment.dueDate);
  const diffTime = dueDate.getTime() - now.getTime();
  const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const { title, message } = getDeadlineReminderMessage(
    assignment.title,
    assignment.course.name,
    daysUntilDue
  );

  // Create in-app notification
  const notification = await createNotification({
    userId: user.id,
    type: "deadline_reminder",
    title,
    message,
    actionUrl: `/dashboard/courses/${assignment.courseId}`,
    assignmentId: assignment.id,
  });

  // Check user preferences for email notifications
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: user.id },
  });

  // Send email if enabled and user has email
  if (preferences?.emailNotifications && user.email && isEmailEnabled()) {
    await sendReminderEmail({
      to: user.email,
      userName: user.name || "סטודנט",
      assignment,
    });
  }

  return notification;
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

/**
 * Get recent notifications for a user
 */
export async function getNotifications(
  userId: string,
  options: { limit?: number; includeRead?: boolean } = {}
): Promise<Notification[]> {
  const { limit = 20, includeRead = true } = options;

  return prisma.notification.findMany({
    where: {
      userId,
      ...(includeRead ? {} : { isRead: false }),
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

/**
 * Mark a notification as read
 */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<Notification | null> {
  return prisma.notification.update({
    where: {
      id: notificationId,
      userId, // Security: ensure notification belongs to user
    },
    data: {
      isRead: true,
    },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return result.count;
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<boolean> {
  try {
    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId, // Security: ensure notification belongs to user
      },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a reminder was already sent for this assignment and day
 * Prevents duplicate notifications
 */
export async function wasReminderSentToday(
  userId: string,
  assignmentId: string
): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingReminder = await prisma.notification.findFirst({
    where: {
      userId,
      assignmentId,
      type: "deadline_reminder",
      createdAt: {
        gte: today,
      },
    },
  });

  return !!existingReminder;
}
