/**
 * SemesterHub UI Entry Point
 *
 * Initializes the embedded UI in Moodle pages:
 * - Injects the content container
 * - Sets up event listeners for tab switching
 * - Initializes the router
 */

import {
  injectContentArea,
  showContentArea,
  hideContentArea,
  isContentAreaVisible,
  getContentContainer,
  setContentAreaContent,
  showLoading,
  showError,
} from '../content/content-injector';
import {
  navigate,
  getCurrentView,
  onViewChange,
  goToDashboard,
  goToSettings,
  goToOnboarding,
} from './router';
import { setTabActive } from '../content/tab-injector';
import { scrapeCourses } from '../content/scrapers/courses';
import { detectUniversity } from '../shared/config';
import type { ViewName, SemesterData, ScrapedCourse, CourseWithMeta, UserSettings } from '../shared/types';
import { DEFAULT_USER_SETTINGS } from '../shared/types';

// Import views
import { renderOnboarding, resetOnboarding } from './views/onboarding/index';
import { renderDashboard, resetDashboard } from './views/dashboard/index';
import { renderSettings, resetSettings } from './views/settings/index';
import { createSpinner } from './components/Spinner';

// Import storage service
import * as storage from '../services/local-storage.service';

// Import styles (will be bundled by build tool)
import './styles/base.css';
import './styles/components.css';
import './styles/views.css';

// ========================================
// Constants
// ========================================

const TAB_EVENT = 'semesterhub-tab-clicked';
const NAV_SELECTOR = 'ul.nav.more-nav.navbar-nav';
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ========================================
// State
// ========================================

let isInitialized = false;
let cleanupFunctions: (() => void)[] = [];

// Application state (will be persisted to chrome.storage in Wave 6)
let currentSemester: SemesterData | null = null;
let userSettings: UserSettings = { ...DEFAULT_USER_SETTINGS };
let availableCourses: ScrapedCourse[] = [];

// ========================================
// View Rendering
// ========================================

/**
 * Render a view to the content container
 */
function renderView(view: ViewName): void {
  const container = getContentContainer();
  if (!container) return;

  // Clear container
  container.innerHTML = '';

  switch (view) {
    case 'loading':
      container.appendChild(createSpinner({ message: 'טוען נתונים...' }));
      break;

    case 'onboarding':
      // Scrape courses - try current page first, then background tab if needed
      if (availableCourses.length === 0) {
        console.log('[SemesterHub UI] Scraping courses for onboarding...');
        const config = detectUniversity(window.location.href);
        if (config) {
          let scrapedCourses = scrapeCourses(config);
          console.log(`[SemesterHub UI] Found ${scrapedCourses.length} courses on current page`);

          // If no courses found, try fetching from dashboard via background tab
          if (scrapedCourses.length === 0) {
            console.log('[SemesterHub UI] No courses on current page, fetching from dashboard...');
            // Show loading while fetching
            container.appendChild(createSpinner({ message: 'טוען קורסים...' }));

            // Fetch courses from dashboard in background
            fetchCoursesFromDashboard().then((courses) => {
              availableCourses = courses;
              console.log(`[SemesterHub UI] Fetched ${courses.length} courses from dashboard`);
              renderOnboarding(container, {
                availableCourses,
                onComplete: handleOnboardingComplete,
                fetchSections: fetchSectionsForCourses,
              });
            }).catch((error) => {
              console.error('[SemesterHub UI] Failed to fetch courses:', error);
              renderOnboarding(container, {
                availableCourses: [],
                onComplete: handleOnboardingComplete,
                fetchSections: fetchSectionsForCourses,
              });
            });
            return; // Don't render onboarding yet, wait for courses
          }

          availableCourses = scrapedCourses;
        } else {
          console.warn('[SemesterHub UI] Could not detect university config');
        }
      }

      renderOnboarding(container, {
        availableCourses,
        onComplete: handleOnboardingComplete,
        fetchSections: fetchSectionsForCourses,
      });
      break;

    case 'dashboard':
      if (currentSemester) {
        renderDashboard(container, {
          semester: currentSemester,
          onSync: handleSync,
          onEditCourse: handleEditCourse,
          onSettings: () => navigate('settings'),
        });
      } else {
        // No semester data - go to onboarding
        navigate('onboarding');
      }
      break;

    case 'settings':
      renderSettings(container, {
        settings: userSettings,
        onSave: handleSaveSettings,
        onClearData: handleClearData,
        onBack: () => navigate('dashboard'),
        extensionVersion: '1.0.0',
      });
      break;
  }
}

