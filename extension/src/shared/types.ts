/**
 * Shared types for SemesterHub Browser Extension
 * These types align with backend schemas in src/schemas/sync.ts
 */

// ========================================
// University & Configuration Types
// ========================================

/**
 * University/Institution ID
 * Can be any string - known institutions have Hebrew names,
 * unknown ones are extracted from the URL
 */
export type UniversityId = string;

/**
 * Moodle version for selector selection
 */
export type MoodleVersion = "3.x" | "4.x" | "auto";

/**
 * CSS selectors for scraping Moodle pages
 * Each array contains fallback selectors in priority order
 */
export interface MoodleSelectors {
  // Course selectors
  courseList: string[];
  courseName: string[];
  courseUrl: string[];

  // Assignment selectors
  assignmentList: string[];
  assignmentName: string[];
  assignmentDueDate: string[];
  assignmentType: string[];

  // Moodle version (determines which selectors to prioritize)
  version: MoodleVersion;
}

/**
 * Configuration for a specific university's Moodle instance
 */
export interface UniversityConfig {
  id: UniversityId;
  name: string; // English name
  nameHe: string; // Hebrew name
  moodleUrl: string; // Base Moodle URL
  loginUrl: string;
  dashboardUrl: string;
  selectors: MoodleSelectors;
}

// ========================================
// Scraped Data Types
// ========================================

/**
 * Course data scraped from Moodle
 * Matches backend MoodleCourseSchema
 */
export interface ScrapedCourse {
  moodleId: string;
  name: string;
  courseCode?: string | null;
  url: string;
  semester?: string; // Optional, extracted from course name if present
}

/**
 * Moodle assignment types
 * Must match backend MOODLE_ASSIGNMENT_TYPES
 */
export type MoodleAssignmentType = "assignment" | "quiz" | "forum" | "other";

/**
 * Assignment data scraped from Moodle
 * Matches backend MoodleAssignmentSchema
 */
export interface ScrapedAssignment {
  moodleId: string;
  courseMoodleId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null; // ISO datetime string
  url: string;
  type: MoodleAssignmentType;
}

// ========================================
// Sync Types (matches backend schemas)
// ========================================

/**
 * Payload sent to backend for syncing Moodle data
 * Matches backend MoodleSyncPayloadSchema
 */
export interface SyncPayload {
  universityId: UniversityId;
  moodleUrl: string;
  courses: ScrapedCourse[];
  assignments: ScrapedAssignment[];
}

/**
 * Statistics for a sync operation
 */
export interface SyncStats {
  created: number;
  updated: number;
  unchanged: number;
}

/**
 * Response from backend after sync
 * Matches backend SyncResponseSchema
 */
export interface SyncResponse {
  success: boolean;
  courses: SyncStats;
  assignments: SyncStats;
  syncedAt: string; // ISO datetime string
}

/**
 * Error response from backend
 */
export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: Record<string, unknown>;
}

// ========================================
// Extension Message Types
// ========================================

/**
 * Message types for communication between extension components
 */
export type ExtensionMessageType =
  // Scraping
  | "SCRAPE_REQUEST"
  | "SCRAPE_COURSES"
  | "SCRAPE_ASSIGNMENTS"
  | "SCRAPE_ALL"
  | "SCRAPE_COMPLETE"
  | "GET_COURSE_SECTIONS"
  | "FETCH_SECTIONS_FOR_COURSES"
  // Sync
  | "SYNC_TO_BACKEND"
  | "SYNC_ASSIGNMENTS_BACKGROUND"
  | "SYNC_COMPLETE"
  | "SYNC_ERROR"
  // Status
  | "GET_STATUS"
  | "GET_PAGE_INFO"
  | "STATUS_UPDATE"
  // Auth
  | "SET_AUTH_TOKEN"
  | "GET_AUTH_TOKEN"
  | "CLEAR_AUTH_TOKEN"
  | "AUTH_STATUS"
  // Moodle Login
  | "CHECK_MOODLE_LOGIN"
  | "MOODLE_LOGIN_STATUS"
  // Webapp Communication
  | "SET_WEBAPP_TAB"
  | "NOTIFY_WEBAPP"
  | "WEBAPP_OPEN_MOODLE_AND_GET_COURSES"
  | "WEBAPP_GET_SECTIONS_FOR_COURSES"
  | "WEBAPP_SYNC_SELECTED_COURSES"
  | "WEBAPP_DETECT_MOODLE_URL"
  | "WEBAPP_SYNC_REQUEST";

/**
 * Generic extension message structure
 */
export interface ExtensionMessage<T = unknown> {
  type: ExtensionMessageType;
  payload?: T;
}

// ========================================
// Webapp ↔ Extension Communication Types
// ========================================

/**
 * Moodle course data (simplified for webapp communication)
 */
