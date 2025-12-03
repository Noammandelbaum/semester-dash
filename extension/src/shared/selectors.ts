/**
 * Selector Fallback System for Moodle Scraping
 *
 * This module provides robust CSS selector handling that supports multiple
 * Moodle versions (3.x and 4.x) with fallback chains for each data type.
 *
 * Priority order:
 * 1. data-* attribute selectors (most stable across versions)
 * 2. Moodle 4.x specific selectors (more modern)
 * 3. Moodle 3.x specific selectors (legacy support)
 * 4. Generic class selectors (last resort)
 */

import type { MoodleVersion } from './types';

// ========================================
// Types
// ========================================

/**
 * Categories of selectors we need to find
 */
export type SelectorCategory =
  | 'courseList'
  | 'courseName'
  | 'courseUrl'
  | 'courseId'
  | 'assignmentList'
  | 'assignmentName'
  | 'assignmentUrl'
  | 'assignmentDueDate'
  | 'assignmentType'
  | 'quizList'
  | 'forumList'
  | 'sectionList'
  | 'sectionName';

/**
 * Result of a selector match
 */
export interface SelectorMatch {
  selector: string;
  index: number;
  element: Element;
}

/**
 * Validation result for a single selector category
 */
export interface CategoryValidation {
  category: SelectorCategory;
  working: string[];
  failed: string[];
  recommended: string | null;
  count: number;
}

/**
 * Full selector validation result
 */
export interface SelectorValidation {
  timestamp: number;
  moodleVersion: MoodleVersion;
  categories: Record<SelectorCategory, CategoryValidation>;
  overallHealth: 'healthy' | 'degraded' | 'critical';
  warnings: string[];
}

/**
 * Logger interface for selector operations
 */