// ========================================
// Data Handlers (Will be connected to storage in Wave 6)
// ========================================

/**
 * Handle onboarding completion
 */
async function handleOnboardingComplete(semester: SemesterData): Promise<void> {
  console.log('[SemesterHub UI] Onboarding complete, syncing assignments...', semester);

  // Save semester first (without assignments)
  currentSemester = semester;
  await storage.setCurrentSemester(semester);
  console.log('[SemesterHub UI] Semester saved to storage');

  // Now sync assignments in background
  try {
    const url = new URL(window.location.href);
    const moodleUrl = `${url.protocol}//${url.host}`;

    // Prepare courses for sync
    const coursesForSync = semester.courses.map((c) => ({
      moodleId: c.moodleId,
      name: c.name,
      url: c.url || '',
      selectedSections: c.sections, // sections selected during onboarding
    }));

    console.log('[SemesterHub UI] Syncing assignments for', coursesForSync.length, 'courses');

    // Call background to scrape assignments
    const response = await chrome.runtime.sendMessage({
      type: 'SYNC_ASSIGNMENTS_LOCAL',
      payload: {
        courses: coursesForSync,
        moodleUrl,
      },
    });

    if (response?.success && response.assignments?.length > 0) {
      console.log(`[SemesterHub UI] Synced ${response.assignments.length} assignments`);

      // Update semester with assignments
      currentSemester = {
        ...semester,
        assignments: response.assignments,
        lastSyncedAt: new Date().toISOString(),
      };

      await storage.setCurrentSemester(currentSemester);
      console.log('[SemesterHub UI] Assignments saved to storage');
    } else {
      console.warn('[SemesterHub UI] No assignments found during initial sync');
    }
  } catch (error) {
    console.error('[SemesterHub UI] Failed to sync assignments:', error);
    // Continue to dashboard anyway - user can sync manually later
  }

  navigate('dashboard');
}

/**
 * Get the "My Courses" page URL
 * Uses /my/courses.php which is the standard Moodle URL for enrolled courses
 */
function getMyCoursesUrl(): string {
  const url = new URL(window.location.href);
  const myCoursesUrl = `${url.protocol}//${url.host}/my/courses.php`;
  console.log('[SemesterHub UI] Using My Courses URL:', myCoursesUrl);
  return myCoursesUrl;
}

/**
 * Fetch courses from "My Courses" page via background tab
 */
async function fetchCoursesFromDashboard(): Promise<ScrapedCourse[]> {
  console.log('[SemesterHub UI] Fetching courses from My Courses page...');

  try {
    const dashboardUrl = getMyCoursesUrl();

    // Send message to background script to fetch courses
    const response = await chrome.runtime.sendMessage({
      type: 'FETCH_COURSES_FROM_DASHBOARD',
      payload: { dashboardUrl },
    });

    if (response && response.courses && Array.isArray(response.courses)) {
      console.log('[SemesterHub UI] Got courses from background:', response.courses.length);
      return response.courses;
    }

    console.warn('[SemesterHub UI] Invalid response from background:', response);
    return [];
  } catch (error) {
    console.error('[SemesterHub UI] Error fetching courses from dashboard:', error);
    return [];
  }
}

/**
 * Fetch sections for selected courses
 * Uses message passing to background script which opens tabs and scrapes sections
 */
