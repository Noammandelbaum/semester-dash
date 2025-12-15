/**
 * Webapp Handler for SemesterHub extension
 * Manages communication between the extension and the SemesterHub webapp
 *
 * Communication flow:
 * 1. Webapp dispatches CustomEvent → content-script-webapp.ts
 * 2. Content script forwards to service worker → this handler
 * 3. Handler processes and calls notifyWebapp() to send results back
 * 4. Service worker → content script → webapp via CustomEvent
 */

import { tabManager } from '../services/tab-manager.service';
import { statusService } from '../services/status.service';
import { createError } from '../../shared/errors';
import type { MoodleCourse, ScrapedCourse, ScrapedAssignment } from '../../shared/types';
import { TIMEOUTS, SYNC } from '../../shared/constants';
import { isMoodleUrl } from '../../shared/config';

/**
 * Webapp Handler Class
 * Manages all communication with the SemesterHub webapp
 */
export class WebappHandler {
  private webappTabId: number | null = null;

  /**
   * Set the webapp tab ID when content script loads
   * Called from service worker when receiving SET_WEBAPP_TAB message
   */
  setWebappTab(tabId: number): void {
    this.webappTabId = tabId;
    console.log('[WebappHandler] Webapp tab registered:', tabId);
  }

  /**
   * Clear webapp tab reference (e.g., when tab is closed)
   */
  clearWebappTab(): void {
    this.webappTabId = null;
    console.log('[WebappHandler] Webapp tab cleared');
  }

  /**
   * Send event to webapp via content script
   * Events are dispatched as CustomEvents on the webapp's document
   *
   * @param eventName - The CustomEvent name (e.g., 'semesterhub-courses-ready')
   * @param data - Optional event payload
   */
  async notifyWebapp(eventName: string, data?: any): Promise<void> {
    if (!this.webappTabId) {
      console.warn('[WebappHandler] No webapp tab ID set, cannot notify webapp');
      return;
    }

    try {
      await chrome.tabs.sendMessage(this.webappTabId, {
        type: 'NOTIFY_WEBAPP',
        payload: { eventName, data },
      });
      console.log('[WebappHandler] Notified webapp:', eventName, data);
    } catch (error) {
      console.error('[WebappHandler] Failed to notify webapp:', error);
      // Clear tab ID if it no longer exists
      if (error instanceof Error && error.message.includes('Receiving end does not exist')) {
        this.clearWebappTab();
      }
    }
  }

