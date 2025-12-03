/**
 * Assignment Scraping Module for SemesterHub Extension
 *
 * Extracts assignment, quiz, and forum data from Moodle course pages.
 * Supports Hebrew and English date formats and multiple Moodle versions.
 */

import type { UniversityConfig, ScrapedAssignment, MoodleAssignmentType, MoodleVersion } from '../../shared/types';
import {
  findAllElements,
  querySelectorWithFallback,
  querySelectorAllWithFallback,
  extractActivityId,
  detectActivityType,
  cleanMoodleText,
  detectMoodleVersionFromPage,
  SELECTOR_FALLBACKS,
} from '../../shared/selectors';

// ========================================
// Hebrew Date Constants
// ========================================

/**
 * Hebrew month names mapped to zero-based month index
 */
const HEBREW_MONTHS: Record<string, number> = {
  'ינואר': 0,
  'פברואר': 1,
  'מרץ': 2,
  'מרס': 2, // Alternative spelling
  'אפריל': 3,
  'מאי': 4,
  'יוני': 5,
  'יולי': 6,
  'אוגוסט': 7,
  'ספטמבר': 8,
  'אוקטובר': 9,
  'נובמבר': 10,
  'דצמבר': 11,
};

/**
 * English month names (for consistent parsing)
 */
const ENGLISH_MONTHS: Record<string, number> = {
  'january': 0,
  'february': 1,
  'march': 2,
  'april': 3,
  'may': 4,
  'june': 5,
  'july': 6,
  'august': 7,
  'september': 8,
  'october': 9,
  'november': 10,
  'december': 11,
  // Short forms
  'jan': 0,
  'feb': 1,
  'mar': 2,
  'apr': 3,
  'jun': 5,
  'jul': 6,
  'aug': 7,
  'sep': 8,
  'sept': 8,
  'oct': 9,
  'nov': 10,
  'dec': 11,
};

// ========================================
// Assignment Scraping
// ========================================

/**
 * Scrape assignments from a course page.
 *
 * @param config - University configuration with selectors
 * @param courseMoodleId - The Moodle ID of the current course
 * @returns Array of scraped assignments (empty if not on course page or no assignments found)
 */
export function scrapeAssignments(
  config: UniversityConfig,
  courseMoodleId: string
): ScrapedAssignment[] {
  try {
    // Check if we're on a course page
    if (!isCoursePage()) {
      console.debug('[AssignmentsScraper] Not on a course page');
      return [];
    }

    const version = detectMoodleVersionFromPage();
    console.debug(`[AssignmentsScraper] Detected Moodle version: ${version}`);

    const assignments: ScrapedAssignment[] = [];

    // Get all sections on the page
    const sections = getSections(version);
    console.debug(`[AssignmentsScraper] Found ${sections.length} sections`);

    if (sections.length > 0) {
      // Scrape assignments from each section
      for (const section of sections) {
        const sectionAssignments = scrapeAssignmentsFromSection(
          section,
          courseMoodleId,
          version
        );
        assignments.push(...sectionAssignments);
      }
    } else {
      // Fallback: scrape from entire page
      const pageAssignments = scrapeAssignmentsFromElement(
        document.body,
        courseMoodleId,
        version
      );
      assignments.push(...pageAssignments);
    }

    // Deduplicate by moodleId
    const uniqueAssignments = deduplicateAssignments(assignments);

    console.log(`[AssignmentsScraper] Found ${uniqueAssignments.length} unique assignments`);
    return uniqueAssignments;
  } catch (error) {
    console.error('[AssignmentsScraper] Error scraping assignments:', error);
    return [];
  }
}

// ========================================
// Page Detection
// ========================================

/**
 * Check if current page is a course view page.
 */
function isCoursePage(): boolean {
  const path = window.location.pathname;

  // Standard course view URL
  if (path.includes('/course/view.php')) {
    return true;
  }

  // Check body classes
  const bodyClasses = document.body.className;
  if (
    bodyClasses.includes('path-course-view') ||
    bodyClasses.includes('course-content')
  ) {
    return true;
  }

  return false;
}

/**
 * Get all course sections from the page.
 */
function getSections(version: MoodleVersion): Element[] {
  const sectionSelectors = [
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
  ];

  for (const selector of sectionSelectors) {
    try {
      const sections = document.querySelectorAll(selector);
      if (sections.length > 0) {
        console.debug(`[AssignmentsScraper] Found sections using: ${selector}`);
        return Array.from(sections);
      }
    } catch (error) {
      console.debug(`[AssignmentsScraper] Section selector failed: ${selector}`);
    }
  }

  return [];
}

// ========================================
// Scraping Functions
// ========================================