async function fetchSectionsForCourses(
  courses: ScrapedCourse[]
): Promise<Record<string, string[]>> {
  console.log('[SemesterHub UI] Fetching sections for', courses.length, 'courses');

  try {
    // Get Moodle base URL from current page
    const url = new URL(window.location.href);
    const moodleUrl = `${url.protocol}//${url.host}`;

    // Send message to background script to fetch sections
    const response = await chrome.runtime.sendMessage({
      type: 'FETCH_SECTIONS_FOR_COURSES',
      payload: {
        courses: courses.map((c) => ({ moodleId: c.moodleId })),
        moodleUrl,
      },
    });

    if (response && typeof response === 'object' && !('error' in response)) {
      console.log('[SemesterHub UI] Got sections:', response);
      return response as Record<string, string[]>;
    }

    console.warn('[SemesterHub UI] Failed to fetch sections:', response);
    // Fallback: return empty sections
    const fallback: Record<string, string[]> = {};
    courses.forEach((course) => {
      fallback[course.moodleId] = [];
    });
    return fallback;
  } catch (error) {
    console.error('[SemesterHub UI] Error fetching sections:', error);
    // Fallback: return empty sections
    const fallback: Record<string, string[]> = {};
    courses.forEach((course) => {
      fallback[course.moodleId] = [];
    });
    return fallback;
  }
}

/**
 * Handle sync button click
 */
async function handleSync(): Promise<void> {
  console.log('[SemesterHub UI] Manual sync requested');

  if (!currentSemester) {
    console.warn('[SemesterHub UI] No semester data to sync');
    return;
  }

  try {
    const url = new URL(window.location.href);
    const moodleUrl = `${url.protocol}//${url.host}`;

    // Prepare courses for sync
    const coursesForSync = currentSemester.courses.map((c) => ({
      moodleId: c.moodleId,
      name: c.name,
      url: c.url,
      selectedSections: c.sections,
    }));

    console.log(`[SemesterHub UI] Syncing ${coursesForSync.length} courses from ${moodleUrl}`);

    // Call background to scrape assignments
    const response = await chrome.runtime.sendMessage({
      type: 'SYNC_ASSIGNMENTS_LOCAL',
      payload: {
        courses: coursesForSync,
        moodleUrl,
      },
    });

    if (response?.success) {
      console.log(
        `[SemesterHub UI] Synced ${response.assignments?.length || 0} assignments`
      );

      // Update semester with new assignments
      currentSemester = {
        ...currentSemester,
        assignments: response.assignments || [],
        lastSyncedAt: new Date().toISOString(),
      };

      await storage.setCurrentSemester(currentSemester);
      console.log('[SemesterHub UI] Semester updated with synced assignments');
      // Note: Reactive UI will auto-update dashboard
    } else {
      console.error('[SemesterHub UI] Sync failed:', response?.error);
      // Could show error toast here
    }
  } catch (error) {
    console.error('[SemesterHub UI] Sync error:', error);
  }
}

/**
 * Handle course edit
 */
async function handleEditCourse(
  course: CourseWithMeta,
  updates: Partial<CourseWithMeta>
): Promise<void> {
  console.log('[SemesterHub UI] Course edit:', course.moodleId, updates);
  if (!currentSemester) return;

  // Update course in semester data
  const courseIndex = currentSemester.courses.findIndex(
    (c) => c.moodleId === course.moodleId
  );
  if (courseIndex >= 0) {
    currentSemester.courses[courseIndex] = {
      ...currentSemester.courses[courseIndex],
      ...updates,
    };

    // Save to storage
    await storage.updateCourse(course.moodleId, updates);
    console.log('[SemesterHub UI] Course edit saved to storage');

    // Re-render
    navigate('dashboard');
  }
}

/**
 * Handle settings save
 */
async function handleSaveSettings(settings: UserSettings): Promise<void> {
  console.log('[SemesterHub UI] Settings saved:', settings);
  userSettings = settings;

  // Save to storage
  await storage.updateSettings(settings);
  console.log('[SemesterHub UI] Settings saved to storage');

  navigate('dashboard');
}

/**
 * Handle clear data
 */