  /**
   * Open Moodle in popup window, wait for login if needed, scrape courses
   * Flow:
   * 1. Open Moodle popup
   * 2. Check login status
   * 3. If not logged in: notify webapp, wait for login
   * 4. Scrape courses
   * 5. Send courses to webapp
   *
   * @param moodleUrl - Base Moodle URL (e.g., 'https://moodle.tau.ac.il')
   */
  async handleOpenMoodleAndGetCourses(moodleUrl: string): Promise<void> {
    console.log('[WebappHandler] Opening Moodle and getting courses:', moodleUrl);
    statusService.updateStatus('checking', {
      progress: {
        stage: 'courses',
        message: 'פותח את Moodle...',
      },
    });

    let windowId: number | null = null;
    let tabId: number | null = null;

    try {
      // 1. Open Moodle popup window (courses page)
      const coursesUrl = `${moodleUrl}/my/courses.php`;
      console.log('[WebappHandler] Creating popup window for:', coursesUrl);

      const popup = await tabManager.createPopupWindow(coursesUrl, {
        width: 1000,
        height: 700,
        focused: true,
      });
      windowId = popup.windowId;
      tabId = popup.tabId;
      console.log('[WebappHandler] Popup created - windowId:', windowId, 'tabId:', tabId);

      // 2. Wait for page to load
      console.log('[WebappHandler] Waiting for tab to load...');
      await tabManager.waitForTabLoad(tabId, coursesUrl);
      console.log('[WebappHandler] Tab loaded, waiting for content script to initialize...');
      await this.sleep(1000); // Give content script time to initialize
      console.log('[WebappHandler] Content script init delay complete');

      // 3. Check login status
      let isLoggedIn = false;
      try {
        console.log('[WebappHandler] Checking Moodle login status...');
        const loginStatus = await tabManager.sendMessageToTab<{ isLoggedIn: boolean }>(
          tabId,
          { type: 'CHECK_MOODLE_LOGIN' }
        );
        console.log('[WebappHandler] Login status response:', loginStatus);
        isLoggedIn = loginStatus.isLoggedIn;
      } catch (error) {
        console.warn('[WebappHandler] Failed to check login status, assuming not logged in:', error);
        isLoggedIn = false;
      }

      // 4. If not logged in, notify webapp and wait
      if (!isLoggedIn) {
        console.log('[WebappHandler] User not logged in, waiting for login...');
        this.notifyWebapp('semesterhub-moodle-login-required');
        statusService.updateStatus('checking', {
          progress: {
            stage: 'courses',
            message: 'ממתין להתחברות ל-Moodle...',
          },
        });

        try {
          await this.waitForMoodleLogin(windowId, tabId, TIMEOUTS.MOODLE_LOGIN);
          this.notifyWebapp('semesterhub-moodle-login-success');

          // Navigate to courses page after login
          await chrome.tabs.update(tabId, { url: coursesUrl });
          await tabManager.waitForTabLoad(tabId, coursesUrl);
          await this.sleep(1000);
        } catch (error: any) {
          if (error.message === 'WINDOW_CLOSED') {
            this.notifyWebapp('semesterhub-sync-complete', {
              success: false,
              error: 'החלון נסגר לפני סיום ההתחברות',
            });
          } else if (error.message === 'LOGIN_TIMEOUT') {
            this.notifyWebapp('semesterhub-sync-complete', {
              success: false,
              error: 'הזמן הקצוב להתחברות עבר',
            });
          } else {
            this.notifyWebapp('semesterhub-sync-complete', {
              success: false,
              error: 'שגיאה בהתחברות',
            });
          }
          await tabManager.closeWindow(windowId);
          statusService.resetToIdle();
          return;
        }
      }

      // 5. Scrape courses
      statusService.updateStatus('scraping', {
        progress: {
          stage: 'courses',
          message: 'אוסף קורסים מ-Moodle...',
        },
      });

      const scrapedData = await tabManager.sendMessageToTab<{ courses: ScrapedCourse[] }>(
        tabId,
        { type: 'SCRAPE_COURSES' }
      );

      // 6. Close popup
      await tabManager.closeWindow(windowId);

      // 7. Convert to MoodleCourse format and send to webapp
      const courses: MoodleCourse[] = (scrapedData.courses || []).map(course => ({
        moodleId: course.moodleId,
        name: course.name,
        url: course.url,
      }));

      console.log('[WebappHandler] Scraped courses:', courses.length);
      this.notifyWebapp('semesterhub-courses-ready', { courses });
      statusService.resetToIdle();

    } catch (error) {
      console.error('[WebappHandler] Error in handleOpenMoodleAndGetCourses:', error);

      // Close popup if still open
      if (windowId) {
        await tabManager.closeWindow(windowId);
      }

      this.notifyWebapp('semesterhub-sync-complete', {
        success: false,
        error: 'אירעה שגיאה בטעינת הקורסים',
      });
      statusService.setError('שגיאה בטעינת קורסים');
    }
  }

