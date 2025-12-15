/**
 * Scrape Handler for SemesterHub Browser Extension
 * Manages scraping operations in the background service worker
 */

import { tabManager } from '../services/tab-manager.service';
import { statusService } from '../services/status.service';
import { createError, type ExtensionError } from '../../shared/errors';
import type {
  ScrapedCourse,
  ScrapedAssignment,
  PageInfo,
  ExtensionMessage,
} from '../../shared/types';
import {
  validateCourses,
  validateAssignments,
  type ValidationResult,
} from '../../shared/utils/validation';

/**
 * Scrape Handler Class
 * Handles all scraping operations via tab manager and content scripts
 */
export class ScrapeHandler {
  /**
   * Scrape courses from a specific tab
   *
   * @param tabId - Tab ID to scrape from
   * @returns Object containing scraped courses
   * @throws ExtensionError if scraping fails or validation fails
   */
  async handleScrapeCourses(tabId: number): Promise<{ courses: ScrapedCourse[] }> {
    try {
      // Update status
      statusService.updateProgress({
        stage: 'courses',
        message: 'Searching for courses...',
      });

      // Send message to content script
      const message: ExtensionMessage = {
        type: 'SCRAPE_COURSES',
      };

      const response = await tabManager.sendMessageToTab<{ courses: ScrapedCourse[] }>(
        tabId,
        message
      );

      // Validate response
      if (!response || !response.courses) {
        throw createError('E3004', {
          reason: 'Invalid response from content script',
          tabId,
        });
      }

      // Validate courses
      const validationResult = validateCourses(response.courses);
      if (!validationResult.success) {
        throw (validationResult as { success: false; error: ExtensionError }).error;
      }

      const courses = (validationResult as { success: true; data: ScrapedCourse[] }).data;

      // Update status
      statusService.updateProgress({
        stage: 'courses',
        message: `Found ${courses.length} courses`,
      });

      console.log(`[ScrapeHandler] Scraped ${courses.length} courses from tab ${tabId}`);

      return { courses };
    } catch (error) {
      console.error('[ScrapeHandler] Error scraping courses:', error);
      throw error;
    }
  }

  /**
   * Scrape assignments from a specific tab
   *
   * @param tabId - Tab ID to scrape from
   * @param courseMoodleId - Optional course ID to filter by
   * @param filterSections - Optional sections to filter by
   * @returns Object containing scraped assignments
   * @throws ExtensionError if scraping fails or validation fails
   */
  async handleScrapeAssignments(
    tabId: number,
    courseMoodleId?: string,
    filterSections?: string[]
  ): Promise<{ assignments: ScrapedAssignment[] }> {
    try {
      // Update status
      statusService.updateProgress({
        stage: 'assignments',
        message: 'Searching for assignments...',
      });

      // Send message to content script
      const message: ExtensionMessage = {
        type: 'SCRAPE_ASSIGNMENTS',
        payload: { courseMoodleId, filterSections },
      };

      const response = await tabManager.sendMessageToTab<{
        assignments: ScrapedAssignment[];
      }>(tabId, message);

      // Validate response
      if (!response || !response.assignments) {
        throw createError('E3004', {
          reason: 'Invalid response from content script',
          tabId,
        });
      }

      // Validate assignments (lenient - skips invalid ones)
      const validationResult = validateAssignments(response.assignments);
      if (!validationResult.success) {
        throw (validationResult as { success: false; error: ExtensionError }).error;
      }

      const assignments = (validationResult as { success: true; data: ScrapedAssignment[] }).data;

      // Update status
      statusService.updateProgress({
        stage: 'assignments',
        message: `Found ${assignments.length} assignments`,
      });

      console.log(
        `[ScrapeHandler] Scraped ${assignments.length} assignments from tab ${tabId}`
      );

      return { assignments };
    } catch (error) {
      console.error('[ScrapeHandler] Error scraping assignments:', error);
      throw error;
    }
  }

  /**
   * Get page info from a specific tab
   *
   * @param tabId - Tab ID to get info from
   * @returns Page information
   * @throws ExtensionError if getting page info fails
   */
  async handleGetPageInfo(tabId: number): Promise<PageInfo> {
    try {
      // Send message to content script
      const message: ExtensionMessage = {
        type: 'GET_PAGE_INFO',
      };

      const pageInfo = await tabManager.sendMessageToTab<PageInfo>(tabId, message);

      // Validate response
      if (!pageInfo || typeof pageInfo.isMoodlePage !== 'boolean') {
        throw createError('E3004', {
          reason: 'Invalid page info response from content script',
          tabId,
        });
      }

      console.log(`[ScrapeHandler] Got page info from tab ${tabId}:`, pageInfo);

      return pageInfo;
    } catch (error) {
      console.error('[ScrapeHandler] Error getting page info:', error);
      throw error;
    }
  }