interface SelectorLogger {
  debug: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

// ========================================
// Configuration
// ========================================

/**
 * Enable/disable logging (can be toggled for debugging)
 */
let loggingEnabled = false;

/**
 * Default logger implementation
 */
const defaultLogger: SelectorLogger = {
  debug: (message, ...args) => {
    if (loggingEnabled) {
      console.debug(`[Selectors] ${message}`, ...args);
    }
  },
  warn: (message, ...args) => {
    if (loggingEnabled) {
      console.warn(`[Selectors] ${message}`, ...args);
    }
  },
  error: (message, ...args) => {
    console.error(`[Selectors] ${message}`, ...args);
  },
};

let logger: SelectorLogger = defaultLogger;

/**
 * Enable or disable selector logging
 */
export function setLoggingEnabled(enabled: boolean): void {
  loggingEnabled = enabled;
}

/**
 * Set a custom logger
 */
export function setLogger(customLogger: SelectorLogger): void {
  logger = customLogger;
}

// ========================================
// Selector Fallbacks
// ========================================

/**
 * Selector fallbacks organized by category.
 * Each array is ordered by priority:
 * 1. data-* attributes (most stable)
 * 2. Moodle 4.x selectors
 * 3. Moodle 3.x selectors
 * 4. Generic selectors
 */
export const SELECTOR_FALLBACKS: Record<SelectorCategory, string[]> = {
  // ----------------------------------------
  // Course Selectors
  // ----------------------------------------

  courseList: [
    // data-* attributes (most stable)
    '[data-region="course-content"]',
    '[data-type="course"]',
    '[data-courseid]',
    // Moodle 4.x
    '.dashboard-card',
    '.course-card',
    '.course-listitem',
    // Moodle 3.x
    '.course-info-container',
    '.coursebox',
    '.courses .course',
    // Generic
    '.coursename',
    '.card[data-courseid]',
  ],

  courseName: [
    // data-* attributes
    '[data-field="fullname"]',
    // Moodle 4.x
    '.course-title',
    '.course-card-name',
    '.coursename-inner',
    '.dashboard-card-deck .coursename',
    // Moodle 3.x
    '.coursename a',
    '.coursename',
    '.course-info-container .coursename',
    '.info .coursename',
    // Generic
    '.course-name',
    'h3.coursename',
    'h4.coursename',
  ],

  courseUrl: [
    // data-* attributes with href
    '[data-courseid] a[href*="/course/view.php"]',
    // Moodle 4.x
    '.course-title a',
    '.course-card-name a',
    '.dashboard-card a[href*="/course/view.php"]',
    // Moodle 3.x
    '.coursename a',
    '.course-info-container a[href*="/course/view.php"]',
    // Generic
    'a[href*="/course/view.php"]',
  ],

  courseId: [
    // data-* attributes (preferred - contains the ID directly)
    '[data-courseid]',
    '[data-course-id]',
    // Links with course ID in URL
    'a[href*="/course/view.php?id="]',
    '[data-action="view-course"]',
  ],

  // ----------------------------------------
  // Assignment Selectors
  // ----------------------------------------

  assignmentList: [
    // data-* attributes
    '[data-activityname]',
    '[data-region="activity-information"]',
    '[data-for="cmitem"]',
    // Moodle 4.x
    '.activity-item',
    '.activity-wrapper',
    'li.activity',
    // Moodle 3.x
    '.activityinstance',
    '.activity.assign',
    '.modtype_assign',
    // Generic
    '.activity',
    '.mod-assign',
  ],

  assignmentName: [
    // data-* attributes
    '[data-activityname]',
    // Moodle 4.x
    '.activityname a',
    '.activity-name-area a',
    '.activity-item .activityname',
    // Moodle 3.x
    '.instancename',
    '.activityinstance .instancename',
    '.aalink .instancename',
    // Generic
    '.activity-name',
    'a.aalink',
  ],

  assignmentUrl: [
    // Moodle 4.x
    '.activityname a[href*="/mod/"]',
    '.activity-name-area a[href*="/mod/"]',
    // Moodle 3.x
    '.aalink[href*="/mod/"]',
    '.activityinstance a[href*="/mod/"]',
    // Generic
    'a[href*="/mod/assign/view.php"]',
    'a[href*="/mod/"]',
  ],

  assignmentDueDate: [
    // data-* attributes
    '[data-region="activity-dates"]',
    '[data-type="duedate"]',
    // Moodle 4.x
    '.activity-dates',
    '.activity-altcontent',
    '.activity-info .text-muted',
    // Moodle 3.x
    '.availabilityinfo',
    '.contentafterlink',
    '.activity-date',
    // Generic
    '.date',
    '.duedate',
    '.submission-status .date',
  ],

  assignmentType: [
    // data-* attributes
    '[data-activitytype]',
    '[data-modname]',
    // Moodle 4.x
    '.activityiconcontainer img[src]',
    '.activity-icon',
    '.activityicon',
    // Moodle 3.x
    '.activityinstance img.activityicon',
    '.mod-icon',
    // CSS class-based detection
    '.modtype_assign',
    '.modtype_quiz',
    '.modtype_forum',
    '.modtype_resource',
  ],

  // ----------------------------------------
  // Quiz Selectors
  // ----------------------------------------

  quizList: [
    // data-* attributes
    '[data-modname="quiz"]',
    // Moodle 4.x & 3.x
    '.modtype_quiz',
    '.activity.quiz',
    'a[href*="/mod/quiz/view.php"]',
  ],

  // ----------------------------------------
  // Forum Selectors
  // ----------------------------------------

  forumList: [
    // data-* attributes
    '[data-modname="forum"]',
    // Moodle 4.x & 3.x
    '.modtype_forum',
    '.activity.forum',
    'a[href*="/mod/forum/view.php"]',
  ],

  // ----------------------------------------
  // Section Selectors (for course page navigation)
  // ----------------------------------------

  sectionList: [
    // data-* attributes
    '[data-region="section"]',
    '[data-sectionid]',
    // Moodle 4.x
    '.course-section',
    '.section-item',
    // Moodle 3.x
    '.section.main',
    '.course-content .section',
    'li.section',
    // Generic
    '.topics > li',
    '.weeks > li',
  ],

  sectionName: [
    // data-* attributes
    '[data-region="section-name"]',
    // Moodle 4.x
    '.course-section-header',
    '.sectionname',
    // Moodle 3.x
    '.section-title',
    '.sectionname a',
    'h3.sectionname',
    // Generic
    '.section-header',
  ],
};

// ========================================
// Moodle Version-Specific Selector Sets
// ========================================

/**
 * Optimized selectors for Moodle 3.x installations
 */
export const MOODLE_3X_SELECTORS: Partial<Record<SelectorCategory, string[]>> = {
  courseList: [
    '.course-info-container',
    '.coursebox',
    '.coursename',
  ],
  courseName: [
    '.coursename a',
    '.coursename',
    '.info .coursename',
  ],
  assignmentList: [
    '.activityinstance',
    '.modtype_assign',
    '.activity',
  ],
  assignmentName: [
    '.instancename',
    '.aalink .instancename',
  ],
  assignmentDueDate: [
    '.availabilityinfo',
    '.contentafterlink',
  ],
};

/**
 * Optimized selectors for Moodle 4.x installations
 */
export const MOODLE_4X_SELECTORS: Partial<Record<SelectorCategory, string[]>> = {
  courseList: [
    '[data-region="course-content"]',
    '.dashboard-card',
    '.course-card',
  ],
  courseName: [
    '.course-title',
    '.course-card-name',
    '[data-field="fullname"]',
  ],
  assignmentList: [
    '.activity-item',
    '[data-for="cmitem"]',
    '.activity-wrapper',
  ],
  assignmentName: [
    '.activityname a',
    '.activity-name-area a',
    '[data-activityname]',
  ],
  assignmentDueDate: [
    '.activity-dates',
    '[data-region="activity-dates"]',
  ],
};

// ========================================
// Core Functions
// ========================================

/**
 * Try to find an element using a list of fallback selectors.
 * Returns the first matching element and logs which selector worked.
 *
 * @param root - The root element to search within (default: document)
 * @param fallbacks - Array of CSS selectors to try in order
 * @returns The first matching element, or null if none found
 */
export function querySelectorWithFallback(
  root: Element | Document,
  fallbacks: string[]
): Element | null {
  for (let i = 0; i < fallbacks.length; i++) {
    const selector = fallbacks[i];
    try {
      const element = root.querySelector(selector);
      if (element) {
        logger.debug(`Selector matched: "${selector}" (index ${i})`);
        return element;
      }
    } catch (error) {
      // Invalid selector - skip it
      logger.warn(`Invalid selector skipped: "${selector}"`, error);
    }
  }

  logger.debug(`No selector matched from ${fallbacks.length} fallbacks`);
  return null;
}

/**
 * Try to find all elements using a list of fallback selectors.
 * Returns results from the first selector that finds any elements.
 *
 * @param root - The root element to search within (default: document)
 * @param fallbacks - Array of CSS selectors to try in order
 * @returns Array of matching elements (may be empty)
 */
export function querySelectorAllWithFallback(
  root: Element | Document,
  fallbacks: string[]
): Element[] {
  for (let i = 0; i < fallbacks.length; i++) {
    const selector = fallbacks[i];
    try {
      const elements = root.querySelectorAll(selector);
      if (elements.length > 0) {
        logger.debug(
          `Selector matched: "${selector}" (index ${i}, ${elements.length} elements)`
        );
        return Array.from(elements);
      }
    } catch (error) {
      // Invalid selector - skip it
      logger.warn(`Invalid selector skipped: "${selector}"`, error);
    }
  }

  logger.debug(`No selector matched from ${fallbacks.length} fallbacks`);
  return [];
}

/**
 * Get the best selector for a category based on the detected Moodle version.
 * Prioritizes version-specific selectors before falling back to generic ones.
 *
 * @param category - The selector category
 * @param version - The detected Moodle version
 * @returns Optimized array of selectors for this category and version
 */
export function getSelectorsForVersion(
  category: SelectorCategory,
  version: MoodleVersion
): string[] {
  const genericFallbacks = SELECTOR_FALLBACKS[category] || [];

  if (version === 'auto') {
    // Return all fallbacks in standard order
    return genericFallbacks;
  }

  const versionSpecific =
    version === '4.x'
      ? MOODLE_4X_SELECTORS[category]
      : MOODLE_3X_SELECTORS[category];

  if (versionSpecific && versionSpecific.length > 0) {
    // Combine version-specific (first) with generic (as fallback)
    // Remove duplicates
    const combined = [...versionSpecific];
    for (const selector of genericFallbacks) {
      if (!combined.includes(selector)) {
        combined.push(selector);
      }
    }
    return combined;
  }

  return genericFallbacks;
}

/**
 * Find element with category-based fallbacks and version optimization.
 *
 * @param root - Root element to search in
 * @param category - The selector category
 * @param version - Moodle version (optional, defaults to 'auto')
 * @returns Matching element or null
 */
export function findElement(
  root: Element | Document,
  category: SelectorCategory,
  version: MoodleVersion = 'auto'
): Element | null {
  const selectors = getSelectorsForVersion(category, version);
  return querySelectorWithFallback(root, selectors);
}

/**
 * Find all elements with category-based fallbacks and version optimization.
 *
 * @param root - Root element to search in
 * @param category - The selector category
 * @param version - Moodle version (optional, defaults to 'auto')
 * @returns Array of matching elements
 */
export function findAllElements(
  root: Element | Document,
  category: SelectorCategory,
  version: MoodleVersion = 'auto'
): Element[] {
  const selectors = getSelectorsForVersion(category, version);
  return querySelectorAllWithFallback(root, selectors);
}

/**
 * Find element with detailed match information.
 * Useful for debugging and selector validation.
 *
 * @param root - Root element to search in
 * @param fallbacks - Array of selectors to try
 * @returns SelectorMatch with details, or null if not found
 */
export function querySelectorWithDetails(
  root: Element | Document,
  fallbacks: string[]
): SelectorMatch | null {
  for (let i = 0; i < fallbacks.length; i++) {
    const selector = fallbacks[i];
    try {
      const element = root.querySelector(selector);
      if (element) {
        return {
          selector,
          index: i,
          element,
        };
      }
    } catch {
      // Skip invalid selectors
    }
  }
  return null;
}

// ========================================
// Validation Functions
// ========================================

/**
 * Validate which selectors are working on the current page.
 * This is useful for:
 * - Detecting when Moodle updates break selectors
 * - Choosing the best selector for performance
 * - Debugging scraping issues
 *
 * @param root - Root element to validate against (default: document)
 * @returns Full validation report
 */
export function validateSelectors(
  root: Element | Document = document
): SelectorValidation {
  const categories = Object.keys(SELECTOR_FALLBACKS) as SelectorCategory[];
  const results: Record<SelectorCategory, CategoryValidation> = {} as Record<
    SelectorCategory,
    CategoryValidation
  >;
  const warnings: string[] = [];

  // Detect Moodle version first
  const moodleVersion = detectMoodleVersionFromPage(root);

  for (const category of categories) {
    const fallbacks = SELECTOR_FALLBACKS[category];
    const working: string[] = [];
    const failed: string[] = [];
    let totalCount = 0;

    for (const selector of fallbacks) {
      try {
        const elements = root.querySelectorAll(selector);
        if (elements.length > 0) {
          working.push(selector);
          totalCount = Math.max(totalCount, elements.length);
        } else {
          failed.push(selector);
        }
      } catch {
        failed.push(selector);
      }
    }

    results[category] = {
      category,
      working,
      failed,
      recommended: working[0] || null,
      count: totalCount,
    };

    // Add warnings for categories with no working selectors
    if (working.length === 0) {
      warnings.push(`No working selectors for category: ${category}`);
    } else if (working.length === 1) {
      warnings.push(
        `Only one selector working for ${category}: "${working[0]}" - consider adding fallbacks`
      );
    }
  }

  // Determine overall health
  const criticalCategories: SelectorCategory[] = [
    'courseList',
    'courseName',
    'assignmentList',
    'assignmentName',
  ];
  const criticalFailures = criticalCategories.filter(
    (cat) => results[cat].working.length === 0
  );

  let overallHealth: 'healthy' | 'degraded' | 'critical';
  if (criticalFailures.length > 0) {
    overallHealth = 'critical';
    warnings.unshift(
      `CRITICAL: Essential selectors failing for: ${criticalFailures.join(', ')}`
    );
  } else if (warnings.length > 2) {
    overallHealth = 'degraded';
  } else {
    overallHealth = 'healthy';
  }

  return {
    timestamp: Date.now(),
    moodleVersion,
    categories: results,
    overallHealth,
    warnings,
  };
}

/**
 * Detect Moodle version from page structure.
 *
 * @param root - Root element to check
 * @returns Detected Moodle version
 */
export function detectMoodleVersionFromPage(
  root: Element | Document = document
): MoodleVersion {
  // Moodle 4.x indicators (check these first as they're more specific)
  const moodle4Indicators = [
    '[data-region="course-content"]',
    '.activity-item',
    '.course-section-header',
    '[data-for="cmitem"]',
    '.activity-wrapper',
  ];

  for (const selector of moodle4Indicators) {
    try {
      if (root.querySelector(selector)) {
        logger.debug(`Detected Moodle 4.x via selector: ${selector}`);
        return '4.x';
      }
    } catch {
      // Skip invalid selectors
    }
  }

  // Moodle 3.x indicators
  const moodle3Indicators = [
    '.course-content .section.main',
    '.activityinstance',
    '.course-info-container',
    '.topics > .section',
  ];

  for (const selector of moodle3Indicators) {
    try {
      if (root.querySelector(selector)) {
        logger.debug(`Detected Moodle 3.x via selector: ${selector}`);
        return '3.x';
      }
    } catch {
      // Skip invalid selectors
    }
  }

  // Unable to determine - return auto
  logger.debug('Unable to determine Moodle version, returning auto');
  return 'auto';
}

/**
 * Quick health check - returns true if critical selectors are working.
 *
 * @param root - Root element to check
 * @returns Boolean indicating if page can be scraped
 */
export function canScrapePage(root: Element | Document = document): boolean {
  // At minimum, we need to find either courses or assignments
  const hasCourses = findAllElements(root, 'courseList').length > 0;
  const hasAssignments = findAllElements(root, 'assignmentList').length > 0;

  return hasCourses || hasAssignments;
}

/**
 * Generate a report of selector changes since last validation.
 * Useful for detecting when Moodle updates have affected scraping.
 *
 * @param previousValidation - Previous validation result to compare against
 * @param currentRoot - Current page root element
 * @returns Object describing changes
 */
export function compareValidations(
  previousValidation: SelectorValidation,
  currentRoot: Element | Document = document
): {
  hasChanges: boolean;
  newlyBroken: string[];
  newlyWorking: string[];
  healthChange: string;
} {
  const current = validateSelectors(currentRoot);
  const newlyBroken: string[] = [];
  const newlyWorking: string[] = [];

  const categories = Object.keys(SELECTOR_FALLBACKS) as SelectorCategory[];

  for (const category of categories) {
    const prev = previousValidation.categories[category];
    const curr = current.categories[category];

    // Find selectors that were working but now broken
    for (const selector of prev.working) {
      if (curr.failed.includes(selector)) {
        newlyBroken.push(`${category}: ${selector}`);
      }
    }

    // Find selectors that were broken but now working
    for (const selector of prev.failed) {
      if (curr.working.includes(selector)) {
        newlyWorking.push(`${category}: ${selector}`);
      }
    }
  }

  const healthChange =
    previousValidation.overallHealth !== current.overallHealth
      ? `${previousValidation.overallHealth} → ${current.overallHealth}`
      : 'unchanged';

  return {
    hasChanges: newlyBroken.length > 0 || newlyWorking.length > 0,
    newlyBroken,
    newlyWorking,
    healthChange,
  };
}

// ========================================
// Utility Functions
// ========================================

/**
 * Extract course ID from a URL or element.
 *
 * @param urlOrElement - URL string or Element with href
 * @returns Course ID or null
 */
export function extractCourseId(urlOrElement: string | Element): string | null {
  let url: string;

  if (typeof urlOrElement === 'string') {
    url = urlOrElement;
  } else {
    // Check data attributes first
    const dataId =
      urlOrElement.getAttribute('data-courseid') ||
      urlOrElement.getAttribute('data-course-id');
    if (dataId) {
      return dataId;
    }

    // Get href from element or child anchor
    const href =
      urlOrElement.getAttribute('href') ||
      urlOrElement.querySelector('a')?.getAttribute('href');
    if (!href) {
      return null;
    }
    url = href;
  }

  // Extract from URL parameter
  const match = url.match(/[?&]id=(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract assignment/activity ID from a URL or element.
 *
 * @param urlOrElement - URL string or Element with href
 * @returns Activity ID or null
 */
export function extractActivityId(
  urlOrElement: string | Element
): string | null {
  let url: string;

  if (typeof urlOrElement === 'string') {
    url = urlOrElement;
  } else {
    // Check data attributes first
    const dataId =
      urlOrElement.getAttribute('data-cmid') ||
      urlOrElement.getAttribute('data-id');
    if (dataId) {
      return dataId;
    }

    // Get href
    const href =
      urlOrElement.getAttribute('href') ||
      urlOrElement.querySelector('a')?.getAttribute('href');
    if (!href) {
      return null;
    }
    url = href;
  }

  // Extract from URL - handles /mod/assign/view.php?id=123
  const match = url.match(/\/mod\/\w+\/view\.php\?id=(\d+)/);
  return match ? match[1] : null;
}

/**
 * Detect activity type from element or URL.
 *
 * @param element - The activity element
 * @returns Activity type string
 */
export function detectActivityType(
  element: Element
): 'assignment' | 'quiz' | 'forum' | 'other' {
  // Check data attribute
  const modName = element.getAttribute('data-modname');
  if (modName) {
    if (modName === 'assign') return 'assignment';
    if (modName === 'quiz') return 'quiz';
    if (modName === 'forum') return 'forum';
    return 'other';
  }

  // Check class names
  const classList = element.className;
  if (
    classList.includes('modtype_assign') ||
    classList.includes('assign')
  ) {
    return 'assignment';
  }
  if (classList.includes('modtype_quiz') || classList.includes('quiz')) {
    return 'quiz';
  }
  if (classList.includes('modtype_forum') || classList.includes('forum')) {
    return 'forum';
  }

  // Check URL in href
  const href =
    element.getAttribute('href') ||
    element.querySelector('a')?.getAttribute('href') ||
    '';

  if (href.includes('/mod/assign/')) return 'assignment';
  if (href.includes('/mod/quiz/')) return 'quiz';
  if (href.includes('/mod/forum/')) return 'forum';

  // Check icon src
  const icon = element.querySelector('img');
  if (icon) {
    const src = icon.getAttribute('src') || '';
    if (src.includes('assign')) return 'assignment';
    if (src.includes('quiz')) return 'quiz';
    if (src.includes('forum')) return 'forum';
  }

  return 'other';
}

/**
 * Clean and normalize text extracted from Moodle.
 * Removes extra whitespace, accessibility spans, etc.
 *
 * @param text - Raw text from element
 * @returns Cleaned text
 */
export function cleanMoodleText(text: string): string {
  return (
    text
      // Remove accessibility-only content markers
      .replace(/\s*\(?\s*Assignment\s*\)?\s*$/i, '')
      .replace(/\s*\(?\s*Quiz\s*\)?\s*$/i, '')
      .replace(/\s*\(?\s*Forum\s*\)?\s*$/i, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

// ========================================
// Export all for external use
// ========================================

export default {
  SELECTOR_FALLBACKS,
  MOODLE_3X_SELECTORS,
  MOODLE_4X_SELECTORS,
  querySelectorWithFallback,
  querySelectorAllWithFallback,
  getSelectorsForVersion,
  findElement,
  findAllElements,
  querySelectorWithDetails,
  validateSelectors,
  detectMoodleVersionFromPage,
  canScrapePage,
  compareValidations,
  extractCourseId,
  extractActivityId,
  detectActivityType,
  cleanMoodleText,
  setLoggingEnabled,
  setLogger,
};
