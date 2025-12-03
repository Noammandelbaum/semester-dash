import type { ExtensionMessage, PageInfo, SyncStatus, AuthStatus } from '@/shared/types';
import { API_BASE_URL, UNIVERSITIES } from '@/shared/config';
import { requestAndStoreToken, ApiError } from '@/shared/api';

// DOM Elements
const connectionStatus = document.getElementById('connection-status')!;
const statusText = connectionStatus.querySelector('.status-text')!;
const universityInfo = document.getElementById('university-info')!;
const universityName = document.getElementById('university-name')!;

const authSection = document.getElementById('auth-section')!;
const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
const postLoginActions = document.getElementById('post-login-actions')!;
const getTokenBtn = document.getElementById('get-token-btn') as HTMLButtonElement;
const tokenError = document.getElementById('token-error')!;

const syncSection = document.getElementById('sync-section')!;
const pageTypeIcon = document.getElementById('page-type-icon')!;
const pageTypeText = document.getElementById('page-type-text')!;
const syncBtn = document.getElementById('sync-btn') as HTMLButtonElement;
const syncProgress = document.getElementById('sync-progress')!;
const progressFill = document.getElementById('progress-fill') as HTMLElement;
const progressText = document.getElementById('progress-text')!;
const syncResult = document.getElementById('sync-result')!;
const resultIcon = document.getElementById('result-icon')!;
const resultText = document.getElementById('result-text')!;
const lastSync = document.getElementById('last-sync')!;
const lastSyncTime = document.getElementById('last-sync-time')!;

const openAppBtn = document.getElementById('open-app-btn') as HTMLAnchorElement;

/**
 * Initialize popup
 */
async function init(): Promise<void> {
  // Set up event listeners
  loginBtn.addEventListener('click', handleLogin);
  getTokenBtn.addEventListener('click', handleGetToken);
  syncBtn.addEventListener('click', handleSync);
  openAppBtn.addEventListener('click', handleOpenApp);

  // Load initial state
  await checkStatus();
  await checkPageInfo();

  // Check if user clicked login before (show "get token" button)
  const { pendingLogin } = await chrome.storage.local.get('pendingLogin');
  if (pendingLogin && !authSection.classList.contains('hidden')) {
    loginBtn.classList.add('hidden');
    postLoginActions.classList.remove('hidden');
  }
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
    postLoginActions.classList.add('hidden');
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
  // Save state so "get token" button shows when popup reopens
  await chrome.storage.local.set({ pendingLogin: true });

  chrome.tabs.create({ url: `${API_BASE_URL}/login` });
  // Show post-login actions after user clicks login
  loginBtn.classList.add('hidden');
  postLoginActions.classList.remove('hidden');
  tokenError.classList.add('hidden');
}

/**
 * Handle get token button click
 * This requests a token from the backend (requires user to be logged in via web)
 */
async function handleGetToken(): Promise<void> {
  getTokenBtn.disabled = true;
  getTokenBtn.textContent = 'מקבל token...';
  tokenError.classList.add('hidden');

  try {
    const result = await requestAndStoreToken();

    if (result.success) {
      // Clear pending login flag and update UI
      await chrome.storage.local.remove('pendingLogin');
      updateAuthUI(result.data);
      await checkPageInfo();
    } else {
      // Show error
      showTokenError(getErrorMessage(result.error));
    }
  } catch (error) {
    showTokenError(getErrorMessage(error));
  } finally {
    getTokenBtn.disabled = false;
    getTokenBtn.innerHTML = '<span class="btn-icon">🔑</span> קבל token';
  }
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
 * Handle sync button click
 */
async function handleSync(): Promise<void> {
  syncBtn.disabled = true;
  syncProgress.classList.remove('hidden');
  syncResult.classList.add('hidden');

  try {
    // Update progress
    progressFill.style.width = '20%';
    progressText.textContent = 'מזהה עמוד...';

    // Get page info
    const pageInfo = await sendMessage<PageInfo>({ type: 'GET_PAGE_INFO' });

    if (!pageInfo.isMoodlePage) {
      throw new Error('לא בעמוד Moodle');
    }

    // Scrape data
    progressFill.style.width = '40%';
    progressText.textContent = 'מאסף נתונים...';

    const scrapeResult = await sendMessage<{
      courses: Array<{ moodleId: string; name: string; url: string }>;
      assignments: Array<{ moodleId: string; title: string; url: string }>;
    }>({ type: 'SCRAPE_ALL' });

    progressFill.style.width = '60%';
    progressText.textContent = 'מסנכרן...';

    // Get university URL from current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const moodleUrl = tab?.url ? new URL(tab.url).origin : '';

    // Sync to backend
    const syncResponse = await sendMessage<{ success: boolean; error?: string }>({
      type: 'SYNC_TO_BACKEND',
      payload: {
        universityId: pageInfo.universityId || 'unknown',
        moodleUrl,
        courses: scrapeResult.courses,
        assignments: scrapeResult.assignments,
      },
    });

    progressFill.style.width = '100%';

    if (syncResponse.success) {
      showResult(
        true,
        `סונכרנו ${scrapeResult.courses.length} קורסים ו-${scrapeResult.assignments.length} משימות`
      );
    } else {
      showResult(false, syncResponse.error || 'שגיאה בסנכרון');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה לא צפויה';
    showResult(false, message);
  } finally {
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