  /**
   * Get sections for selected courses using background tabs
   * Opens each course's assignment index page and scrapes section names
   *
   * @param courses - Array of course moodleIds (strings)
   * @param moodleUrl - Base Moodle URL
   */
  async handleGetSectionsForCourses(courses: string[], moodleUrl: string): Promise<void> {
    console.log('[WebappHandler] Getting sections for', courses.length, 'courses');
    statusService.updateStatus('scraping', {
      progress: {
        stage: 'courses',
        message: 'טוען יחידות הוראה...',
        current: 0,
        total: courses.length,
      },
    });

    try {
      const sections: Record<string, string[]> = {};

      for (let i = 0; i < courses.length; i++) {
        const courseId = courses[i];

        statusService.updateProgress({
          stage: 'courses',
          message: `טוען יחידות הוראה (${i + 1}/${courses.length})...`,
          current: i + 1,
          total: courses.length,
        });

        try {
          // Open background tab for assignment index page
          const assignmentIndexUrl = `${moodleUrl}/mod/assign/index.php?id=${courseId}`;

          await tabManager.withTab(assignmentIndexUrl, async (tabId) => {
            // Get sections from content script
            const result = await tabManager.sendMessageToTab<{ sections: string[] }>(
              tabId,
              {
                type: 'GET_COURSE_SECTIONS',
                payload: { courseMoodleId: courseId },
              }
            );

            sections[courseId] = result.sections || [];
            console.log(`[WebappHandler] Found ${result.sections?.length || 0} sections for course ${courseId}`);
          });

        } catch (error) {
          console.warn(`[WebappHandler] Failed to get sections for course ${courseId}:`, error);
          sections[courseId] = [];
        }
      }

      console.log('[WebappHandler] Sections result:', sections);
      this.notifyWebapp('semesterhub-sections-ready', { sections });
      statusService.resetToIdle();

    } catch (error) {
      console.error('[WebappHandler] Error in handleGetSectionsForCourses:', error);
      this.notifyWebapp('semesterhub-sync-complete', {
        success: false,
        error: 'אירעה שגיאה בטעינת יחידות ההוראה',
      });
      statusService.setError('שגיאה בטעינת יחידות הוראה');
    }
  }

