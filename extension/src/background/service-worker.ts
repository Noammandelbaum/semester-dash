import type {
  ExtensionMessage,
  ScrapeCompletePayload,
  SyncStatus,
  SyncStatusType,
  SyncHistoryEntry,
  ScrapeProgress,
  AuthStatus,
} from '../shared/types';
import { syncMoodleData, getAuthStatus, storeToken, clearToken, ApiError } from '../shared/api';

// Current sync status
let syncStatus: SyncStatus = {
  status: "idle",
  isSyncing: false,
  lastSyncTime: null,
  lastSyncResult: null,
  error: null,
};

// Cached auth status
let cachedAuthStatus: AuthStatus = { isAuthenticated: false };

/**
 * Initialize service worker
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('SemesterHub extension installed');

  // Initialize storage with defaults
  chrome.storage.local.get(['lastSyncTime', 'syncHistory'], (result) => {
    if (!result.syncHistory) {
      chrome.storage.local.set({ syncHistory: [] });
    }
    if (result.lastSyncTime) {
      syncStatus.lastSyncTime = result.lastSyncTime;
    }
  });

  // Check token validity on install
  checkTokenValidityOnStartup();
});

/**
 * Check on service worker startup
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('[ServiceWorker] Browser started, checking token validity');
  checkTokenValidityOnStartup();
});

/**
 * Check if stored token is still valid on startup
 * If expired or invalid, clear it to force re-authentication
 */
async function checkTokenValidityOnStartup(): Promise<void> {
  try {
    const authStatus = await getAuthStatus();
    cachedAuthStatus = authStatus;

    if (!authStatus.isAuthenticated) {
      console.log('[ServiceWorker] No valid token found on startup');
    } else {
      console.log('[ServiceWorker] Token is valid, user:', authStatus.user?.name);
    }
  } catch (error) {
    console.error('[ServiceWorker] Error checking token on startup:', error);
    // Clear potentially corrupt token
    await clearToken();
    cachedAuthStatus = { isAuthenticated: false };
  }
}

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((response) => {
      try {
        sendResponse(response);
      } catch {
        // Sender disconnected, ignore
      }
    })
    .catch((error) => {
      // Only log unexpected errors (not user-facing errors like "not on Moodle page")
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (!errorMsg.includes('Moodle') && !errorMsg.includes('Receiving end')) {
        console.error('[ServiceWorker] Unexpected error:', error);
      }
      try {
        sendResponse({ error: errorMsg });
      } catch {
        // Sender disconnected, ignore
      }
    });

  // Return true to indicate async response
  return true;
});

/**
 * Process incoming messages
 */
