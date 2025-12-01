import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';

/**
 * Format a date in Hebrew format
 * Example: "יום שני, 15 בדצמבר 2024"
 */
export function formatHebrewDate(date: Date): string {
  return format(date, 'EEEE, d בMMMM yyyy', { locale: he });
}

/**
 * Format a short date in Hebrew
 * Example: "15 בדצמבר"
 */
export function formatHebrewDateShort(date: Date): string {
  return format(date, 'd בMMMM', { locale: he });
}

/**
 * Format a relative date in Hebrew
 * Example: "לפני 3 ימים", "בעוד 2 שעות"
 */
export function formatRelativeDate(date: Date): string {
  return formatDistanceToNow(date, { locale: he, addSuffix: true });
}

/**
 * Get a human-readable relative day label
 * Returns: "היום", "מחר", "אתמול", or the formatted date
 */
export function getRelativeDayLabel(date: Date): string {
  if (isToday(date)) {
    return 'היום';
  }
  if (isTomorrow(date)) {
    return 'מחר';
  }
  if (isYesterday(date)) {
    return 'אתמול';
  }

  const days = differenceInDays(date, new Date());
  if (days > 0 && days <= 7) {
    return `בעוד ${days} ימים`;
  }
  if (days < 0 && days >= -7) {
    return `לפני ${Math.abs(days)} ימים`;
  }

  return formatHebrewDateShort(date);
}

/**
 * Format time in 24-hour format
 * Example: "14:30"
 */
export function formatTime(date: Date): string {
  return format(date, 'HH:mm', { locale: he });
}

/**
 * Format date and time
 * Example: "15 בדצמבר, 14:30"
 */
export function formatDateTime(date: Date): string {
  return format(date, 'd בMMMM, HH:mm', { locale: he });
}

/**
 * Format a date for input fields (ISO format)
 * Example: "2024-12-15"
 */
export function formatDateForInput(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get the Hebrew day name
 * Example: "יום שני"
 */
export function getHebrewDayName(date: Date): string {
  return format(date, 'EEEE', { locale: he });
}

/**
 * Get the Hebrew month name
 * Example: "דצמבר"
 */
export function getHebrewMonthName(date: Date): string {
  return format(date, 'MMMM', { locale: he });
}