async function handleClearData(): Promise<void> {
  console.log('[SemesterHub UI] Clearing all data');
  currentSemester = null;
  userSettings = { ...DEFAULT_USER_SETTINGS };
  availableCourses = [];
  resetOnboarding();
  resetDashboard();
  resetSettings();

  // Clear storage
  await storage.clearAllData();
  console.log('[SemesterHub UI] All data cleared from storage');

  navigate('onboarding');
}

/**
 * Set available courses (called by scraper)
 */
export function setAvailableCourses(courses: ScrapedCourse[]): void {
  availableCourses = courses;
}

/**
 * Set current semester data (called on load from storage)
 */
export function setCurrentSemester(semester: SemesterData | null): void {
  currentSemester = semester;
}

/**
 * Get current semester data
 */
export function getCurrentSemester(): SemesterData | null {
  return currentSemester;
}

// ========================================
// Auto-Sync Functions
// ========================================

/**
 * Check if auto-sync should be triggered
 * Returns true if:
 * - Semester exists
 * - No lastSyncedAt OR more than 5 minutes since last sync
 */
function shouldAutoSync(semester: SemesterData | null): boolean {
  if (!semester) return false;
  if (!semester.lastSyncedAt) return true;

  const lastSync = new Date(semester.lastSyncedAt).getTime();
  const now = Date.now();

  return (now - lastSync) > SYNC_INTERVAL_MS;
}

/**
 * Trigger background sync (fire-and-forget)
 * Does not block UI - runs in background and updates storage when complete
 */
async function triggerBackgroundSync(): Promise<void> {
  if (!currentSemester || !shouldAutoSync(currentSemester)) {
    return;
  }

  console.log('[SemesterHub UI] Triggering background sync...');

  try {
    const url = new URL(window.location.href);
    const moodleUrl = `${url.protocol}//${url.host}`;

    const coursesForSync = currentSemester.courses.map(c => ({
      moodleId: c.moodleId,
      name: c.name,
      url: c.url || '',
      selectedSections: c.sections,
    }));

    // Fire and don't wait - let it run in background
    chrome.runtime.sendMessage({
      type: 'SYNC_ASSIGNMENTS_LOCAL',
      payload: {
        courses: coursesForSync,
        moodleUrl,
      },
    }).then(response => {
      if (response?.success && response.assignments) {
        console.log(`[SemesterHub UI] Background sync complete: ${response.assignments.length} assignments`);

        // Update storage - reactive UI will handle re-render
        const updatedSemester = {
          ...currentSemester!,
          assignments: response.assignments,
          lastSyncedAt: new Date().toISOString(),
        };

        storage.setCurrentSemester(updatedSemester);
      }
    }).catch(err => {
      console.warn('[SemesterHub UI] Background sync failed:', err);
    });
  } catch (error) {
    console.warn('[SemesterHub UI] Background sync error:', error);
  }
}

// ========================================
// Event Handlers
// ========================================

/**
 * Handle SemesterHub tab click
 */
function handleTabClick(): void {
  console.log('[SemesterHub UI] Tab clicked');

  showContentArea();
  setTabActive(true);

  // Navigate to appropriate view
  const currentView = getCurrentView();
  if (currentView === 'loading') {
    // First time - check storage for existing data
    if (currentSemester) {
      navigate('dashboard');
      // Trigger background sync (non-blocking)
      triggerBackgroundSync();
    } else {
      navigate('onboarding');
    }
  } else if (currentView === 'dashboard') {
    // Already on dashboard - trigger background sync if needed
    triggerBackgroundSync();
  }
}

/**
 * Handle other Moodle tab clicks (restore Moodle)
 */
function handleOtherTabClick(): void {
  if (!isContentAreaVisible()) return;

  console.log('[SemesterHub UI] Other tab clicked, restoring Moodle');
  hideContentArea();
  setTabActive(false);
}

/**
 * Setup navigation between internal views via custom events
 */
function setupInternalNavigation(): void {
  const handleGoSettings = () => goToSettings();
  const handleGoDashboard = () => goToDashboard();

  window.addEventListener('sh-go-settings', handleGoSettings);
  window.addEventListener('sh-go-dashboard', handleGoDashboard);

  cleanupFunctions.push(() => {
    window.removeEventListener('sh-go-settings', handleGoSettings);
    window.removeEventListener('sh-go-dashboard', handleGoDashboard);
  });
}

