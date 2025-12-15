/**
 * Shared constants for SemesterHub extension
 */

// ========================================
// Timeout Constants (in milliseconds)
// ========================================

export const TIMEOUTS = {
  /** Default timeout for most messages (10 seconds) */
  MESSAGE_DEFAULT: 10_000,

  /** Timeout for scraping operations (30 seconds) */
  MESSAGE_SCRAPE: 30_000,

  /** Timeout waiting for tab to load (30 seconds) */
  TAB_LOAD: 30_000,

  /** Timeout for API requests (15 seconds) */
  API_REQUEST: 15_000,

  /** Timeout for manual Moodle login (2 minutes) */
  MOODLE_LOGIN: 120_000,

  /** Total time to poll for token (1 minute) */
  TOKEN_POLL_TOTAL: 60_000,

  /** Interval between token polling attempts (2 seconds) */
  TOKEN_POLL_INTERVAL: 2_000,
} as const;

// ========================================
// Retry Constants
// ========================================

export const RETRY = {
  /** Maximum retry attempts for transient failures */
  MAX_ATTEMPTS: 3,

  /** Base delay for exponential backoff (1 second) */
  BASE_DELAY_MS: 1_000,

  /** Maximum delay cap (10 seconds) */
  MAX_DELAY_MS: 10_000,

  /** Number of retries for tab communication */
  TAB_MESSAGE_RETRIES: 2,
} as const;

// ========================================
// Service Worker Constants
// ========================================

export const SERVICE_WORKER = {
  /** Keep-alive alarm interval in minutes (~20 seconds, safely under 30s timeout) */
  KEEPALIVE_INTERVAL_MINUTES: 0.33,

  /** Keep-alive alarm name */
  KEEPALIVE_ALARM_NAME: 'keepAlive',
} as const;

// ========================================
// Sync Constants
// ========================================

export const SYNC = {
  /** Maximum number of courses to process in parallel */
  PARALLEL_COURSE_LIMIT: 3,

  /** Delay after tab loads before sending message (content script init) */
  TAB_INIT_DELAY_MS: 500,

  /** Maximum sync history entries to keep */
  MAX_HISTORY_ENTRIES: 50,
} as const;

// ========================================
// Storage Keys
// ========================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  TOKEN_EXPIRES_AT: 'tokenExpiresAt',
  SYNCED_COURSES: 'syncedCourses',
  SYNCED_UNIVERSITY_ID: 'syncedUniversityId',
  SYNCED_MOODLE_URL: 'syncedMoodleUrl',
  LAST_SYNC_TIME: 'lastSyncTime',
  SYNC_HISTORY: 'syncHistory',
  PENDING_LOGIN: 'pendingLogin',
} as const;

// ========================================
// Extension Version
// ========================================

export const EXTENSION_VERSION = '1.0.7';
