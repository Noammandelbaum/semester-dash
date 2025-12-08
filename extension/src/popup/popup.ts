import type { ExtensionMessage, PageInfo, SyncStatus, AuthStatus, ScrapedCourse } from '@/shared/types';
import { API_BASE_URL, UNIVERSITIES } from '@/shared/config';
import { requestAndStoreToken, ApiError } from '@/shared/api';

// Types
interface CourseWithSelection extends ScrapedCourse {
  selected: boolean;
  semester?: string;
}

// DOM Elements
const connectionStatus = document.getElementById('connection-status')!;
const statusText = connectionStatus.querySelector('.status-text')!;
const universityInfo = document.getElementById('university-info')!;
const universityName = document.getElementById('university-name')!;

const authSection = document.getElementById('auth-section')!;
const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
const authPolling = document.getElementById('auth-polling')!;
const tokenError = document.getElementById('token-error')!;

const syncSection = document.getElementById('sync-section')!;
const pageTypeIcon = document.getElementById('page-type-icon')!;
const pageTypeText = document.getElementById('page-type-text')!;
const syncBtn = document.getElementById('sync-btn') as HTMLButtonElement;
const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;
const syncProgress = document.getElementById('sync-progress')!;
const progressFill = document.getElementById('progress-fill') as HTMLElement;
const progressText = document.getElementById('progress-text')!;
const syncResult = document.getElementById('sync-result')!;
const resultIcon = document.getElementById('result-icon')!;
const resultText = document.getElementById('result-text')!;
const lastSync = document.getElementById('last-sync')!;
const lastSyncTime = document.getElementById('last-sync-time')!;

const openAppBtn = document.getElementById('open-app-btn') as HTMLAnchorElement;
const syncAssignmentsBtn = document.getElementById('sync-assignments-btn') as HTMLButtonElement;

// Course selection elements
const syncInitial = document.getElementById('sync-initial')!;
const courseSelection = document.getElementById('course-selection')!;
const coursesFoundEl = document.getElementById('courses-found')!;
const courseList = document.getElementById('course-list')!;
const selectAllBtn = document.getElementById('select-all-btn') as HTMLButtonElement;
const selectNoneBtn = document.getElementById('select-none-btn') as HTMLButtonElement;
const continueToSectionsBtn = document.getElementById('continue-to-sections-btn') as HTMLButtonElement;
const selectedCountEl = document.getElementById('selected-count')!;
const cancelSelectionBtn = document.getElementById('cancel-selection-btn') as HTMLButtonElement;

// Section selection elements
const sectionSelection = document.getElementById('section-selection')!;
const sectionList = document.getElementById('section-list')!;
const saveAndSyncBtn = document.getElementById('save-and-sync-btn') as HTMLButtonElement;
const backToCoursesBtn = document.getElementById('back-to-courses-btn') as HTMLButtonElement;

// State
let scrapedCourses: CourseWithSelection[] = [];
let currentPageInfo: PageInfo | null = null;

// Course with sections for configuration
interface CourseWithSections {
  moodleId: string;
  name: string;
  url: string;
  sections: string[];
  selectedSections: string[];
}
let coursesWithSections: CourseWithSections[] = [];

/**
 * Initialize popup
 */
async function init(): Promise<void> {
  // Set up event listeners
  loginBtn.addEventListener('click', handleLogin);
  syncBtn.addEventListener('click', handleScrapeAndShowSelection);
  syncAssignmentsBtn.addEventListener('click', handleSyncAssignments);
  logoutBtn.addEventListener('click', handleLogout);
  openAppBtn.addEventListener('click', handleOpenApp);

  // Course selection listeners
  selectAllBtn.addEventListener('click', handleSelectAll);
  selectNoneBtn.addEventListener('click', handleSelectNone);
  continueToSectionsBtn.addEventListener('click', handleContinueToSections);
  cancelSelectionBtn.addEventListener('click', handleCancelSelection);

  // Section selection listeners
  saveAndSyncBtn.addEventListener('click', handleSaveAndSync);
  backToCoursesBtn.addEventListener('click', handleBackToCourses);

  // Load initial state
  await checkStatus();
  await checkPageInfo();
}

