/**
 * User Detection for SemesterHub
 *
 * Extracts Moodle user information from the DOM.
 * Works on any Moodle page where the user is logged in.
 */

import type { MoodleUser } from '../shared/types';

// ========================================
// Selectors for User Detection
// ========================================

// data-userid attribute locations (priority order)
const USER_ID_SELECTORS = [
  '[data-userid]',                           // Generic - many elements have this
  '.popover-region-notifications[data-userid]', // Notifications dropdown
  '#nav-notification-popover-container[data-userid]', // Notification container
  '.usermenu [data-userid]',                  // User menu area
];

// User display name locations
const DISPLAY_NAME_SELECTORS = [
  '.userinitials[title]',                    // User initials with title
  '.usertext',                               // User text display
  '.userfullname',                           // Full user name
  '#user-menu-toggle .userbutton [title]',   // User button title
];

// ========================================
// User Detection
// ========================================

/**
 * Detect the current Moodle user from DOM elements
 * @returns MoodleUser object or null if not found/not logged in
 */
export function detectMoodleUser(): MoodleUser | null {
  const moodleUserId = extractUserId();
  if (!moodleUserId) {
    console.log('[SemesterHub] No user ID found - user might not be logged in');
    return null;
  }

  const universityDomain = extractDomain();
  const displayName = extractDisplayName();

  const user: MoodleUser = {
    moodleUserId,
    universityDomain,
    displayName: displayName || undefined,
  };

  console.log('[SemesterHub] Detected user:', user);
  return user;
}

// ========================================
// Extraction Functions
// ========================================

/**
 * Extract user ID from data-userid attribute
 */
function extractUserId(): string | null {
  for (const selector of USER_ID_SELECTORS) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) {
      const userId = element.getAttribute('data-userid');
      if (userId && userId !== '0' && userId !== '') {
        console.debug(`[SemesterHub] Found user ID via ${selector}: ${userId}`);
        return userId;
      }
    }
  }

  // Fallback: search any element with data-userid
  const anyElement = document.querySelector<HTMLElement>('[data-userid]');
  if (anyElement) {
    const userId = anyElement.getAttribute('data-userid');
    if (userId && userId !== '0' && userId !== '') {
      console.debug(`[SemesterHub] Found user ID via fallback: ${userId}`);
      return userId;
    }
  }

  return null;
}

/**
 * Extract university domain from current URL
 */
function extractDomain(): string {
  return window.location.hostname;
}

/**
 * Extract user display name from DOM
 */
function extractDisplayName(): string | null {
  for (const selector of DISPLAY_NAME_SELECTORS) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) {
      // Try title attribute first (more reliable)
      const title = element.getAttribute('title');
      if (title && title.trim()) {
        console.debug(`[SemesterHub] Found display name via ${selector} title: ${title}`);
        return title.trim();
      }

      // Fall back to text content
      const text = element.textContent;
      if (text && text.trim()) {
        console.debug(`[SemesterHub] Found display name via ${selector} text: ${text}`);
        return text.trim();
      }
    }
  }

  // Try aria-label on user menu toggle
  const userMenuToggle = document.querySelector<HTMLElement>('#user-menu-toggle');
  if (userMenuToggle) {
    const ariaLabel = userMenuToggle.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.includes('User menu')) {
      // Extract name from "User menu for Name" pattern
      const match = ariaLabel.match(/User menu for (.+)/);
      if (match) {
        console.debug(`[SemesterHub] Found display name via aria-label: ${match[1]}`);
        return match[1];
      }
    }
  }

  return null;
}

// ========================================
// Utility Functions
// ========================================

/**
 * Check if a user is currently logged in
 * (Quick check without extracting full user data)
 */
export function isUserLoggedIn(): boolean {
  // Check for login page indicators
  const isLoginPage = window.location.pathname.includes('/login/');
  if (isLoginPage) return false;

  // Check for user ID in DOM
  const userId = extractUserId();
  return userId !== null;
}

/**
 * Wait for user data to be available in DOM
 * Useful for dynamically loaded content
 * @param timeoutMs - Maximum time to wait
 * @returns MoodleUser or null if timeout
 */
export async function waitForUser(timeoutMs: number = 5000): Promise<MoodleUser | null> {
  const startTime = Date.now();
  const pollInterval = 100;

  while (Date.now() - startTime < timeoutMs) {
    const user = detectMoodleUser();
    if (user) return user;

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  console.warn('[SemesterHub] Timeout waiting for user data');
  return null;
}
