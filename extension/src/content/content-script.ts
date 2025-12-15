/**
 * Content Script for SemesterHub Browser Extension
 *
 * This script runs on Moodle pages and handles:
 * - Page detection (dashboard, course, etc.)
 * - Course and assignment scraping
 * - Communication with background service worker and popup
 */

import type {
  ExtensionMessage,
  PageInfo,
  ScrapedCourse,
  ScrapedAssignment,
  UniversityId,
  MoodleVersion,
} from '../shared/types';
import { detectUniversity, detectMoodleVersion, UNIVERSITIES } from '../shared/config';
import { detectMoodleVersionFromPage } from '../shared/selectors';
import { scrapeCourses } from './scrapers/courses';
import { scrapeAssignments } from './scrapers/assignments';
import { isAssignmentIndexPage, scrapeAssignmentIndex, scrapeCourseSections, getCourseIdFromUrl as getAssignmentIndexCourseId } from './scrapers/assignment-index';

// ========================================
// Initialization
// ========================================

/**
 * Initialize content script on Moodle pages
 */
function initialize(): void {
  console.log('[SemesterHub] Content script loaded on:', window.location.href);

  // Always listen for messages, even if not a Moodle page
  // This way we can always respond with accurate page info
  chrome.runtime.onMessage.addListener(
    (message: ExtensionMessage, _sender, sendResponse) => {
      handleMessage(message)
        .then(sendResponse)
        .catch((error) => {
          console.error('[SemesterHub] Content script error:', error);
          sendResponse({ error: error.message });
        });

      return true; // Async response
    }
  );

  // Log page detection results for debugging
  const isMoodle = isMoodlePage();
  console.log('[SemesterHub] Is Moodle page:', isMoodle);

  if (isMoodle) {
    const university = detectUniversity(window.location.href);
    if (university) {
      console.log(`[SemesterHub] Detected university: ${university.name}`);
    }
    sendProgressUpdate('Content script ready');

    // Start login monitoring on Moodle pages
    monitorLoginStatus();
  }
}

// ========================================
// Message Handling
// ========================================

/**
 * Handle incoming messages from popup or background
 */