/**
 * Check authentication and sync status
 */
async function checkStatus(): Promise<void> {
  try {
    const response = await sendMessage<SyncStatus & { authStatus: AuthStatus }>({
      type: 'GET_STATUS',
    });

    updateAuthUI(response.authStatus);
    updateSyncUI(response);
  } catch (error) {
    console.error('Failed to get status:', error);
    updateAuthUI({ isAuthenticated: false });
  }
}

/**
 * Check current page info
 */
async function checkPageInfo(): Promise<void> {
  try {
    const pageInfo = await sendMessage<PageInfo>({ type: 'GET_PAGE_INFO' });
    updatePageInfoUI(pageInfo);
  } catch (error) {
    // Not on a Moodle page or content script not loaded
    updatePageInfoUI({
      isMoodlePage: false,
      isDashboard: false,
      isCoursePage: false,
      currentCourseId: null,
      universityId: null,
    });
  }
}

/**
 * Update authentication UI
 */
function updateAuthUI(authStatus: AuthStatus): void {
  if (authStatus.isAuthenticated) {
    connectionStatus.classList.remove('disconnected');
    connectionStatus.classList.add('connected');
    statusText.textContent = `מחובר כ-${authStatus.user?.name || 'משתמש'}`;

    authSection.classList.add('hidden');
    syncSection.classList.remove('hidden');
  } else {
    connectionStatus.classList.remove('connected');
    connectionStatus.classList.add('disconnected');
    statusText.textContent = 'לא מחובר';

    authSection.classList.remove('hidden');
    syncSection.classList.add('hidden');

    // Reset auth section state
    loginBtn.classList.remove('hidden');
    authPolling.classList.add('hidden');
    tokenError.classList.add('hidden');
  }
}

/**
 * Update sync status UI
 */
function updateSyncUI(status: SyncStatus): void {
  if (status.lastSyncTime) {
    lastSync.classList.remove('hidden');
    lastSyncTime.textContent = formatRelativeTime(status.lastSyncTime);
  } else {
    lastSync.classList.add('hidden');
  }

  if (status.isSyncing) {
    syncBtn.disabled = true;
    syncProgress.classList.remove('hidden');
  } else {
    syncBtn.disabled = false;
    syncProgress.classList.add('hidden');
  }
}

/**
 * Update page info UI
 */
function updatePageInfoUI(pageInfo: PageInfo): void {
  if (!pageInfo.isMoodlePage) {
    pageTypeIcon.textContent = '⚠️';
    pageTypeText.textContent = 'לא בעמוד Moodle';
    syncBtn.disabled = true;
    universityInfo.classList.add('hidden');
    return;
  }

  syncBtn.disabled = false;

  if (pageInfo.universityId && UNIVERSITIES[pageInfo.universityId]) {
    const uni = UNIVERSITIES[pageInfo.universityId];
    universityInfo.classList.remove('hidden');
    universityName.textContent = uni.nameHe;
  } else {
    universityInfo.classList.add('hidden');
  }

  if (pageInfo.isDashboard) {
    pageTypeIcon.textContent = '🏠';
    pageTypeText.textContent = 'דף הבית - ניתן לסנכרן קורסים';
  } else if (pageInfo.isCoursePage) {
    pageTypeIcon.textContent = '📖';
    pageTypeText.textContent = 'דף קורס - ניתן לסנכרן משימות';
  } else {
    pageTypeIcon.textContent = '📄';
    pageTypeText.textContent = 'עמוד Moodle';
  }
}

/**
 * Handle login button click
 */
async function handleLogin(): Promise<void> {
  // Open login page with extension flag
  chrome.tabs.create({ url: `${API_BASE_URL}/login?from=extension` });

  // Show polling UI
  loginBtn.classList.add('hidden');
  authPolling.classList.remove('hidden');
  tokenError.classList.add('hidden');

  // Start polling for token
  startTokenPolling();
}

/**
 * Poll for authentication token after login
 * Polls every 2 seconds for up to 60 seconds
 */
let pollingInterval: ReturnType<typeof setInterval> | null = null;