  /**
   * Get course sections from a specific tab
   *
   * @param tabId - Tab ID to get sections from
   * @param courseMoodleId - Optional course ID
   * @returns Object containing course sections
   * @throws ExtensionError if getting sections fails
   */
  async handleGetCourseSections(
    tabId: number,
    courseMoodleId?: string
  ): Promise<{ sections: string[] }> {
    try {
      // Update status
      statusService.updateProgress({
        stage: 'courses',
        message: 'Getting course sections...',
      });

      // Send message to content script
      const message: ExtensionMessage = {
        type: 'GET_COURSE_SECTIONS',
        payload: { courseMoodleId },
      };

      const response = await tabManager.sendMessageToTab<{ sections: string[] }>(
        tabId,
        message
      );

      // Validate response
      if (!response || !Array.isArray(response.sections)) {
        throw createError('E3004', {
          reason: 'Invalid sections response from content script',
          tabId,
        });
      }

      const sections = response.sections;

      console.log(
        `[ScrapeHandler] Got ${sections.length} sections from tab ${tabId}`
      );

      return { sections };
    } catch (error) {
      console.error('[ScrapeHandler] Error getting course sections:', error);
      throw error;
    }
  }

  /**
   * Scrape courses from a URL by creating a background tab
   * This is a convenience method that creates a tab, scrapes, and closes it
   *
   * @param moodleUrl - Moodle URL to scrape from
   * @returns Array of scraped courses
   * @throws ExtensionError if tab creation or scraping fails
   */
  async scrapeCoursesFromUrl(moodleUrl: string): Promise<ScrapedCourse[]> {
    try {
      console.log(`[ScrapeHandler] Scraping courses from URL: ${moodleUrl}`);

      // Update status
      statusService.updateStatus('scraping', {
        progress: {
          stage: 'courses',
          message: 'Opening Moodle...',
        },
      });

      // Use tabManager.withTab to ensure cleanup
      const { courses } = await tabManager.withTab(moodleUrl, async (tabId) => {
        return await this.handleScrapeCourses(tabId);
      });

      console.log(
        `[ScrapeHandler] Successfully scraped ${courses.length} courses from URL`
      );

      return courses;
    } catch (error) {
      console.error('[ScrapeHandler] Error scraping courses from URL:', error);
      statusService.setError(
        error instanceof Error ? error.message : 'Failed to scrape courses'
      );
      throw error;
    }
  }

  /**
   * Scrape assignments from a URL by creating a background tab
   * This is a convenience method that creates a tab, scrapes, and closes it
   *
   * @param assignmentIndexUrl - Assignment index URL to scrape from
   * @param courseMoodleId - Optional course ID
   * @param filterSections - Optional sections to filter by
   * @returns Array of scraped assignments
   * @throws ExtensionError if tab creation or scraping fails
   */
  async scrapeAssignmentsFromUrl(
    assignmentIndexUrl: string,
    courseMoodleId?: string,
    filterSections?: string[]
  ): Promise<ScrapedAssignment[]> {
    try {
      console.log(
        `[ScrapeHandler] Scraping assignments from URL: ${assignmentIndexUrl}`
      );

      // Update status
      statusService.updateStatus('scraping', {
        progress: {
          stage: 'assignments',
          message: 'Opening assignment page...',
        },
      });

      // Use tabManager.withTab to ensure cleanup
      const { assignments } = await tabManager.withTab(
        assignmentIndexUrl,
        async (tabId) => {
          return await this.handleScrapeAssignments(
            tabId,
            courseMoodleId,
            filterSections
          );
        }
      );

      console.log(
        `[ScrapeHandler] Successfully scraped ${assignments.length} assignments from URL`
      );

      return assignments;
    } catch (error) {
      console.error('[ScrapeHandler] Error scraping assignments from URL:', error);
      statusService.setError(
        error instanceof Error ? error.message : 'Failed to scrape assignments'
      );
      throw error;
    }
  }
}

// Export singleton instance
export const scrapeHandler = new ScrapeHandler();