  /**
   * Sync assignments for selected courses with section filtering
   * Opens background tabs, scrapes assignments, sends data back to webapp
   *
   * @param courses - Array of course objects with moodleId and selectedSections
   * @param moodleUrl - Base Moodle URL
   */
  async handleSyncSelectedCourses(
    courses: Array<{ moodleId: string; selectedSections: string[] }>,
    moodleUrl: string
  ): Promise<void> {
    console.log('[WebappHandler] Syncing', courses.length, 'selected courses');
    statusService.updateStatus('syncing', {
      progress: {
        stage: 'assignments',
        message: 'מתחיל סנכרון משימות...',
        current: 0,
        total: courses.length,
      },
    });

    try {
      const allAssignments: ScrapedAssignment[] = [];
      const coursesData: Array<{ moodleId: string; name: string; url: string }> = [];

      for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        const courseName = `קורס ${course.moodleId}`;

        // Notify progress
        this.notifyWebapp('semesterhub-sync-progress', {
          current: i + 1,
          total: courses.length,
          courseName,
        });

        statusService.updateProgress({
          stage: 'assignments',
          message: `מאסף משימות (${i + 1}/${courses.length})...`,
          current: i + 1,
          total: courses.length,
        });

        // Build course data for response
        coursesData.push({
          moodleId: course.moodleId,
          name: courseName,
          url: `${moodleUrl}/course/view.php?id=${course.moodleId}`,
        });

        try {
          // Open background tab for assignment scraping
          const assignmentIndexUrl = `${moodleUrl}/mod/assign/index.php?id=${course.moodleId}`;

          await tabManager.withTab(assignmentIndexUrl, async (tabId) => {
            // Scrape assignments with section filtering
            const result = await tabManager.sendMessageToTab<{ assignments: ScrapedAssignment[] }>(
              tabId,
              {
                type: 'SCRAPE_ASSIGNMENTS',
                payload: {
                  courseMoodleId: course.moodleId,
                  filterSections: course.selectedSections.length > 0
                    ? course.selectedSections
                    : undefined,
                },
              }
            );

            if (result.assignments && Array.isArray(result.assignments)) {
              allAssignments.push(...result.assignments);
              console.log(`[WebappHandler] Found ${result.assignments.length} assignments for course ${course.moodleId}`);
            }
          });

        } catch (error) {
          console.warn(`[WebappHandler] Failed to scrape assignments for course ${course.moodleId}:`, error);
        }
      }

      console.log(`[WebappHandler] Sync complete. Total assignments: ${allAssignments.length}`);

      // Send scraped data back to webapp for API call
      this.notifyWebapp('semesterhub-sync-complete', {
        success: true,
        coursesCount: courses.length,
        moodleUrl,
        courses: coursesData,
        assignments: allAssignments,
      });

      statusService.updateStatus('success', {
        progress: {
          stage: 'complete',
          message: `אספנו ${allAssignments.length} משימות`,
        },
      });

      // Reset to idle after delay
      setTimeout(() => statusService.resetToIdle(), 3000);

    } catch (error) {
      console.error('[WebappHandler] Error in handleSyncSelectedCourses:', error);
      this.notifyWebapp('semesterhub-sync-complete', {
        success: false,
        error: 'אירעה שגיאה בסנכרון',
      });
      statusService.setError('שגיאה בסנכרון משימות');
    }
  }

  /**
   * Detect Moodle URL from currently open tabs
   * Searches all open tabs for Moodle pages and returns the base URL
   */
  async handleDetectMoodleUrl(): Promise<void> {
    console.log('[WebappHandler] Detecting Moodle URL from open tabs');

    try {
      const moodleUrl = await this.detectMoodleUrlFromTabs();
      console.log('[WebappHandler] Detected Moodle URL:', moodleUrl);
      this.notifyWebapp('semesterhub-moodle-url-detected', { moodleUrl });
    } catch (error) {
      console.error('[WebappHandler] Error detecting Moodle URL:', error);
      this.notifyWebapp('semesterhub-moodle-url-detected', { moodleUrl: null });
    }
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Wait for user to login to Moodle
   * Monitors login status from content script
   * Returns when logged in or throws on timeout/window close
   */
  private async waitForMoodleLogin(windowId: number, tabId: number, timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      // Listen for login status updates from content script
      const loginListener = (
        message: { type: string; payload?: any },
        sender: chrome.runtime.MessageSender
      ) => {
        if (message.type === 'MOODLE_LOGIN_STATUS' && sender.tab?.id === tabId) {
          const payload = message.payload as { isLoggedIn: boolean };
          if (payload?.isLoggedIn) {
            chrome.runtime.onMessage.removeListener(loginListener);
            clearInterval(windowCheckInterval);
            resolve();
          }
        }
      };

      chrome.runtime.onMessage.addListener(loginListener);

      // Check if window was closed and timeout
      const windowCheckInterval = setInterval(async () => {
        try {
          // Check if window still exists
          const windowExists = await tabManager.windowExists(windowId);
          if (!windowExists) {
            clearInterval(windowCheckInterval);
            chrome.runtime.onMessage.removeListener(loginListener);
            reject(new Error('WINDOW_CLOSED'));
            return;
          }

          // Check timeout
          if (Date.now() - startTime > timeoutMs) {
            clearInterval(windowCheckInterval);
            chrome.runtime.onMessage.removeListener(loginListener);
            reject(new Error('LOGIN_TIMEOUT'));
          }
        } catch (error) {
          // Window check failed
          clearInterval(windowCheckInterval);
          chrome.runtime.onMessage.removeListener(loginListener);
          reject(new Error('WINDOW_CLOSED'));
        }
      }, 1000);
    });
  }

  /**
   * Detect Moodle URL from currently open tabs
   * Returns the base URL (origin) of the first Moodle tab found
   */
  private async detectMoodleUrlFromTabs(): Promise<string | null> {
    const tabs = await chrome.tabs.query({});

    for (const tab of tabs) {
      if (tab.url && isMoodleUrl(tab.url)) {
        try {
          const url = new URL(tab.url);
          return url.origin; // Returns 'https://moodle.tau.ac.il'
        } catch {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Sleep helper for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const webappHandler = new WebappHandler();
