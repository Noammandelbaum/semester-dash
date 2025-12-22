/**
 * Main App Controller for SemesterHub
 *
 * Entry point for the embedded application:
 * - Detects Moodle user
 * - Injects tab and UI
 * - Manages app state
 * - Orchestrates navigation
 */

import * as storage from '../services/local-storage.service';
import * as sync from '../services/sync.service';
import { detectMoodleUser } from '../content/user-detector';
import { injectTab, setTabActive } from '../content/tab-injector';
import {
  initUI,
  navigate,
  getCurrentView,
  showContentArea,
  hideContentArea,
  setAvailableCourses,
  setCurrentSemester as setUISemester,
} from '../ui';
import { handleError, injectToastStyles, showInfoToast } from './error-handler';
import type { MoodleUser, SemesterData, ScrapedCourse } from '../shared/types';

// ========================================
// State
// ========================================

let currentUser: MoodleUser | null = null;
let isAppReady = false;

// ========================================
// Initialization
// ========================================

/**
 * Initialize the SemesterHub application
 * Called from content-script.ts on Moodle pages
 */
export async function initApp(): Promise<void> {
  console.log('[SemesterHub App] Initializing...');

  try {
    // 0. Inject toast styles for error display
    injectToastStyles();

    // 1. Inject the SemesterHub tab FIRST (always visible)
    injectTab();

    // 2. Initialize UI system (loads data from storage)
    await initUI();

    // 3. Detect Moodle user
    const user = detectMoodleUser();
    if (!user) {
      console.warn('[SemesterHub App] Not logged in to Moodle - tab injected but limited functionality');
      // Tab is visible, but user will need to log in to use full features
      return;
    }
    currentUser = user;
    console.log('[SemesterHub App] User detected:', user.displayName || user.moodleUserId);

    // 4. Store user locally
    await storage.setCurrentUser(user);

    // 5. Load existing data
    const semester = await storage.getCurrentSemester();
    if (semester) {
      setUISemester(semester);
      console.log('[SemesterHub App] Loaded semester:', semester.name);
    }

    // 6. Listen for tab clicks
    setupTabClickListener();

    // 7. Background sync if we have data
    if (semester && user) {
      performBackgroundSync(user, semester);
    }

    isAppReady = true;
    console.log('[SemesterHub App] Initialization complete');
    console.log('[SemesterHub App] Has existing data:', !!semester);

  } catch (error) {
    handleError(error as Error, {
      context: 'App initialization',
      user: currentUser,
    });
  }
}

// ========================================
// Tab Click Handler
// ========================================

/**
 * Setup listener for SemesterHub tab click
 */
function setupTabClickListener(): void {
  // Listen for our custom tab click event
  document.addEventListener('semesterhub-tab-clicked', async () => {
    console.log('[SemesterHub App] Tab clicked');

    // Show our content area
    showContentArea();
    setTabActive(true);

    // Always check for latest data from storage
    const semester = await storage.getCurrentSemester();

    if (!semester) {
      // No semester data - start onboarding
      console.log('[SemesterHub App] No semester data found, starting onboarding');
      navigate('onboarding');
    } else {
      // Has semester data - show dashboard
      console.log('[SemesterHub App] Loaded semester from storage:', semester.name);
      setUISemester(semester);
      navigate('dashboard');
    }
  });
}

// ========================================
// Background Sync
// ========================================

/**
 * Perform background sync (non-blocking)
 */
function performBackgroundSync(user: MoodleUser, semester: SemesterData): void {
  console.log('[SemesterHub App] Starting background sync...');

  sync.fullSync(user, semester)
    .then((result) => {
      if (result.success) {
        console.log('[SemesterHub App] Background sync complete');
      } else {
        console.warn('[SemesterHub App] Background sync failed:', result.error);
      }
    })
    .catch((error) => {
      // Don't show error toast for background sync
      console.warn('[SemesterHub App] Background sync error:', error);
    });
}

// ========================================
// Public API
// ========================================

/**
 * Get current Moodle user
 */
export function getCurrentUser(): MoodleUser | null {
  return currentUser;
}

/**
 * Check if app is ready
 */
export function isReady(): boolean {
  return isAppReady;
}

/**
 * Trigger a sync operation
 */
export async function triggerSync(): Promise<boolean> {
  if (!currentUser) {
    console.warn('[SemesterHub App] Cannot sync: no user');
    return false;
  }

  const semester = await storage.getCurrentSemester();
  if (!semester) {
    console.warn('[SemesterHub App] Cannot sync: no semester');
    return false;
  }

  try {
    const result = await sync.fullSync(currentUser, semester);
    if (result.success) {
      showInfoToast('הסנכרון הושלם בהצלחה');
      return true;
    }
    return false;
  } catch (error) {
    handleError(error as Error, {
      context: 'Manual sync',
      user: currentUser,
    });
    return false;
  }
}

/**
 * Update semester data and sync
 */
export async function updateSemester(semester: SemesterData): Promise<void> {
  await storage.setCurrentSemester(semester);
  setUISemester(semester);

  if (currentUser) {
    // Sync in background
    sync.fullSync(currentUser, semester).catch(console.error);
  }
}

/**
 * Set available courses for onboarding
 */
export function setScrapedCourses(courses: ScrapedCourse[]): void {
  setAvailableCourses(courses);
}

/**
 * Clear all data and reset app
 */
export async function resetApp(): Promise<void> {
  await storage.clearAllData();
  currentUser = null;
  navigate('onboarding');
}

// ========================================
// Exports
// ========================================

export {
  storage,
  sync,
};