async function handleMessage(message: ExtensionMessage): Promise<unknown> {
  console.debug('[SemesterHub] Received message:', message.type);

  switch (message.type) {
    case 'GET_PAGE_INFO':
      return getPageInfo();

    case 'SCRAPE_COURSES':
      return handleScrapeCourses();

    case 'SCRAPE_ASSIGNMENTS':
      return handleScrapeAssignments(message.payload as { courseMoodleId?: string } | undefined);

    case 'SCRAPE_ALL':
      return handleScrapeAll();

    case 'GET_COURSE_SECTIONS':
      return handleGetCourseSections(message.payload as { courseMoodleId?: string } | undefined);

    case 'CHECK_MOODLE_LOGIN':
      return checkMoodleLoginStatus();

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

/**
 * Handle SCRAPE_COURSES message
 */
async function handleScrapeCourses(): Promise<{ courses: ScrapedCourse[] }> {
  sendProgressUpdate('Searching for courses...');

  const config = getUniversityConfig();
  if (!config) {
    console.warn('[SemesterHub] No university config found');
    return { courses: [] };
  }

  const courses = scrapeCourses(config);

  sendProgressUpdate(`Found ${courses.length} courses`);
  return { courses };
}

/**
 * Handle SCRAPE_ASSIGNMENTS message
 */
async function handleScrapeAssignments(
  payload?: { courseMoodleId?: string; filterSections?: string[] }
): Promise<{ assignments: ScrapedAssignment[] }> {
  sendProgressUpdate('Searching for assignments...');

  // Check if we're on the assignment index page (/mod/assign/index.php)
  if (isAssignmentIndexPage()) {
    console.log('[SemesterHub] On assignment index page, using optimized scraper');
    const courseMoodleId = payload?.courseMoodleId || getAssignmentIndexCourseId();
    if (!courseMoodleId) {
      console.warn('[SemesterHub] No course ID found in assignment index URL');
      return { assignments: [] };
    }

    // Pass filterSections to scraper
    const filterSections = payload?.filterSections;
    if (filterSections && filterSections.length > 0) {
      console.log('[SemesterHub] Filtering by sections:', filterSections);
    }

    const assignments = scrapeAssignmentIndex(courseMoodleId, filterSections);
    sendProgressUpdate(`Found ${assignments.length} assignments`);
    return { assignments };
  }

  // Fallback to original scraper for course pages
  const config = getUniversityConfig();
  if (!config) {
    console.warn('[SemesterHub] No university config found');
    return { assignments: [] };
  }

  // Get course ID from payload or current page
  const courseMoodleId = payload?.courseMoodleId || getCurrentCourseId();
  if (!courseMoodleId) {
    console.warn('[SemesterHub] No course ID found');
    return { assignments: [] };
  }

  const assignments = scrapeAssignments(config, courseMoodleId);

  sendProgressUpdate(`Found ${assignments.length} assignments`);
  return { assignments };
}

/**
 * Handle GET_COURSE_SECTIONS message
 * Returns unique sections (יחידות הוראה) from assignment index page
 */
async function handleGetCourseSections(
  payload?: { courseMoodleId?: string }
): Promise<{ sections: string[] }> {
  sendProgressUpdate('Getting course sections...');

  // Only works on assignment index page
  if (!isAssignmentIndexPage()) {
    console.warn('[SemesterHub] Not on assignment index page');
    return { sections: [] };
  }

  const courseMoodleId = payload?.courseMoodleId || getAssignmentIndexCourseId();
  if (!courseMoodleId) {
    console.warn('[SemesterHub] No course ID found');
    return { sections: [] };
  }

  const sections = scrapeCourseSections(courseMoodleId);
  sendProgressUpdate(`Found ${sections.length} sections`);
  return { sections };
}

/**
 * Handle SCRAPE_ALL message - scrape courses and assignments
 */
async function handleScrapeAll(): Promise<{
  courses: ScrapedCourse[];
  assignments: ScrapedAssignment[];
}> {
  const config = getUniversityConfig();
  if (!config) {
    console.warn('[SemesterHub] No university config found');
    return { courses: [], assignments: [] };
  }

  // Scrape courses
  sendProgressUpdate('Searching for courses...');
  const courses = scrapeCourses(config);
  sendProgressUpdate(`Found ${courses.length} courses`);

  // Scrape assignments only if on a course page
  let assignments: ScrapedAssignment[] = [];
  if (isCoursePage()) {
    const courseMoodleId = getCurrentCourseId();
    if (courseMoodleId) {
      sendProgressUpdate('Searching for assignments...');
      assignments = scrapeAssignments(config, courseMoodleId);
      sendProgressUpdate(`Found ${assignments.length} assignments`);
    }
  }

  return { courses, assignments };
}

// ========================================
// Login Detection Functions
// ========================================

/**
 * Check if user is logged into Moodle
 * Returns object to match expected response format
 */
function checkMoodleLoginStatus(): { isLoggedIn: boolean } {
  // Check for login page indicators
  const isLoginPage = window.location.pathname.includes('/login/');
  const hasLoginForm = document.querySelector('form#login, .login-form, #loginbtn');

  // If on login page or has login form, user is NOT logged in
  const isLoggedIn = !isLoginPage && !hasLoginForm;
  console.log('[SemesterHub] Login check - isLoginPage:', isLoginPage, 'hasLoginForm:', !!hasLoginForm, 'isLoggedIn:', isLoggedIn);
  return { isLoggedIn };
}

/**
 * Send current login status to service worker
 */
function sendLoginStatus(): void {
  const { isLoggedIn } = checkMoodleLoginStatus();
  chrome.runtime.sendMessage({
    type: 'MOODLE_LOGIN_STATUS',
    payload: { isLoggedIn }
  }).catch(() => {
    // Ignore errors (service worker might not be listening)
  });
}

/**
 * Monitor login status changes and notify service worker
 */
function monitorLoginStatus(): void {
  // Send initial status
  sendLoginStatus();

  // Monitor URL changes (Moodle redirects after login)
  let lastUrl = window.location.href;
  const urlObserver = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      sendLoginStatus();
    }
  });
  urlObserver.observe(document, { subtree: true, childList: true });

  // Also check periodically (backup)
  setInterval(sendLoginStatus, 2000);
}

// ========================================
// Page Detection Functions
// ========================================

/**
 * Check if current page is a Moodle page
 */