async function startTokenPolling(): Promise<void> {
  // Clear any existing polling
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds
  let attempts = 0;

  pollingInterval = setInterval(async () => {
    attempts++;

    try {
      const result = await requestAndStoreToken();

      if (result.success) {
        // Success! Clear interval and update UI
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
        updateAuthUI(result.data);
        await checkPageInfo();
      }
    } catch (error) {
      // Token not ready yet, continue polling
      console.log('[SemesterHub] Polling for token, attempt', attempts);
    }

    if (attempts >= maxAttempts) {
      // Timeout - show error
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
      showTokenError('הזמן הקצוב להתחברות עבר. נסה שוב.');
      loginBtn.classList.remove('hidden');
      authPolling.classList.add('hidden');
    }
  }, 2000); // Poll every 2 seconds
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error: ApiError | Error | unknown): string {
  if (error instanceof ApiError) {
    if (error.isAuthError()) {
      return 'יש להתחבר קודם ל-SemesterHub דרך הדפדפן';
    }
    if (error.isNetworkError()) {
      return 'בעיית חיבור לשרת. נסה שוב.';
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'שגיאה לא צפויה';
}

/**
 * Show token error message
 */
function showTokenError(message: string): void {
  tokenError.textContent = message;
  tokenError.classList.remove('hidden');
}

/**
 * Handle sync button click - scrape courses and show selection UI
 */
async function handleScrapeAndShowSelection(): Promise<void> {
  syncBtn.disabled = true;
  syncProgress.classList.remove('hidden');
  syncResult.classList.add('hidden');

  try {
    // Update progress
    progressFill.style.width = '30%';
    progressText.textContent = 'מזהה עמוד...';

    // Get page info
    currentPageInfo = await sendMessage<PageInfo>({ type: 'GET_PAGE_INFO' });

    if (!currentPageInfo.isMoodlePage) {
      throw new Error('לא בעמוד Moodle');
    }

    // Scrape courses
    progressFill.style.width = '60%';
    progressText.textContent = 'מאסף קורסים...';

    const scrapeResult = await sendMessage<{
      courses: ScrapedCourse[];
      assignments: Array<{ moodleId: string; title: string; url: string }>;
    }>({ type: 'SCRAPE_ALL' });

    progressFill.style.width = '100%';
    progressText.textContent = 'הושלם!';

    if (scrapeResult.courses.length === 0) {
      showResult(false, 'לא נמצאו קורסים בעמוד זה');
      return;
    }

    // Convert to courses with selection, try to detect semester from name
    scrapedCourses = scrapeResult.courses.map(course => ({
      ...course,
      selected: isRecentCourse(course), // Pre-select recent courses
      semester: extractSemester(course.name),
    }));

    // Sort: recent first, then by name
    scrapedCourses.sort((a, b) => {
      // Selected (recent) courses first
      if (a.selected !== b.selected) return a.selected ? -1 : 1;
      // Then by name
      return a.name.localeCompare(b.name, 'he');
    });

    // Show course selection UI
    showCourseSelection();

  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה לא צפויה';
    showResult(false, message);
  } finally {
    syncBtn.disabled = false;
    setTimeout(() => {
      syncProgress.classList.add('hidden');
      progressFill.style.width = '0%';
    }, 500);
  }
}

/**
 * Check if course is from current/recent semester based on code
 */
function isRecentCourse(course: ScrapedCourse): boolean {
  const code = course.courseCode || course.name;
  // Look for year codes like 5785, 5786 (Hebrew year) or semester indicators
  // Current year (2024-2025) is 5785
  const currentHebrewYear = 5785;
  const yearMatch = code.match(/57(\d{2})/);
  if (yearMatch) {
    const year = parseInt('57' + yearMatch[1]);
    // Consider current and next year as recent
    return year >= currentHebrewYear;
  }
  // If no year found, assume it's recent
  return true;
}

/**
 * Extract semester info from course name/code
 */
function extractSemester(name: string): string | undefined {
  // Look for patterns like "סמסטר א תשפ"ה" or "5785.1" or "5785.2"
  const semesterMatch = name.match(/סמסטר\s*([אב])/i);
  const yearMatch = name.match(/57(\d{2})/);

  if (yearMatch) {
    const year = '57' + yearMatch[1];
    const semester = semesterMatch ? (semesterMatch[1] === 'א' ? 'א' : 'ב') : '';

    // Check for .1 or .2 in code (semester indicator)
    const codeMatch = name.match(/\.([12])\./);
    if (codeMatch && !semester) {
      return `${year} סמסטר ${codeMatch[1] === '1' ? "א'" : "ב'"}`;
    }

    return semester ? `${year} סמסטר ${semester}'` : year;
  }

  return undefined;
}

/**
 * Show course selection UI
 */
function showCourseSelection(): void {
  syncInitial.classList.add('hidden');
  courseSelection.classList.remove('hidden');
  logoutBtn.classList.add('hidden');

  coursesFoundEl.textContent = scrapedCourses.length.toString();
  renderCourseList();
  updateSelectedCount();
}

/**
 * Hide course selection UI and go back to initial state
 */
function hideCourseSelection(): void {
  courseSelection.classList.add('hidden');
  syncInitial.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');
  scrapedCourses = [];
}

/**
 * Render the course list
 */
function renderCourseList(): void {
  courseList.innerHTML = '';

  for (const course of scrapedCourses) {
    const item = document.createElement('label');
    item.className = `course-item${course.selected ? ' selected' : ''}`;
    item.innerHTML = `
      <input type="checkbox" class="course-checkbox" data-id="${course.moodleId}" ${course.selected ? 'checked' : ''}>
      <div class="course-info">
        <div class="course-name" title="${course.name}">${course.name}</div>
        ${course.courseCode ? `<div class="course-code">${course.courseCode}</div>` : ''}
        ${course.semester ? `<span class="course-semester">${course.semester}</span>` : ''}
      </div>
    `;

    // Toggle selection on click
    const checkbox = item.querySelector('input')!;
    checkbox.addEventListener('change', () => {
      course.selected = checkbox.checked;
      item.classList.toggle('selected', course.selected);
      updateSelectedCount();
    });

    courseList.appendChild(item);
  }
}

/**
 * Update selected count display
 */
function updateSelectedCount(): void {
  const count = scrapedCourses.filter(c => c.selected).length;
  selectedCountEl.textContent = count.toString();
  continueToSectionsBtn.disabled = count === 0;
}

/**
 * Handle select all button
 */
function handleSelectAll(): void {
  scrapedCourses.forEach(c => c.selected = true);
  renderCourseList();
  updateSelectedCount();
}

/**
 * Handle select none button
 */
function handleSelectNone(): void {
  scrapedCourses.forEach(c => c.selected = false);
  renderCourseList();
  updateSelectedCount();
}

/**
 * Handle cancel selection button
 */
function handleCancelSelection(): void {
  hideCourseSelection();
  syncResult.classList.add('hidden');
}

/**
 * Handle continue to sections button - move to section selection step
 */
async function handleContinueToSections(): Promise<void> {
  const selectedCourses = scrapedCourses.filter(c => c.selected);
  if (selectedCourses.length === 0) return;

  // Hide course selection, show section selection
  courseSelection.classList.add('hidden');
  sectionSelection.classList.remove('hidden');

  // Show loading state
  sectionList.innerHTML = `
    <div class="loading-sections">
      <div class="spinner"></div>
      <span>טוען יחידות הוראה...</span>
    </div>
  `;

  try {
    // Fetch sections for all selected courses
    const response = await sendMessage<{
      success: boolean;
      courseSections: Array<{ moodleId: string; name: string; sections: string[] }>;
    }>({
      type: 'FETCH_SECTIONS_FOR_COURSES',
      payload: {
        courses: selectedCourses.map(c => ({
          moodleId: c.moodleId,
          name: c.name,
          url: c.url,
        })),
      },
    });

    if (response.success) {
      // Initialize courses with sections - all sections selected by default
      coursesWithSections = response.courseSections.map(cs => ({
        moodleId: cs.moodleId,
        name: cs.name,
        url: selectedCourses.find(c => c.moodleId === cs.moodleId)?.url || '',
        sections: cs.sections,
        selectedSections: [...cs.sections], // All selected by default
      }));

      renderSectionList();
    } else {
      sectionList.innerHTML = '<div class="error-message">שגיאה בטעינת יחידות הוראה</div>';
    }
  } catch (error) {
    console.error('Failed to fetch sections:', error);
    sectionList.innerHTML = '<div class="error-message">שגיאה בטעינת יחידות הוראה</div>';
  }
}

/**
 * Render the section selection list
 */
function renderSectionList(): void {
  sectionList.innerHTML = '';

  for (const course of coursesWithSections) {
    const courseDiv = document.createElement('div');
    courseDiv.className = 'section-course';

    // Course header
    const header = document.createElement('div');
    header.className = 'section-course-header';
    header.innerHTML = `
      <span class="section-course-icon">📚</span>
      <span class="section-course-name" title="${course.name}">${course.name}</span>
    `;
    courseDiv.appendChild(header);

    // Sections
    if (course.sections.length > 0) {
      const sectionsDiv = document.createElement('div');
      sectionsDiv.className = 'section-items';

      for (const section of course.sections) {
        const isSelected = course.selectedSections.includes(section);
        const sectionItem = document.createElement('label');
        sectionItem.className = 'section-item';
        sectionItem.innerHTML = `
          <input type="checkbox" class="section-checkbox"
            data-course="${course.moodleId}"
            data-section="${section}"
            ${isSelected ? 'checked' : ''}>
          <span class="section-name">${section}</span>
        `;

        // Handle checkbox change
        const checkbox = sectionItem.querySelector('input')!;
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            if (!course.selectedSections.includes(section)) {
              course.selectedSections.push(section);
            }
          } else {
            course.selectedSections = course.selectedSections.filter(s => s !== section);
          }
        });

        sectionsDiv.appendChild(sectionItem);
      }

      courseDiv.appendChild(sectionsDiv);
    } else {
      const noSections = document.createElement('div');
      noSections.className = 'section-items';
      noSections.innerHTML = '<span class="section-name" style="color: var(--color-gray-400);">אין יחידות הוראה</span>';
      courseDiv.appendChild(noSections);
    }

    sectionList.appendChild(courseDiv);
  }
}

