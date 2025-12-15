/**
 * Message Router for SemesterHub Chrome Extension
 * Central routing module that delegates incoming messages to appropriate handlers
 */

import { authHandler } from './handlers/auth.handler';
import { syncHandler } from './handlers/sync.handler';
import { scrapeHandler } from './handlers/scrape.handler';
import { webappHandler } from './handlers/webapp.handler';
import { statusService } from './services/status.service';
import { tabManager } from './services/tab-manager.service';
import type {
  ExtensionMessage,
  ExtensionMessageType,
  PageInfo,
  ScrapedCourse,
  ScrapedAssignment,
  SyncPayload,
} from '../shared/types';

/**
 * Scrape message types that should be forwarded to content scripts
 */
const SCRAPE_MESSAGE_TYPES: ExtensionMessageType[] = [
  'SCRAPE_REQUEST',
  'SCRAPE_COURSES',
  'SCRAPE_ASSIGNMENTS',
  'SCRAPE_ALL',
  'GET_PAGE_INFO',
  'GET_COURSE_SECTIONS',
];

/**
 * Message Router Class
 * Routes incoming messages to appropriate handlers based on message type
 */
export class MessageRouter {
  /**
   * Route a message to the appropriate handler
   *
   * @param message - The extension message to route
   * @param sender - The sender of the message
   * @returns Promise resolving to the handler's response
   * @throws Error for unknown message types
   */
  async route(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<unknown> {
    const { type, payload } = message;

    // Auth messages
    if (type === 'GET_STATUS') {
      // Get fresh auth status (validates token with backend)
      console.log('[MessageRouter] GET_STATUS - fetching fresh auth status...');
      const authStatus = await authHandler.handleGetAuthStatus();
      console.log('[MessageRouter] GET_STATUS - authStatus:', authStatus);
      return {
        ...statusService.getSyncStatus(),
        authStatus,
      };
    }

    if (type === 'SET_AUTH_TOKEN') {
      const { token, expiresAt } = payload as { token: string; expiresAt: string };
      return authHandler.handleSetAuthToken(token, expiresAt);
    }

    if (type === 'GET_AUTH_TOKEN') {
      return authHandler.handleGetAuthToken();
    }

    if (type === 'CLEAR_AUTH_TOKEN') {
      return authHandler.handleClearAuthToken();
    }

    if (type === 'AUTH_STATUS') {
      return authHandler.handleGetAuthStatus();
    }

    // Sync messages
    if (type === 'SYNC_TO_BACKEND') {
      return syncHandler.handleSyncToBackend(payload as SyncPayload);
    }

    if (type === 'SYNC_ASSIGNMENTS_BACKGROUND') {
      const { courses, moodleUrl } = payload as {
        courses: Array<{ moodleId: string; name: string; url: string; selectedSections?: string[] }>;
        moodleUrl: string;
      };
      return syncHandler.handleSyncAssignmentsBackground(courses, moodleUrl);
    }

    if (type === 'FETCH_SECTIONS_FOR_COURSES') {
      const { courses, moodleUrl } = payload as {
        courses: Array<{ moodleId: string }>;
        moodleUrl: string;
      };
      return syncHandler.handleFetchSectionsForCourses(courses, moodleUrl);
    }

    // Scrape messages - forward to content script via active tab
    if (SCRAPE_MESSAGE_TYPES.includes(type)) {
      return this.forwardToContentScript(message);
    }

    // Webapp messages
    if (type === 'SET_WEBAPP_TAB') {
      if (sender.tab?.id) {
        webappHandler.setWebappTab(sender.tab.id);
        return { success: true };
      }
      return { success: false, error: 'No tab ID provided' };
    }

    if (type === 'WEBAPP_OPEN_MOODLE_AND_GET_COURSES') {
      const { moodleUrl } = payload as { moodleUrl: string };
      // Fire and forget - handler will notify webapp via events
      webappHandler.handleOpenMoodleAndGetCourses(moodleUrl);
      return { success: true };
    }

    if (type === 'WEBAPP_GET_SECTIONS_FOR_COURSES') {
      const { courses, moodleUrl } = payload as { courses: string[]; moodleUrl: string };
      // Fire and forget - handler will notify webapp via events
      webappHandler.handleGetSectionsForCourses(courses, moodleUrl);
      return { success: true };
    }

    if (type === 'WEBAPP_SYNC_SELECTED_COURSES') {
      const { courses, moodleUrl } = payload as {
        courses: Array<{ moodleId: string; selectedSections: string[] }>;
        moodleUrl: string;
      };
      // Fire and forget - handler will notify webapp via events
      webappHandler.handleSyncSelectedCourses(courses, moodleUrl);
      return { success: true };
    }

    if (type === 'WEBAPP_DETECT_MOODLE_URL') {
      // Fire and forget - handler will notify webapp via events
      webappHandler.handleDetectMoodleUrl();
      return { success: true };
    }

    if (type === 'WEBAPP_SYNC_REQUEST') {
      return this.handleWebappSyncRequest(payload as { action?: string } | undefined);
    }

    // Unknown message type
    throw new Error(`Unknown message type: ${type}`);
  }

  /**
   * Forward message to active tab's content script
   * Returns a default response if content script is not available
   *
   * @param message - The message to forward
   * @returns Response from content script or default response
   */
  private async forwardToContentScript(message: ExtensionMessage): Promise<unknown> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id || !tab.url) {
        return this.getDefaultResponseForMessage(message);
      }