/**
 * Scrape assignments from a specific section element.
 */
function scrapeAssignmentsFromSection(
  section: Element,
  courseMoodleId: string,
  version: MoodleVersion
): ScrapedAssignment[] {
  return scrapeAssignmentsFromElement(section, courseMoodleId, version);
}

/**
 * Scrape assignments from any container element.
 */
function scrapeAssignmentsFromElement(
  container: Element,
  courseMoodleId: string,
  version: MoodleVersion
): ScrapedAssignment[] {
  const assignments: ScrapedAssignment[] = [];

  // Activity item selectors
  const activitySelectors = [
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
    '.activity',
    // Specific types
    '.modtype_assign',
    '.modtype_quiz',
    '.modtype_forum',
  ];

  for (const selector of activitySelectors) {
    try {
      const activities = container.querySelectorAll(selector);
      if (activities.length === 0) continue;

      for (const activity of activities) {
        const assignment = extractAssignment(activity, courseMoodleId, version);
        if (assignment) {
          assignments.push(assignment);
        }
      }

      // If we found activities, stop trying other selectors
      if (assignments.length > 0) {
        console.debug(`[AssignmentsScraper] Found activities using: ${selector}`);
        break;
      }
    } catch (error) {
      console.debug(`[AssignmentsScraper] Activity selector failed: ${selector}`);
    }
  }

  return assignments;
}

/**
 * Extract assignment data from an activity element.
 */
function extractAssignment(
  activity: Element,
  courseMoodleId: string,
  version: MoodleVersion
): ScrapedAssignment | null {
  // Find the activity link
  const link = activity.querySelector<HTMLAnchorElement>(
    'a[href*="/mod/assign/"], a[href*="/mod/quiz/"], a[href*="/mod/forum/"], a[href*="/mod/"]'
  );

  if (!link) {
    return null;
  }

  const url = link.href;
  const type = detectAssignmentTypeFromUrl(url);

  // Get activity ID from URL
  const moodleId = extractActivityIdFromUrl(url);
  if (!moodleId) {
    return null;
  }

  // Get title
  let title = '';

  // Try data attribute first
  const activityName = activity.getAttribute('data-activityname');
  if (activityName) {
    title = activityName;
  }

  // Try various selectors for title
  if (!title) {
    const titleElement = querySelectorWithFallback(activity, [
      '.activityname a',
      '.activity-name-area a',
      '.instancename',
      '.aalink',
      'a[href*="/mod/"]',
    ]);

    if (titleElement) {
      title = titleElement.textContent || '';
    }
  }

  title = cleanMoodleText(title);

  // Remove type suffix like " Assignment" or " Quiz"
  title = title
    .replace(/\s*Assignment\s*$/i, '')
    .replace(/\s*Quiz\s*$/i, '')
    .replace(/\s*Forum\s*$/i, '')
    .trim();

  if (!title) {
    return null;
  }

  // Get due date
  const dueDate = extractDueDate(activity, version);

  // Get description (optional)
  const description = extractDescription(activity);

  return {
    moodleId,
    courseMoodleId,
    title,
    description: description || undefined,
    dueDate: dueDate || undefined,
    url,
    type,
  };
}

// ========================================
// Type Detection
// ========================================

/**
 * Detect assignment type from URL.
 */
function detectAssignmentTypeFromUrl(url: string): MoodleAssignmentType {
  if (url.includes('/mod/assign/')) return 'assignment';
  if (url.includes('/mod/quiz/')) return 'quiz';
  if (url.includes('/mod/forum/')) return 'forum';
  return 'other';
}

/**
 * Extract activity ID from URL.
 */
function extractActivityIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('id');
  } catch {
    // Try regex as fallback
    const match = url.match(/[?&]id=(\d+)/);
    return match ? match[1] : null;
  }
}

// ========================================
// Date Parsing
// ========================================

/**
 * Extract and parse due date from activity element.
 */
function extractDueDate(activity: Element, version: MoodleVersion): string | null {
  // Date selectors in priority order
  const dateSelectors = [
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
  ];

  for (const selector of dateSelectors) {
    try {
      const dateElement = activity.querySelector(selector);
      if (dateElement?.textContent) {
        const parsed = parseDateString(dateElement.textContent);
        if (parsed) {
          return parsed;
        }
      }
    } catch {
      // Continue to next selector
    }
  }

  // Also check the entire activity text for date patterns
  const activityText = activity.textContent || '';
  const parsed = parseDateString(activityText);
  if (parsed) {
    return parsed;
  }

  return null;
}