// ========================================
// Initialization
// ========================================

/**
 * Initialize the SemesterHub UI
 * Called from content-script.ts on Moodle pages
 */
export async function initUI(): Promise<void> {
  if (isInitialized) {
    console.log('[SemesterHub UI] Already initialized');
    return;
  }

  console.log('[SemesterHub UI] Initializing...');

  // Load data from storage first
  try {
    const storageData = await storage.getData();
    currentSemester = storageData.currentSemester;
    userSettings = storageData.settings;
    console.log('[SemesterHub UI] Loaded data from storage:', {
      hasSemester: !!currentSemester,
      semesterName: currentSemester?.name,
      settings: userSettings,
    });
  } catch (error) {
    console.error('[SemesterHub UI] Error loading data from storage:', error);
    // Continue with default values
  }

  // Inject content container
  const container = injectContentArea();
  if (!container) {
    console.error('[SemesterHub UI] Failed to inject content area');
    return;
  }

  // Subscribe to view changes
  const unsubscribeViewChange = onViewChange((view) => {
    renderView(view);
  });
  cleanupFunctions.push(unsubscribeViewChange);

  // Listen to our tab click
  const tabClickHandler = () => handleTabClick();
  document.addEventListener(TAB_EVENT, tabClickHandler);
  cleanupFunctions.push(() => document.removeEventListener(TAB_EVENT, tabClickHandler));

  // Listen to other tab clicks (to restore Moodle)
  const navBar = document.querySelector(NAV_SELECTOR);
  if (navBar) {
    const otherTabClickHandler = (event: Event) => {
      const target = event.target as HTMLElement;
      const tabLink = target.closest('a.nav-link:not(.semesterhub-tab)');
      if (tabLink) {
        handleOtherTabClick();
      }
    };
    navBar.addEventListener('click', otherTabClickHandler);
    cleanupFunctions.push(() => navBar.removeEventListener('click', otherTabClickHandler));
  }

  // Setup internal navigation
  setupInternalNavigation();

  // Subscribe to storage changes for reactive UI
  const unsubscribeStorage = storage.onDataChange((newData) => {
    console.log('[SemesterHub UI] Storage changed, updating UI...');

    // Update local state
    if (newData.currentSemester !== undefined) {
      currentSemester = newData.currentSemester;
    }
    if (newData.settings !== undefined) {
      userSettings = newData.settings;
    }

    // Re-render current view if on dashboard and SemesterHub is visible
    const currentView = getCurrentView();
    if (currentView === 'dashboard' && isContentAreaVisible()) {
      console.log('[SemesterHub UI] Re-rendering dashboard with updated data');
      renderView('dashboard');
    }
  });
  cleanupFunctions.push(unsubscribeStorage);

  // Initial render (loading state, hidden until tab clicked)
  renderView('loading');

  isInitialized = true;
  console.log('[SemesterHub UI] Initialized successfully');
}

/**
 * Cleanup the UI (for testing or page unload)
 */
export function cleanupUI(): void {
  cleanupFunctions.forEach((fn) => fn());
  cleanupFunctions = [];
  isInitialized = false;
  console.log('[SemesterHub UI] Cleaned up');
}

// ========================================
// Exports
// ========================================

export {
  // Router
  navigate,
  getCurrentView,
  onViewChange,
  goToDashboard,
  goToSettings,
  goToOnboarding,
  // Content injector
  showLoading,
  showError,
  getContentContainer,
  setContentAreaContent,
  isContentAreaVisible,
  showContentArea,
  hideContentArea,
};

// Re-export views
export { renderOnboarding, resetOnboarding } from './views/onboarding/index';
export { renderDashboard, updateDashboard, resetDashboard } from './views/dashboard/index';
export { renderSettings, resetSettings } from './views/settings/index';

// Re-export components
export * from './components/index';
