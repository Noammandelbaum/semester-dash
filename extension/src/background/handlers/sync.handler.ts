/**
 * Sync Handler for SemesterHub Browser Extension
 * Manages sync operations in the background service worker
 */

import { tabManager } from '../services/tab-manager.service';
import { statusService } from '../services/status.service';
import { storageService } from '../services/storage.service';
import { scrapeHandler } from './scrape.handler';
import { createError, type ExtensionError } from '../../shared/errors';
import type {
  ScrapedCourse,
  ScrapedAssignment,
  SyncPayload,
  SyncResponse,
  SyncHistoryEntry,
} from '../../shared/types';
import { syncMoodleData } from '../../shared/api';
import { validateSyncPayload } from '../../shared/utils/validation';
import { SYNC } from '../../shared/constants';

/**
 * Course configuration for sync operations
 */
export interface SyncCourseConfig {
  moodleId: string;
  name: string;
  url: string;
  selectedSections?: string[];
}

/**
 * Sync Handler Class
 * Handles all sync operations: scraping assignments and syncing to backend
 */
export class SyncHandler {
  /**
   * Send scraped data to backend API
   * Validates payload, makes API call, saves sync history
   *
   * @param payload - Sync payload with courses and assignments
   * @returns SyncResponse from API
   * @throws ExtensionError if validation or API call fails
   */
  async handleSyncToBackend(payload: SyncPayload): Promise<SyncResponse> {
    console.log('[SyncHandler] Syncing to backend:', {
      courses: payload.courses.length,
      assignments: payload.assignments.length,
    });

    try {
      // Update status
      statusService.updateStatus('syncing', {
        progress: {
          stage: 'assignments',
          message: 'שולח נתונים לשרת...',
        },
      });

      // Validate payload before sending
      const validationResult = validateSyncPayload(payload);
      if (!validationResult.success) {
        throw (validationResult as { success: false; error: ExtensionError }).error;
      }

      const validatedPayload = (
        validationResult as { success: true; data: SyncPayload }
      ).data;

      // Make API request
      const response = await syncMoodleData(validatedPayload);

      console.log('[SyncHandler] Sync successful:', response);

      // Save sync history
      const historyEntry: SyncHistoryEntry = {
        timestamp: Date.now(),
        universityId: payload.universityId,
        coursesCount: payload.courses.length,
        assignmentsCount: payload.assignments.length,
        success: true,
      };

      await storageService.addToSyncHistory(historyEntry);

      // Update status with success
      statusService.setSyncComplete(response);

      return response;
    } catch (error) {
      console.error('[SyncHandler] Sync to backend failed:', error);

      // Save failed sync to history
      const historyEntry: SyncHistoryEntry = {
        timestamp: Date.now(),
        universityId: payload.universityId,
        coursesCount: payload.courses.length,
        assignmentsCount: payload.assignments.length,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      await storageService.addToSyncHistory(historyEntry);

      // Update status with error
      const errorMessage =
        error instanceof Error ? error.message : 'שגיאה בשליחת נתונים לשרת';
      statusService.setError(errorMessage);

      throw error;
    }
  }

  /**
   * Full sync flow: scrape assignments from multiple courses and sync to backend
   * Opens tabs in background, scrapes assignments with section filtering, sends to API
   *
   * @param courses - Array of courses with moodleId, name, url, and optional selectedSections
   * @param moodleUrl - Base Moodle URL
   * @returns SyncResponse from backend
   * @throws ExtensionError if scraping or sync fails
   */
  async handleSyncAssignmentsBackground(
    courses: SyncCourseConfig[],
    moodleUrl: string
  ): Promise<SyncResponse> {
    console.log('[SyncHandler] Starting background sync for', courses.length, 'courses');

    try {
      // Update status
      statusService.updateStatus('scraping', {
        progress: {
          stage: 'assignments',
          message: 'מתחיל איסוף משימות...',
          current: 0,
          total: courses.length,
        },
      });

      // Scrape assignments from all courses
      const assignments = await this.scrapeAssignmentsForCourses(courses, moodleUrl);

      console.log('[SyncHandler] Scraped', assignments.length, 'total assignments');

      // Build sync payload
      const payload = this.buildSyncPayload(courses, assignments, moodleUrl);

      // Sync to backend
      const response = await this.handleSyncToBackend(payload);

      console.log('[SyncHandler] Background sync complete:', response);

      return response;
    } catch (error) {
      console.error('[SyncHandler] Background sync failed:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'שגיאה בסנכרון משימות';
      statusService.setError(errorMessage);

      throw error;
    }
  }

  /**
   * Fetch sections for multiple courses
   * Opens background tabs to assignment index pages and scrapes section names
   *
   * @param courses - Array of courses with moodleId
   * @param moodleUrl - Base Moodle URL
   * @returns Record mapping course moodleId to array of section names
   */
  async handleFetchSectionsForCourses(
    courses: { moodleId: string }[],
    moodleUrl: string
  ): Promise<Record<string, string[]>> {
    console.log('[SyncHandler] Fetching sections for', courses.length, 'courses');

    try {
      // Update status
      statusService.updateStatus('scraping', {
        progress: {
          stage: 'courses',
          message: 'טוען יחידות הוראה...',
          current: 0,
          total: courses.length,
        },
      });

      const sections: Record<string, string[]> = {};
      const errors: string[] = [];

      // Process courses sequentially to avoid overwhelming the browser
      for (let i = 0; i < courses.length; i++) {
        const course = courses[i];

        // Update progress
        statusService.updateProgress({
          stage: 'courses',
          message: `טוען יחידות הוראה (${i + 1}/${courses.length})...`,
          current: i + 1,
          total: courses.length,
        });

        try {
          const assignmentIndexUrl = `${moodleUrl}/mod/assign/index.php?id=${course.moodleId}`;

          // Use tabManager.withTab for automatic cleanup
          await tabManager.withTab(assignmentIndexUrl, async (tabId) => {
            const result = await scrapeHandler.handleGetCourseSections(
              tabId,
              course.moodleId
            );

            sections[course.moodleId] = result.sections || [];
            console.log(
              `[SyncHandler] Found ${result.sections?.length || 0} sections for course ${course.moodleId}`
            );
          });
        } catch (error) {
          console.warn(
            `[SyncHandler] Failed to fetch sections for course ${course.moodleId}:`,
            error
          );
          sections[course.moodleId] = [];
          errors.push(course.moodleId);
        }
      }

      console.log('[SyncHandler] Sections fetched:', sections);

      if (errors.length > 0) {
        console.warn('[SyncHandler] Failed to fetch sections for courses:', errors);
      }

      // Reset status
      statusService.resetToIdle();

      return sections;
    } catch (error) {
      console.error('[SyncHandler] Error fetching sections:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'שגיאה בטעינת יחידות הוראה';
      statusService.setError(errorMessage);

      throw error;
    }
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Scrape assignments from multiple courses with parallel processing
   * Respects SYNC.PARALLEL_COURSE_LIMIT to avoid overwhelming the browser
   *
   * @param courses - Array of courses to scrape
   * @param moodleUrl - Base Moodle URL
   * @returns Array of all scraped assignments
   */
  private async scrapeAssignmentsForCourses(
    courses: SyncCourseConfig[],
    moodleUrl: string
  ): Promise<ScrapedAssignment[]> {
    const allAssignments: ScrapedAssignment[] = [];
    const errors: Array<{ courseId: string; error: Error }> = [];

    // Process courses in batches to limit parallel tabs
    for (let i = 0; i < courses.length; i += SYNC.PARALLEL_COURSE_LIMIT) {
      const batch = courses.slice(i, i + SYNC.PARALLEL_COURSE_LIMIT);

      // Update progress for this batch
      statusService.updateProgress({
        stage: 'assignments',
        message: `אוסף משימות (${Math.min(i + batch.length, courses.length)}/${courses.length})...`,
        current: Math.min(i + batch.length, courses.length),
        total: courses.length,
      });

      // Process batch in parallel
      const batchPromises = batch.map(async (course) => {
        try {
          const assignmentIndexUrl = `${moodleUrl}/mod/assign/index.php?id=${course.moodleId}`;

          // Use tabManager.withTab for automatic cleanup
          const assignments = await tabManager.withTab(
            assignmentIndexUrl,
            async (tabId) => {
              const result = await scrapeHandler.handleScrapeAssignments(
                tabId,
                course.moodleId,
                course.selectedSections && course.selectedSections.length > 0
                  ? course.selectedSections
                  : undefined
              );
              return result.assignments;
            }
          );

          console.log(
            `[SyncHandler] Scraped ${assignments.length} assignments from course ${course.moodleId}`
          );

          return assignments;
        } catch (error) {
          console.warn(
            `[SyncHandler] Failed to scrape assignments for course ${course.moodleId}:`,
            error
          );
          errors.push({
            courseId: course.moodleId,
            error: error instanceof Error ? error : new Error('Unknown error'),
          });
          return [];
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);

      // Collect assignments from this batch
      for (const assignments of batchResults) {
        allAssignments.push(...assignments);
      }
    }

    // Log errors but don't fail if we got some assignments
    if (errors.length > 0) {
      console.warn(
        `[SyncHandler] Failed to scrape ${errors.length} out of ${courses.length} courses:`,
        errors
      );
    }

    // If all courses failed, throw error
    if (errors.length === courses.length && courses.length > 0) {
      throw createError('E3001', {
        reason: 'Failed to scrape assignments from all courses',
        errors: errors.map((e) => ({ courseId: e.courseId, message: e.error.message })),
      });
    }

    return allAssignments;
  }

  /**
   * Build and validate sync payload
   *
   * @param courses - Array of courses
   * @param assignments - Array of scraped assignments
   * @param moodleUrl - Base Moodle URL
   * @returns Validated SyncPayload
   * @throws ExtensionError if validation fails
   */
  private buildSyncPayload(
    courses: SyncCourseConfig[],
    assignments: ScrapedAssignment[],
    moodleUrl: string
  ): SyncPayload {
    // Extract universityId from moodleUrl
    const universityId = this.extractUniversityId(moodleUrl);

    // Convert courses to ScrapedCourse format
    const scrapedCourses: ScrapedCourse[] = courses.map((course) => ({
      moodleId: course.moodleId,
      name: course.name,
      url: course.url,
      courseCode: undefined, // Can be extracted from name if needed
    }));

    // Build payload
    const payload: SyncPayload = {
      universityId,
      moodleUrl,
      courses: scrapedCourses,
      assignments,
    };

    console.log('[SyncHandler] Built sync payload:', {
      universityId,
      coursesCount: scrapedCourses.length,
      assignmentsCount: assignments.length,
    });

    return payload;
  }

  /**
   * Extract university ID from Moodle URL
   * Examples:
   * - https://moodle.tau.ac.il → 'tau'
   * - https://moodle2.bgu.ac.il → 'bgu'
   * - https://custom-moodle.university.edu → 'custom-moodle.university.edu'
   *
   * @param moodleUrl - Moodle base URL
   * @returns University ID
   */
  private extractUniversityId(moodleUrl: string): string {
    try {
      const url = new URL(moodleUrl);
      const hostname = url.hostname;

      // Try to extract from common patterns: moodle.{university}.ac.il
      const match = hostname.match(/moodle\d*\.([^.]+)\./);
      if (match) {
        return match[1];
      }

      // Fallback: use full hostname
      return hostname;
    } catch {
      // Invalid URL, use as-is
      return moodleUrl;
    }
  }
}

// Export singleton instance
export const syncHandler = new SyncHandler();
