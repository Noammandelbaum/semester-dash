/**
 * Sync Handler for SemesterHub popup
 * Handles sync operations from the popup UI
 */

import { sendMessage, sendMessageSafe } from '../services/message.service';
import { createError, ExtensionError, isExtensionError } from '../../shared/errors';
import type {
  ScrapedCourse,
  SyncStatus,
  SyncResponse,
  ExtensionMessage,
} from '../../shared/types';

/**
 * UI Callbacks for sync operations
 */
export interface SyncUICallbacks {
  /**
   * Called when sync operation starts
   */
  onSyncStarted: () => void;

  /**
   * Called during sync with progress updates
   * @param message - Progress message to display (e.g., "מאסף משימות מ: קורס א'")
   */
  onSyncProgress: (message: string) => void;

  /**
   * Called when sync completes successfully
   * @param result - Sync result with statistics
   */
  onSyncComplete: (result: SyncResponse) => void;

  /**
   * Called when sync fails
   * @param error - User-friendly error message
   */
  onSyncError: (error: string) => void;

  /**
   * Called when courses are loaded from Moodle
   * @param courses - Array of scraped courses
   */
  onCoursesLoaded: (courses: ScrapedCourse[]) => void;
}

/**
 * Sync Handler
 * Manages sync operations with proper error handling and UI feedback
 */
export class SyncHandler {
  private callbacks: SyncUICallbacks;