/**
 * Handle back to courses button
 */
function handleBackToCourses(): void {
  sectionSelection.classList.add('hidden');
  courseSelection.classList.remove('hidden');
}

/**
 * Handle save and sync button - save configuration and sync
 */
async function handleSaveAndSync(): Promise<void> {
  saveAndSyncBtn.disabled = true;
  syncProgress.classList.remove('hidden');
  syncResult.classList.add('hidden');

  try {
    progressFill.style.width = '20%';
    progressText.textContent = 'שומר הגדרות...';

    // Get university URL from current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const moodleUrl = tab?.url ? new URL(tab.url).origin : '';

    // Save course configuration with sections
    const courseConfig = coursesWithSections.map(c => ({
      moodleId: c.moodleId,
      name: c.name,
      url: c.url,
      selectedSections: c.selectedSections,
    }));

    await chrome.storage.local.set({
      syncedCourses: courseConfig,
      syncedUniversityId: currentPageInfo?.universityId || 'unknown',
      syncedMoodleUrl: moodleUrl,
    });

    progressFill.style.width = '40%';
    progressText.textContent = 'מסנכרן קורסים...';

    // Sync courses to backend
    const syncResponse = await sendMessage<{ success: boolean; error?: string }>({
      type: 'SYNC_TO_BACKEND',
      payload: {
        universityId: currentPageInfo?.universityId || 'unknown',
        moodleUrl,
        courses: coursesWithSections.map(c => ({
          moodleId: c.moodleId,
          name: c.name,
          url: c.url,
        })),
        assignments: [],
      },
    });

    if (!syncResponse.success) {
      throw new Error(syncResponse.error || 'שגיאה בסנכרון קורסים');
    }

    progressFill.style.width = '100%';
    progressText.textContent = 'הושלם!';

    showResult(true, `נשמרו ${coursesWithSections.length} קורסים`);

    // Hide section selection after successful save
    setTimeout(() => {
      sectionSelection.classList.add('hidden');
      syncInitial.classList.remove('hidden');
      logoutBtn.classList.remove('hidden');
      scrapedCourses = [];
      coursesWithSections = [];
    }, 1500);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה לא צפויה';
    showResult(false, message);
  } finally {
    saveAndSyncBtn.disabled = false;
    setTimeout(() => {
      syncProgress.classList.add('hidden');
      progressFill.style.width = '0%';
    }, 1000);
  }
}