async function handleMessage(
  message: ExtensionMessage,
  _sender: chrome.runtime.MessageSender
): Promise<unknown> {
  switch (message.type) {
    case 'GET_STATUS':
      return getSyncStatus();

    case 'SET_AUTH_TOKEN':
      return handleSetAuthToken(message.payload as { token: string; expiresAt: string });

    case 'GET_AUTH_TOKEN':
      return getAuthToken();

    case 'CLEAR_AUTH_TOKEN':
      return handleClearAuthToken();

    case 'AUTH_STATUS':
      return handleGetAuthStatus();

    case 'SCRAPE_COMPLETE':
      return handleScrapeComplete(message.payload as ScrapeCompletePayload);

    case 'SYNC_TO_BACKEND':
      return handleSyncToBackend(message.payload as ScrapeCompletePayload);

    case 'SCRAPE_REQUEST':
      return forwardToContentScript(message);

    case 'SCRAPE_COURSES':
    case 'SCRAPE_ASSIGNMENTS':
    case 'SCRAPE_ALL':
    case 'GET_PAGE_INFO':
      return forwardToContentScript(message);

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

/**
 * Get current sync status
 */
async function getSyncStatus(): Promise<SyncStatus & { authStatus: Awaited<ReturnType<typeof getAuthStatus>> }> {
  try {
    const authStatus = await getAuthStatus();
    return { ...syncStatus, authStatus };
  } catch {
    return { ...syncStatus, authStatus: { isAuthenticated: false } };
  }
}

/**
 * Store auth token
 */
async function handleSetAuthToken(payload: { token: string; expiresAt: string }): Promise<{ success: boolean }> {
  await storeToken(payload.token, payload.expiresAt);
  return { success: true };
}

/**
 * Get stored auth token
 */
async function getAuthToken(): Promise<{ token: string | null }> {
  const result = await chrome.storage.local.get(['authToken', 'tokenExpiresAt']);

  if (!result.authToken) {
    return { token: null };
  }

  // Check expiration
  if (result.tokenExpiresAt) {
    const expiresAt = new Date(result.tokenExpiresAt);
    if (expiresAt < new Date()) {
      await clearToken();
      return { token: null };
    }
  }

  return { token: result.authToken };
}

/**
 * Clear auth token and reset auth status
 */
async function handleClearAuthToken(): Promise<{ success: boolean }> {
  await clearToken();
  cachedAuthStatus = { isAuthenticated: false };
  broadcastStatusUpdate();
  return { success: true };
}

/**
 * Get current auth status
 */
async function handleGetAuthStatus(): Promise<AuthStatus> {
  try {
    cachedAuthStatus = await getAuthStatus();
    return cachedAuthStatus;
  } catch (error) {
    console.error('[ServiceWorker] Auth status error:', error);
    return { isAuthenticated: false };
  }
}

/**
 * Handle scraped data from content script
 */
async function handleScrapeComplete(payload: ScrapeCompletePayload): Promise<{ success: boolean }> {
  console.log('Scrape complete:', payload);
  // Store temporarily or trigger sync
  return { success: true };
}

/**
 * Sync data to SemesterHub backend
 */
async function handleSyncToBackend(payload: ScrapeCompletePayload): Promise<{ success: boolean; error?: string }> {
  if (syncStatus.isSyncing) {
    return { success: false, error: 'Sync already in progress' };
  }

  // Start keep-alive to prevent service worker from being terminated
  keepAlive();

  // Update status to syncing
  updateSyncStatus('syncing', {
    progress: {
      stage: 'assignments',
      message: 'מסנכרן נתונים...',
      current: 0,
      total: payload.courses.length + payload.assignments.length,
    },
  });

  try {
    const result = await syncMoodleData({
      universityId: payload.universityId,
      moodleUrl: payload.moodleUrl,
      courses: payload.courses,
      assignments: payload.assignments,
    });

    // Update status to success
    syncStatus.lastSyncResult = result;
    syncStatus.lastSyncTime = Date.now();
    updateSyncStatus('success', {
      progress: {
        stage: 'complete',
        message: `סונכרנו ${result.courses.created + result.courses.updated} קורסים ו-${result.assignments.created + result.assignments.updated} משימות`,
      },
    });

    // Save to storage
    await chrome.storage.local.set({ lastSyncTime: syncStatus.lastSyncTime });

    // Add to history
    await addToSyncHistory({
      timestamp: syncStatus.lastSyncTime,
      universityId: payload.universityId,
      coursesCount: payload.courses.length,
      assignmentsCount: payload.assignments.length,
      success: result.success,
    });

    // Stop keep-alive
    stopKeepAlive();

    // Reset to idle after short delay
    setTimeout(() => {
      updateSyncStatus('idle');
    }, 3000);

    return { success: result.success };
  } catch (error) {
    // Stop keep-alive on error
    stopKeepAlive();

    const errorMessage = error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Unknown error';

    updateSyncStatus('error', { error: errorMessage });

    await addToSyncHistory({
      timestamp: Date.now(),
      universityId: payload.universityId,
      coursesCount: payload.courses.length,
      assignmentsCount: payload.assignments.length,
      success: false,
      error: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * Add entry to sync history
 */
async function addToSyncHistory(entry: SyncHistoryEntry): Promise<void> {
  const result = await chrome.storage.local.get(['syncHistory']);
  const history: SyncHistoryEntry[] = result.syncHistory || [];

  // Keep last 50 entries
  history.unshift(entry);
  if (history.length > 50) {
    history.pop();
  }

  await chrome.storage.local.set({ syncHistory: history });
}

/**
 * Forward message to active tab's content script
 * Returns a default response if content script is not available
 */
async function forwardToContentScript(message: ExtensionMessage): Promise<unknown> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      return getDefaultResponseForMessage(message);
    }

    // Check if URL is a Moodle page before trying to send message
    const url = tab.url || '';
    const isMoodlePage = url.includes('moodle') || url.includes('/course/') || url.includes('/my/');

    if (!isMoodlePage) {
      return getDefaultResponseForMessage(message);
    }

    return await chrome.tabs.sendMessage(tab.id, message);
  } catch {
    // Any error - return default response silently
    return getDefaultResponseForMessage(message);
  }
}

/**
 * Get default response for messages when content script is not available
 */
function getDefaultResponseForMessage(message: ExtensionMessage): unknown {
  switch (message.type) {
    case 'GET_PAGE_INFO':
      return {
        isMoodlePage: false,
        isDashboard: false,
        isCoursePage: false,
        currentCourseId: null,
        universityId: null,
      };
    case 'SCRAPE_COURSES':
    case 'SCRAPE_ASSIGNMENTS':
    case 'SCRAPE_ALL':
      return { courses: [], assignments: [] };
    default:
      return { error: 'Content script not available' };
  }
}

// ========================================
// Status Management Helpers
// ========================================

/**
 * Update sync status and broadcast to all components
 */
function updateSyncStatus(
  status: SyncStatusType,
  updates: Partial<Pick<SyncStatus, 'error' | 'progress'>> = {}
): void {
  syncStatus.status = status;
  syncStatus.isSyncing = status === 'syncing' || status === 'scraping' || status === 'checking';

  if (updates.error !== undefined) {
    syncStatus.error = updates.error;
  }
  if (updates.progress !== undefined) {
    syncStatus.progress = updates.progress;
  }

  // Clear error on success/idle
  if (status === 'success' || status === 'idle') {
    if (!updates.error) {
      syncStatus.error = null;
    }
  }

  // Broadcast update
  broadcastStatusUpdate();
}

/**
 * Broadcast status update to popup and any other listeners
 * This function is fire-and-forget - errors are silently ignored
 */
function broadcastStatusUpdate(): void {
  const message: ExtensionMessage<SyncStatus & { authStatus: AuthStatus }> = {
    type: 'STATUS_UPDATE',
    payload: {
      ...syncStatus,
      authStatus: cachedAuthStatus,
    },
  };

  // Send to runtime (popup will receive this)
  // Using Promise.catch to avoid unhandled rejection when no listeners exist
  chrome.runtime.sendMessage(message).catch(() => {
    // Popup might not be open, ignore error silently
  });

  // Also notify all tabs with content scripts
  chrome.tabs.query({ url: ['*://*.moodle.*/*', '*://moodle.*/*'] })
    .then((tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {
            // Content script might not be loaded, ignore
          });
        }
      }
    })
    .catch(() => {
      // Ignore tab query errors
    });
}

/**
 * Update progress during scraping
 */
export function updateScrapeProgress(progress: ScrapeProgress): void {
  updateSyncStatus('scraping', { progress });
}

// ========================================
// Service Worker Lifecycle
// ========================================

/**
 * Keep service worker alive during long operations
 */
function keepAlive(): void {
  // Service workers have a 30-second idle timeout
  // This creates a periodic alarm to keep it active during sync
  chrome.alarms.create('keepAlive', { periodInMinutes: 0.4 }); // ~24 seconds
}

/**
 * Stop the keep-alive alarm
 */
function stopKeepAlive(): void {
  chrome.alarms.clear('keepAlive');
}

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    // Just being called keeps the service worker active
    console.log('[ServiceWorker] Keep-alive ping');
  }
});

// Start keep-alive when syncing starts, stop when done
chrome.storage.onChanged.addListener((changes) => {
  if (changes.lastSyncTime) {
    stopKeepAlive();
  }
});

// Log service worker startup
console.log('[ServiceWorker] SemesterHub extension service worker started');
