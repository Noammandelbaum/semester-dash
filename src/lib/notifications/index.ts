export {
  createNotification,
  createDeadlineReminder,
  getUnreadCount,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  wasReminderSentToday,
  getDeadlineReminderMessage,
  type NotificationType,
  type CreateNotificationData,
} from "./notification-service";

export { sendReminderEmail, isEmailEnabled } from "./email-service";