/**
 * Parse a date string to ISO format.
 * Handles Hebrew and English date formats.
 *
 * Supported formats:
 * - Hebrew: "1 בדצמבר 2025", "יום ראשון, 1 בדצמבר 2025"
 * - English: "December 1, 2025", "1 December 2025", "Sunday, 1 December 2025"
 * - ISO-like: "2025-12-01"
 */
export function parseDateString(dateStr: string): string | null {
  if (!dateStr || dateStr.length < 5) {
    return null;
  }

  // Clean the string
  const cleaned = dateStr.trim();

  // Try Hebrew format: "1 בדצמבר 2025" or "יום ראשון, 1 בדצמבר 2025"
  const hebrewResult = parseHebrewDate(cleaned);
  if (hebrewResult) {
    return hebrewResult;
  }

  // Try English format: "December 1, 2025" or "1 December 2025"
  const englishResult = parseEnglishDate(cleaned);
  if (englishResult) {
    return englishResult;
  }

  // Try standard Date.parse as fallback
  const timestamp = Date.parse(cleaned);
  if (!isNaN(timestamp)) {
    return new Date(timestamp).toISOString();
  }

  return null;
}

/**
 * Parse Hebrew date format.
 * Examples: "1 בדצמבר 2025", "15 במאי 2026"
 */
function parseHebrewDate(dateStr: string): string | null {
  // Pattern: day + optional ב prefix + month name + year
  // Also handles time at the end
  const hebrewPattern = /(\d{1,2})\s+ב?(\S+)\s+(\d{4})/;
  const match = dateStr.match(hebrewPattern);

  if (!match) {
    return null;
  }

  const day = parseInt(match[1], 10);
  const monthName = match[2].replace(/^ב/, ''); // Remove ב prefix if present
  const year = parseInt(match[3], 10);

  const month = HEBREW_MONTHS[monthName];
  if (month === undefined) {
    return null;
  }

  // Validate
  if (day < 1 || day > 31 || year < 2000 || year > 2100) {
    return null;
  }

  // Extract time if present
  const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
  let hours = 23;
  let minutes = 59;
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
  }

  const date = new Date(year, month, day, hours, minutes, 0);
  return date.toISOString();
}

/**
 * Parse English date format.
 * Examples: "December 1, 2025", "1 December 2025", "Dec 1, 2025"
 */
function parseEnglishDate(dateStr: string): string | null {
  // Pattern 1: "December 1, 2025" or "Dec 1, 2025"
  const pattern1 = /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/;
  const match1 = dateStr.match(pattern1);

  if (match1) {
    const monthName = match1[1].toLowerCase();
    const day = parseInt(match1[2], 10);
    const year = parseInt(match1[3], 10);

    const month = ENGLISH_MONTHS[monthName];
    if (month !== undefined && day >= 1 && day <= 31 && year >= 2000 && year <= 2100) {
      const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
      let hours = 23;
      let minutes = 59;
      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
      }

      const date = new Date(year, month, day, hours, minutes, 0);
      return date.toISOString();
    }
  }

  // Pattern 2: "1 December 2025"
  const pattern2 = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/;
  const match2 = dateStr.match(pattern2);

  if (match2) {
    const day = parseInt(match2[1], 10);
    const monthName = match2[2].toLowerCase();
    const year = parseInt(match2[3], 10);

    const month = ENGLISH_MONTHS[monthName];
    if (month !== undefined && day >= 1 && day <= 31 && year >= 2000 && year <= 2100) {
      const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
      let hours = 23;
      let minutes = 59;
      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
      }

      const date = new Date(year, month, day, hours, minutes, 0);
      return date.toISOString();
    }
  }

  return null;
}

// ========================================
// Description Extraction
// ========================================

/**
 * Extract description from activity element (optional).
 */
function extractDescription(activity: Element): string | null {
  const descSelectors = [
    '.contentafterlink',
    '.activity-description',
    '.description',
    '.summary',
  ];

  for (const selector of descSelectors) {
    const element = activity.querySelector(selector);
    if (element?.textContent) {
      const text = element.textContent.trim();
      // Only return if it's a reasonable description (not too long)
      if (text.length > 0 && text.length < 1000) {
        return text;
      }
    }
  }

  return null;
}

// ========================================
// Utilities
// ========================================

/**
 * Remove duplicate assignments based on moodleId.
 */
function deduplicateAssignments(assignments: ScrapedAssignment[]): ScrapedAssignment[] {
  const seen = new Set<string>();
  const unique: ScrapedAssignment[] = [];

  for (const assignment of assignments) {
    if (!seen.has(assignment.moodleId)) {
      seen.add(assignment.moodleId);
      unique.push(assignment);
    }
  }

  return unique;
}

// ========================================
// Export
// ========================================

export default {
  scrapeAssignments,
  parseDateString,
};