      const url = tab.url;

      // For GET_PAGE_INFO, we can determine this from URL without content script
      if (message.type === 'GET_PAGE_INFO') {
        return this.getPageInfoFromUrl(url);
      }

      // For scraping, we need the content script
      try {
        return await chrome.tabs.sendMessage(tab.id, message);
      } catch {
        // Content script not available
        return this.getDefaultResponseForMessage(message);
      }
    } catch {
      return this.getDefaultResponseForMessage(message);
    }
  }

  /**
   * Get default response for messages when content script is not available
   *
   * @param message - The message that failed
   * @returns Default response based on message type
   */
  private getDefaultResponseForMessage(message: ExtensionMessage): unknown {
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
      case 'GET_COURSE_SECTIONS':
        return { sections: [] };
      default:
        return { error: 'Content script not available' };
    }
  }

  /**
   * Determine page info from URL alone (no content script needed)
   *
   * @param url - The tab URL
   * @returns Page information
   */
  private getPageInfoFromUrl(url: string): PageInfo {
    const urlLower = url.toLowerCase();

    // Check if it's a Moodle page
    const isMoodlePage =
      urlLower.includes('moodle') ||
      urlLower.includes('/course/') ||
      urlLower.includes('/my/') ||
      urlLower.includes('/mod/');

    if (!isMoodlePage) {
      return {
        isMoodlePage: false,
        isDashboard: false,
        isCoursePage: false,
        currentCourseId: null,
        universityId: null,
      };
    }

    // Determine page type
    const isDashboard = urlLower.includes('/my/') || urlLower.includes('/my?');
    const isCoursePage = urlLower.includes('/course/view.php');

    // Extract course ID
    let currentCourseId: string | null = null;
    const courseIdMatch = url.match(/[?&]id=(\d+)/);
    if (courseIdMatch && isCoursePage) {
      currentCourseId = courseIdMatch[1];
    }

    // Extract university ID from hostname
    let universityId: string | null = null;
    try {
      const hostname = new URL(url).hostname;
      // Pattern: moodle.XXX.ac.il -> XXX
      const match = hostname.match(/moodle\.([^.]+)\./);
      if (match) {
        universityId = match[1];
      }
    } catch {
      // Invalid URL
    }

    return {
      isMoodlePage,
      isDashboard,
      isCoursePage,
      currentCourseId,
      universityId,
    };
  }

  /**
   * Handle legacy webapp sync request
   * This is for backwards compatibility with older webapp code
   *
   * @param payload - Optional payload with action
   * @returns Sync result
   */
  private async handleWebappSyncRequest(payload?: { action?: string }): Promise<{
    success: boolean;
    message: string;
    assignmentsCount?: number;
  }> {
    console.log('[MessageRouter] Webapp requested sync (legacy):', payload);

    // Get stored courses configuration
    const { syncedCourses, syncedUniversityId, syncedMoodleUrl } = await chrome.storage.local.get([
      'syncedCourses',
      'syncedUniversityId',
      'syncedMoodleUrl',
    ]);

    if (!syncedCourses || syncedCourses.length === 0) {
      return {
        success: false,
        message: 'No courses configured. Please set up courses in the extension first.',
      };
    }

    // Check if authenticated
    const authStatus = await authHandler.handleGetAuthStatus();
    if (!authStatus.isAuthenticated) {
      return {
        success: false,
        message: 'Not authenticated. Please log in via the extension.',
      };
    }

    // Trigger background assignment sync
    try {
      const result = await syncHandler.handleSyncAssignmentsBackground(
        syncedCourses,
        syncedMoodleUrl || ''
      );

      return {
        success: result.success,
        message: result.success
          ? `Synced assignments successfully`
          : 'Sync failed',
        assignmentsCount: result.assignments?.created + result.assignments?.updated || 0,
      };
    } catch (error) {
      console.error('[MessageRouter] Webapp sync request failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const messageRouter = new MessageRouter();
