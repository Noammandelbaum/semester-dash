/**
 * Error Handler for SemesterHub
 *
 * Centralized error handling with:
 * - Console logging
 * - Analytics tracking
 * - User-friendly error messages
 */

import { trackEvent } from '../services/sync.service';
import type { MoodleUser } from '../shared/types';

// ========================================
// Types
// ========================================

interface ErrorContext {
  context: string;
  user?: MoodleUser | null;
  data?: Record<string, unknown>;
}

// ========================================
// Error Messages
// ========================================

const ERROR_MESSAGES: Record<string, string> = {
  network: 'בעיית חיבור לשרת. נסה שוב.',
  not_found: 'לא נמצאו נתונים. נסה לסנכרן מחדש.',
  timeout: 'הפעולה לקחה יותר מדי זמן. נסה שוב.',
  storage: 'שגיאה בשמירת הנתונים. נסה שוב.',
  scrape: 'לא הצלחנו לקרוא נתונים מהעמוד. נסה לרענן.',
  auth: 'יש להתחבר למודל כדי להמשיך.',
  sync: 'שגיאה בסנכרון. הנתונים נשמרו מקומית.',
  unknown: 'משהו השתבש. נסה שוב.',
};

// ========================================
// Error Classification
// ========================================

/**
 * Classify error type from error message or name
 */
function classifyError(error: Error): string {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  if (message.includes('network') || message.includes('fetch') || name === 'typeerror') {
    return 'network';
  }
  if (message.includes('not found') || message.includes('404')) {
    return 'not_found';
  }
  if (message.includes('timeout') || message.includes('aborted')) {
    return 'timeout';
  }
  if (message.includes('storage') || message.includes('quota')) {
    return 'storage';
  }
  if (message.includes('scrape') || message.includes('selector')) {
    return 'scrape';
  }
  if (message.includes('auth') || message.includes('login') || message.includes('not logged in')) {
    return 'auth';
  }
  if (message.includes('sync')) {
    return 'sync';
  }

  return 'unknown';
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: Error): string {
  const errorType = classifyError(error);
  return ERROR_MESSAGES[errorType] || ERROR_MESSAGES.unknown;
}

// ========================================
// Main Error Handler
// ========================================

/**
 * Handle an error with logging and analytics
 *
 * @param error - The error to handle
 * @param errorContext - Context information
 */
export function handleError(error: Error, errorContext: ErrorContext): void {
  const { context, user, data } = errorContext;

  // Log to console
  console.error(`[SemesterHub] ${context}:`, error);

  // Track error in analytics (fire and forget)
  trackEvent('error', user || undefined, {
    context,
    errorType: classifyError(error),
    message: error.message,
    stack: error.stack?.substring(0, 500),
    ...data,
  }).catch(() => {
    // Silently fail analytics tracking
  });
}

/**
 * Handle error and return user-friendly message
 *
 * @param error - The error to handle
 * @param context - Context string for logging
 * @param user - Optional user for analytics
 * @returns User-friendly error message in Hebrew
 */
export function handleErrorWithMessage(
  error: Error,
  context: string,
  user?: MoodleUser | null
): string {
  handleError(error, { context, user });
  return getErrorMessage(error);
}

// ========================================
// Error Toast Display
// ========================================

// Toast container reference
let toastContainer: HTMLDivElement | null = null;

/**
 * Get or create toast container
 */
function getToastContainer(): HTMLDivElement {
  if (toastContainer && document.contains(toastContainer)) {
    return toastContainer;
  }

  toastContainer = document.createElement('div');
  toastContainer.id = 'semesterhub-toast-container';
  toastContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10001;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  `;

  document.body.appendChild(toastContainer);
  return toastContainer;
}

/**
 * Show a toast notification
 */
function showToast(message: string, type: 'error' | 'success' | 'info' = 'error'): void {
  const container = getToastContainer();

  const toast = document.createElement('div');
  toast.className = `sh-toast sh-toast-${type}`;
  toast.style.cssText = `
    background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-family: system-ui, -apple-system, sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    pointer-events: auto;
    animation: sh-toast-in 0.3s ease;
    direction: rtl;
  `;
  toast.textContent = message;

  container.appendChild(toast);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    toast.style.animation = 'sh-toast-out 0.3s ease';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 5000);
}

/**
 * Show error toast to user
 */
export function showErrorToast(message: string): void {
  showToast(message, 'error');
}

/**
 * Show success toast to user
 */
export function showSuccessToast(message: string): void {
  showToast(message, 'success');
}

/**
 * Show info toast to user
 */
export function showInfoToast(message: string): void {
  showToast(message, 'info');
}

// ========================================
// Wrap Async Functions
// ========================================

/**
 * Wrap an async function with error handling
 *
 * @param fn - Async function to wrap
 * @param context - Context for error logging
 * @param user - Optional user for analytics
 * @returns Wrapped function that catches errors
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context: string,
  user?: MoodleUser | null
): (...args: T) => Promise<R | undefined> {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error as Error, { context, user });
      showErrorToast(getErrorMessage(error as Error));
      return undefined;
    }
  };
}

// ========================================
// Inject Toast Styles
// ========================================

/**
 * Inject toast animation styles into page
 */
export function injectToastStyles(): void {
  if (document.getElementById('semesterhub-toast-styles')) return;

  const style = document.createElement('style');
  style.id = 'semesterhub-toast-styles';
  style.textContent = `
    @keyframes sh-toast-in {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes sh-toast-out {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(20px);
      }
    }
  `;

  document.head.appendChild(style);
}