/**
 * Handle sync assignments button click
 * Opens background tabs for each synced course and scrapes assignments
 */
async function handleSyncAssignments(): Promise<void> {
  // Get saved courses from storage (now includes selectedSections)
  const { syncedCourses, syncedUniversityId, syncedMoodleUrl } = await chrome.storage.local.get([
    'syncedCourses',
    'syncedUniversityId',
    'syncedMoodleUrl',
  ]);

  if (!syncedCourses || syncedCourses.length === 0) {
    showResult(false, 'יש להגדיר קורסים קודם');
    return;
  }

  syncAssignmentsBtn.disabled = true;
  syncBtn.disabled = true;
  syncProgress.classList.remove('hidden');
  syncResult.classList.add('hidden');

  try {
    progressFill.style.width = '10%';
    progressText.textContent = `מסנכרן משימות מ-${syncedCourses.length} קורסים...`;

    // Send background sync request with section filters
    const response = await sendMessage<{
      success: boolean;
      assignments: Array<{ moodleId: string; title: string }>;
      error?: string;
    }>({
      type: 'SYNC_ASSIGNMENTS_BACKGROUND',
      payload: {
        courses: syncedCourses.map((c: { moodleId: string; name: string; url: string; selectedSections?: string[] }) => ({
          moodleId: c.moodleId,
          name: c.name,
          url: c.url,
          selectedSections: c.selectedSections || [], // Pass selected sections for filtering
        })),
        universityId: syncedUniversityId || 'unknown',
        moodleUrl: syncedMoodleUrl || '',
      },
    });

    progressFill.style.width = '100%';

    if (response.success) {
      const count = response.assignments?.length || 0;
      showResult(true, `סונכרנו ${count} משימות`);
    } else {
      showResult(false, response.error || 'שגיאה בסנכרון משימות');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה לא צפויה';
    showResult(false, message);
  } finally {
    syncAssignmentsBtn.disabled = false;
    syncBtn.disabled = false;
    setTimeout(() => {
      syncProgress.classList.add('hidden');
      progressFill.style.width = '0%';
    }, 1000);
  }
}

/**
 * Show sync result
 */
function showResult(success: boolean, message: string): void {
  syncResult.classList.remove('hidden', 'success', 'error');
  syncResult.classList.add(success ? 'success' : 'error');
  resultIcon.textContent = success ? '✅' : '❌';
  resultText.textContent = message;

  // Update last sync time if successful
  if (success) {
    lastSync.classList.remove('hidden');
    lastSyncTime.textContent = 'עכשיו';
  }
}

/**
 * Handle open app link click
 */
function handleOpenApp(e: Event): void {
  e.preventDefault();
  chrome.tabs.create({ url: `${API_BASE_URL}/dashboard` });
}

/**
 * Handle logout button click
 */
async function handleLogout(): Promise<void> {
  logoutBtn.disabled = true;
  logoutBtn.textContent = 'מתנתק...';

  try {
    // Clear token via background script
    await sendMessage({ type: 'CLEAR_AUTH_TOKEN' });
    // Clear pending login flag
    await chrome.storage.local.remove('pendingLogin');
    // Update UI
    updateAuthUI({ isAuthenticated: false });
  } catch (error) {
    console.error('Logout failed:', error);
  } finally {
    logoutBtn.disabled = false;
    logoutBtn.textContent = 'התנתק';
  }
}

/**
 * Send message to background script or content script
 */
async function sendMessage<T>(message: ExtensionMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (response?.error) {
        reject(new Error(response.error));
        return;
      }
      resolve(response as T);
    });
  });
}

/**
 * Format timestamp as relative time in Hebrew
 */
function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'עכשיו';
  if (minutes < 60) return `לפני ${minutes} דקות`;
  if (hours < 24) return `לפני ${hours} שעות`;
  return `לפני ${days} ימים`;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