export function isMoodlePage(): boolean {
  // Check for common Moodle page indicators
  const indicators = [
    // Page wrapper
    document.querySelector('#page-wrapper'),
    document.querySelector('#page'),
    document.querySelector('.moodle-page'),
    // Body classes
    document.body.classList.contains('path-mod'),
    document.body.classList.contains('path-course'),
    document.body.classList.contains('path-my'),
    document.body.classList.contains('pagelayout-mydashboard'),
    document.body.classList.contains('pagelayout-course'),
    // Moodle specific elements
    document.querySelector('.navbar-brand img[alt*="moodle" i]'),
    document.querySelector('meta[name="generator"][content*="Moodle"]'),
    // URL patterns
    window.location.hostname.includes('moodle'),
    window.location.pathname.includes('/my/'),
    window.location.pathname.includes('/course/'),
  ];

  return indicators.some((indicator) =>
    typeof indicator === 'boolean' ? indicator : !!indicator
  );
}

/**
 * Check if on Moodle dashboard page
 */
export function isDashboard(): boolean {
  const path = window.location.pathname;

  // Check URL path
  if (path.includes('/my/') || path.endsWith('/my')) {
    return true;
  }

  // Check body classes
  const bodyClasses = document.body.className;
  if (
    bodyClasses.includes('path-my') ||
    bodyClasses.includes('pagelayout-mydashboard')
  ) {
    return true;
  }

  return false;
}

/**
 * Check if on a course page
 */
export function isCoursePage(): boolean {
  const path = window.location.pathname;

  // Check URL path
  if (path.includes('/course/view.php')) {
    return true;
  }

  // Check body classes
  const bodyClasses = document.body.className;
  if (
    bodyClasses.includes('path-course-view') ||
    bodyClasses.includes('pagelayout-course')
  ) {
    return true;
  }

  return false;
}

/**
 * Get current course ID from URL
 */
export function getCurrentCourseId(): string | null {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('id');
  } catch {
    // Try regex as fallback
    const match = window.location.href.match(/[?&]id=(\d+)/);
    return match ? match[1] : null;
  }
}

/**
 * Get current course name from page
 */
function getCurrentCourseName(): string | null {
  // Try header
  const header = document.querySelector('.page-header-headings h1');
  if (header?.textContent) {
    return header.textContent.trim();
  }

  // Try breadcrumb
  const breadcrumb = document.querySelector(
    '.breadcrumb-item.active, .breadcrumb li:last-child a'
  );
  if (breadcrumb?.textContent) {
    return breadcrumb.textContent.trim();
  }

  return null;
}

// ========================================
// Page Info
// ========================================

/**
 * Get comprehensive information about current page
 */
function getPageInfo(): PageInfo {
  const url = window.location.href;
  const university = detectUniversity(url);
  const moodleVersion = detectMoodleVersionFromPage();

  // Get course ID - works for both course page and assignment index page
  const courseId = getCurrentCourseId() || getAssignmentIndexCourseId();

  return {
    isMoodlePage: isMoodlePage(),
    isDashboard: isDashboard(),
    isCoursePage: isCoursePage(),
    isAssignmentIndexPage: isAssignmentIndexPage(),
    currentCourseId: courseId,
    currentCourseName: isCoursePage() ? getCurrentCourseName() : null,
    universityId: (university?.id as UniversityId) || null,
    universityName: university?.name || null,
    moodleVersion,
  };
}

// ========================================
// Helpers
// ========================================

/**
 * Get university configuration for current page
 */
function getUniversityConfig() {
  const url = window.location.href;
  const university = detectUniversity(url);

  if (!university) {
    // Try to detect from URL hostname
    const hostname = window.location.hostname;
    for (const config of Object.values(UNIVERSITIES)) {
      if (hostname.includes(new URL(config.moodleUrl).hostname)) {
        return config;
      }
    }
    return null;
  }

  return university;
}

/**
 * Send progress update to background service worker
 */
function sendProgressUpdate(message: string): void {
  try {
    chrome.runtime.sendMessage({
      type: 'PROGRESS',
      payload: { message },
    });
  } catch {
    // Background might not be listening, that's ok
    console.debug('[SemesterHub] Progress:', message);
  }
}

// ========================================
// Initialize
// ========================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Export for testing
export {
  getPageInfo,
  handleMessage,
  handleScrapeCourses,
  handleScrapeAssignments,
  handleScrapeAll,
};