export interface MoodleCourse {
  moodleId: string;
  name: string;
  url: string;
}

/**
 * Commands sent from webapp to extension
 * Sent via CustomEvent 'semesterhub-webapp-command'
 */
export type WebappCommand =
  | { action: 'openMoodleAndGetCourses'; moodleUrl: string }
  | { action: 'getSectionsForCourses'; courses: string[]; moodleUrl: string }
  | { action: 'syncSelectedCourses'; courses: { moodleId: string; selectedSections: string[] }[]; moodleUrl: string }
  | { action: 'detectMoodleUrl' };

/**
 * Events sent from extension to webapp via CustomEvents
 *
 * Event names:
 * - 'semesterhub-moodle-login-required'    // No payload
 * - 'semesterhub-moodle-login-success'     // No payload
 * - 'semesterhub-courses-ready'            // { courses: MoodleCourse[] }
 * - 'semesterhub-sections-ready'           // { sections: Record<string, string[]> }
 * - 'semesterhub-sync-progress'            // { current: number; total: number; courseName: string }
 * - 'semesterhub-sync-complete'            // { success: boolean; coursesCount?: number; error?: string }
 * - 'semesterhub-moodle-url-detected'      // { moodleUrl: string | null }
 */

export interface WebappEventPayloads {
  'semesterhub-moodle-login-required': undefined;
  'semesterhub-moodle-login-success': undefined;
  'semesterhub-courses-ready': { courses: MoodleCourse[] };
  'semesterhub-sections-ready': { sections: Record<string, string[]> };
  'semesterhub-sync-progress': { current: number; total: number; courseName: string };
  'semesterhub-sync-complete': { success: boolean; coursesCount?: number; error?: string };
  'semesterhub-moodle-url-detected': { moodleUrl: string | null };
}

/**
 * Moodle login status payload
 */
export interface MoodleLoginStatus {
  isLoggedIn: boolean;
}

/**
 * Payload for SCRAPE_COMPLETE message
 */
export interface ScrapeCompletePayload {
  courses: ScrapedCourse[];
  assignments: ScrapedAssignment[];
  universityId: UniversityId;
  moodleUrl: string;
}

/**
 * Page info returned by content script
 */
export interface PageInfo {
  isMoodlePage: boolean;
  isDashboard: boolean;
  isCoursePage: boolean;
  isAssignmentIndexPage?: boolean;
  currentCourseId: string | null;
  currentCourseName?: string | null;
  universityId: UniversityId | null;
  universityName?: string | null;
  moodleVersion?: MoodleVersion;
}

/**
 * Scrape progress update
 */
export interface ScrapeProgress {
  stage: "courses" | "assignments" | "complete";
  message: string;
  current?: number;
  total?: number;
}

// ========================================
// Storage Types
// ========================================

/**
 * Extension storage data structure
 */
export interface ExtensionStorage {
  authToken?: string;
  tokenExpiresAt?: string;
  lastSyncTime?: number; // Unix timestamp
  syncHistory?: SyncHistoryEntry[];
  preferences?: ExtensionPreferences;
}

/**
 * Sync history entry
 */
export interface SyncHistoryEntry {
  timestamp: number; // Unix timestamp
  universityId: UniversityId;
  coursesCount: number;
  assignmentsCount: number;
  success: boolean;
  error?: string;
}

/**
 * Extension preferences
 */
export interface ExtensionPreferences {
  autoSync?: boolean;
  syncOnPageLoad?: boolean;
  showNotifications?: boolean;
}

// ========================================
// Auth Types
// ========================================

/**
 * Authentication status
 */
export interface AuthStatus {
  isAuthenticated: boolean;
  user?: {
    id?: string;
    name: string;
    email: string;
  };
  tokenExpiresAt?: string;
  /** Error message if authentication check failed (e.g., network error) */
  error?: string;
}

/**
 * Token response from /api/extension/token
 */
export interface TokenResponse {
  token: string;
  expiresAt: string;
}

/**
 * Verify response from /api/extension/verify
 */
export interface VerifyResponse {
  valid: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// ========================================
// Status Types
// ========================================

/**
 * Sync status for display
 */
export type SyncStatusType =
  | "idle"
  | "checking"
  | "scraping"
  | "syncing"
  | "success"
  | "error";

/**
 * Current sync status
 */
export interface SyncStatus {
  status: SyncStatusType;
  isSyncing: boolean;
  lastSyncTime: number | null;
  lastSyncResult: SyncResponse | null;
  error: string | null;
  progress?: ScrapeProgress;
}

// ========================================
// Utility Types
// ========================================

/**
 * Result type for operations that can fail
 */
export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Async result type
 */
export type AsyncResult<T, E = string> = Promise<Result<T, E>>;

/**
 * Type guard for successful result
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Type guard for failed result
 */
export function isError<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return result.success === false;
}