  constructor(callbacks: SyncUICallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Sync selected courses to the backend
   * This triggers background assignment scraping and sync
   *
   * @param selectedCourseIds - Array of Moodle course IDs to sync
   * @throws ExtensionError if sync fails
   */
  async handleSyncCourses(selectedCourseIds: string[]): Promise<void> {
    if (!selectedCourseIds || selectedCourseIds.length === 0) {
      this.callbacks.onSyncError('לא נבחרו קורסים לסנכרון');
      return;
    }

    try {
      // Notify UI that sync started
      this.callbacks.onSyncStarted();

      // Get stored courses and university info
      const storage = await chrome.storage.local.get([
        'scrapedCourses',
        'syncedUniversityId',
        'syncedMoodleUrl',
      ]);

      if (!storage.scrapedCourses || storage.scrapedCourses.length === 0) {
        throw createError('E4001', { reason: 'No courses found in storage' });
      }

      // Filter to selected courses only
      const allCourses = storage.scrapedCourses as ScrapedCourse[];
      const selectedCourses = allCourses.filter((course) =>
        selectedCourseIds.includes(course.moodleId)
      );

      if (selectedCourses.length === 0) {
        throw createError('E4001', { reason: 'Selected courses not found' });
      }

      // Send sync request to background
      const message: ExtensionMessage = {
        type: 'SYNC_ASSIGNMENTS_BACKGROUND',
        payload: {
          courses: selectedCourses.map((c) => ({
            moodleId: c.moodleId,
            name: c.name,
            url: c.url,
          })),
          universityId: storage.syncedUniversityId || 'unknown',
          moodleUrl: storage.syncedMoodleUrl || '',
        },
      };

      // Listen for status updates during sync
      const statusListener = (msg: ExtensionMessage<SyncStatus>) => {
        if (msg.type === 'STATUS_UPDATE' && msg.payload?.progress?.message) {
          this.callbacks.onSyncProgress(msg.payload.progress.message);
        }
      };

      chrome.runtime.onMessage.addListener(statusListener);

      try {
        const result = await sendMessage<{
          success: boolean;
          assignments: unknown[];
          error?: string;
        }>(message, {
          timeout: 300000, // 5 minutes for background scraping
          timeoutErrorCode: 'E4003',
        });

        chrome.runtime.onMessage.removeListener(statusListener);

        if (!result.success) {
          throw createError('E5002', {
            error: result.error || 'Unknown sync error',
          });
        }

        // Get final status to retrieve sync result
        const status = await this.getStatus();

        if (status.lastSyncResult) {
          this.callbacks.onSyncComplete(status.lastSyncResult);
        } else {
          // Create a basic success response
          const syncResponse: SyncResponse = {
            success: true,
            courses: { created: 0, updated: selectedCourses.length, unchanged: 0 },
            assignments: {
              created: result.assignments?.length || 0,
              updated: 0,
              unchanged: 0,
            },
            syncedAt: new Date().toISOString(),
          };
          this.callbacks.onSyncComplete(syncResponse);
        }
      } catch (error) {
        chrome.runtime.onMessage.removeListener(statusListener);
        throw error;
      }
    } catch (error) {
      console.error('[SyncHandler] Sync failed:', error);

      const errorMessage = isExtensionError(error)
        ? error.userMessage
        : error instanceof Error
          ? error.message
          : 'אירעה שגיאה בסנכרון';

      this.callbacks.onSyncError(errorMessage);
      throw error;
    }
  }

  /**
   * Refresh courses from Moodle
   * Opens the Moodle page and scrapes current course list
   *
   * @returns Array of scraped courses
   * @throws ExtensionError if scraping fails
   */
  async handleRefreshCourses(): Promise<ScrapedCourse[]> {
    try {
      // Send scrape request to background/content script
      const result = await sendMessage<{ courses: ScrapedCourse[] }>(
        { type: 'SCRAPE_COURSES' },
        {
          timeout: 30000, // 30 seconds for scraping
          timeoutErrorCode: 'E4003',
        }
      );

      if (!result.courses || !Array.isArray(result.courses)) {
        throw createError('E4001', { reason: 'Invalid courses data' });
      }

      // Store scraped courses
      await chrome.storage.local.set({ scrapedCourses: result.courses });

      // Notify UI
      this.callbacks.onCoursesLoaded(result.courses);

      return result.courses;
    } catch (error) {
      console.error('[SyncHandler] Refresh courses failed:', error);

      const errorMessage = isExtensionError(error)
        ? error.userMessage
        : error instanceof Error
          ? error.message
          : 'שגיאה בטעינת קורסים';

      this.callbacks.onSyncError(errorMessage);
      throw error;
    }
  }

  /**
   * Get current sync status from background
   *
   * @returns Current sync status
   */
  async getStatus(): Promise<SyncStatus> {
    try {
      const response = await sendMessage<SyncStatus & { authStatus: unknown }>({
        type: 'GET_STATUS',
      });

      // Extract just the sync status fields
      const {
        status,
        isSyncing,
        lastSyncTime,
        lastSyncResult,
        error,
        progress,
      } = response;

      return {
        status,
        isSyncing,
        lastSyncTime,
        lastSyncResult,
        error,
        progress,
      };
    } catch (error) {
      console.error('[SyncHandler] Failed to get status:', error);

      // Return default idle status on error
      return {
        status: 'idle',
        isSyncing: false,
        lastSyncTime: null,
        lastSyncResult: null,
        error: null,
      };
    }
  }

  /**
   * Get stored courses from local storage
   * Useful for displaying previously scraped courses
   *
   * @returns Array of stored courses, or empty array if none
   */
  async getStoredCourses(): Promise<ScrapedCourse[]> {
    try {
      const result = await chrome.storage.local.get('scrapedCourses');
      return (result.scrapedCourses as ScrapedCourse[]) || [];
    } catch (error) {
      console.error('[SyncHandler] Failed to get stored courses:', error);
      return [];
    }
  }

  /**
   * Clear stored courses
   * Useful when switching universities or resetting
   */
  async clearStoredCourses(): Promise<void> {
    try {
      await chrome.storage.local.remove('scrapedCourses');
    } catch (error) {
      console.error('[SyncHandler] Failed to clear stored courses:', error);
    }
  }
}

/**
 * Factory function to create sync handler with callbacks
 *
 * @param callbacks - UI callbacks for sync events
 * @returns Configured SyncHandler instance
 *
 * @example
 * ```typescript
 * const syncHandler = createSyncHandler({
 *   onSyncStarted: () => showSpinner(),
 *   onSyncProgress: (msg) => updateStatus(msg),
 *   onSyncComplete: (result) => showSuccess(result),
 *   onSyncError: (error) => showError(error),
 *   onCoursesLoaded: (courses) => displayCourses(courses),
 * });
 *
 * await syncHandler.handleRefreshCourses();
 * await syncHandler.handleSyncCourses(['12345', '67890']);
 * ```
 */
export function createSyncHandler(callbacks: SyncUICallbacks): SyncHandler {
  return new SyncHandler(callbacks);
}
