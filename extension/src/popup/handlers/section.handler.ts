/**
 * Section Handler for SemesterHub popup
 * Manages course section selection and loading
 */

import { sendMessage, sendMessageSafe } from '../services/message.service';
import { createError, ExtensionError, isExtensionError } from '../../shared/errors';
import type { ExtensionMessage } from '../../shared/types';

/**
 * Callbacks for section UI updates
 */
export interface SectionUICallbacks {
  /**
   * Called when sections are being loaded for a course
   * @param courseName - Display name of the course
   */
  onSectionsLoading(courseName: string): void;

  /**
   * Called when sections have been successfully loaded
   * @param courseMoodleId - Moodle ID of the course
   * @param sections - Array of section names
   */
  onSectionsLoaded(courseMoodleId: string, sections: string[]): void;

  /**
   * Called when section loading fails
   * @param courseMoodleId - Moodle ID of the course
   * @param error - Error message to display
   */
  onSectionsError(courseMoodleId: string, error: string): void;
}

/**
 * Storage key for cached course sections
 */
const SECTIONS_STORAGE_KEY = 'courseSections';

/**
 * Handler for managing course section selection
 * Handles loading, caching, and clearing section data
 */
export class SectionHandler {
  constructor(private callbacks: SectionUICallbacks) {}

  /**
   * Load sections for a single course
   *
   * @param courseMoodleId - Moodle ID of the course
   * @param courseName - Display name of the course (for UI feedback)
   * @param moodleUrl - Base Moodle URL
   * @returns Promise with array of section names
   * @throws ExtensionError on failure
   *
   * @example
   * ```typescript
   * const sections = await handler.loadSectionsForCourse(
   *   '12345',
   *   'Introduction to Programming',
   *   'https://moodle.university.edu'
   * );
   * console.log(sections); // ['Section 1', 'Section 2', ...]
   * ```
   */
  async loadSectionsForCourse(
    courseMoodleId: string,
    courseName: string,
    moodleUrl: string
  ): Promise<string[]> {
    try {
      // Notify UI that loading has started
      this.callbacks.onSectionsLoading(courseName);

      // Send message to background to scrape sections
      const message: ExtensionMessage = {
        type: 'GET_COURSE_SECTIONS',
        payload: { courseMoodleId, moodleUrl }
      };

      const response = await sendMessage<{ sections: string[] }>(message);

      // Validate response
      if (!response?.sections || !Array.isArray(response.sections)) {
        throw createError('E4001', {
          courseMoodleId,
          courseName,
          reason: 'Invalid response format'
        });
      }

      const sections = response.sections;

      // Store in cache
      await this.storeSections({ [courseMoodleId]: sections });

      // Notify UI of success
      this.callbacks.onSectionsLoaded(courseMoodleId, sections);

      return sections;
    } catch (error) {
      const errorMessage = isExtensionError(error)
        ? error.userMessage
        : 'Failed to load sections';

      // Notify UI of error
      this.callbacks.onSectionsError(courseMoodleId, errorMessage);

      throw error;
    }
  }

  /**
   * Load sections for multiple courses in parallel
   *
   * @param courses - Array of courses with moodleId and name
   * @param moodleUrl - Base Moodle URL
   * @returns Promise with record mapping course ID to section names
   *
   * @example
   * ```typescript
   * const sections = await handler.loadSectionsForMultipleCourses(
   *   [
   *     { moodleId: '12345', name: 'Math 101' },
   *     { moodleId: '67890', name: 'CS 101' }
   *   ],
   *   'https://moodle.university.edu'
   * );
   * // Returns: { '12345': [...], '67890': [...] }
   * ```
   */
  async loadSectionsForMultipleCourses(
    courses: { moodleId: string; name: string }[],
    moodleUrl: string
  ): Promise<Record<string, string[]>> {
    // Send batch request to background
    const message: ExtensionMessage = {
      type: 'FETCH_SECTIONS_FOR_COURSES',
      payload: {
        courses: courses.map(c => c.moodleId),
        moodleUrl
      }
    };

    const result = await sendMessageSafe<{ sections: Record<string, string[]> }>(message);

    if (!result.success) {
      // Handle error - notify UI for all courses
      courses.forEach(course => {
        this.callbacks.onSectionsError(course.moodleId, result.error.userMessage);
      });
      throw result.error;
    }

    const sections = result.data.sections;

    // Validate response
    if (!sections || typeof sections !== 'object') {
      const error = createError('E4001', {
        reason: 'Invalid response format',
        courseCount: courses.length
      });

      courses.forEach(course => {
        this.callbacks.onSectionsError(course.moodleId, error.userMessage);
      });

      throw error;
    }

    // Store all sections in cache
    await this.storeSections(sections);

    // Notify UI for each course
    courses.forEach(course => {
      const courseSections = sections[course.moodleId];
      if (courseSections && Array.isArray(courseSections)) {
        this.callbacks.onSectionsLoaded(course.moodleId, courseSections);
      } else {
        this.callbacks.onSectionsError(
          course.moodleId,
          'No sections found for this course'
        );
      }
    });

    return sections;
  }

  /**
   * Get cached sections from storage
   *
   * @returns Promise with record of course sections
   *
   * @example
   * ```typescript
   * const cached = await handler.getStoredSections();
   * console.log(cached); // { '12345': ['Section 1', ...], ... }
   * ```
   */
  async getStoredSections(): Promise<Record<string, string[]>> {
    try {
      const result = await chrome.storage.local.get(SECTIONS_STORAGE_KEY);
      return result[SECTIONS_STORAGE_KEY] || {};
    } catch (error) {
      console.error('Failed to get stored sections:', error);
      return {};
    }
  }

  /**
   * Clear all cached sections from storage
   *
   * @example
   * ```typescript
   * await handler.clearStoredSections();
   * ```
   */
  async clearStoredSections(): Promise<void> {
    try {
      await chrome.storage.local.remove(SECTIONS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear stored sections:', error);
      throw createError('E1004', {
        operation: 'clear sections',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Store sections in cache (merges with existing data)
   *
   * @param sections - Record of course sections to store
   * @private
   */
  private async storeSections(sections: Record<string, string[]>): Promise<void> {
    try {
      const existing = await this.getStoredSections();
      const merged = { ...existing, ...sections };

      await chrome.storage.local.set({
        [SECTIONS_STORAGE_KEY]: merged
      });
    } catch (error) {
      console.error('Failed to store sections:', error);
      // Don't throw - storage failure shouldn't break the flow
    }
  }
}

/**
 * Factory function to create a SectionHandler instance
 *
 * @param callbacks - UI callbacks for section updates
 * @returns New SectionHandler instance
 *
 * @example
 * ```typescript
 * const handler = createSectionHandler({
 *   onSectionsLoading: (name) => console.log(`Loading ${name}...`),
 *   onSectionsLoaded: (id, sections) => console.log(`Loaded ${sections.length} sections`),
 *   onSectionsError: (id, error) => console.error(`Error: ${error}`)
 * });
 * ```
 */
export function createSectionHandler(callbacks: SectionUICallbacks): SectionHandler {
  return new SectionHandler(callbacks);
}
