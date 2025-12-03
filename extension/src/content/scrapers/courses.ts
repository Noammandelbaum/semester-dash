/**
 * Course Scraping Module for SemesterHub Extension
 *
 * Extracts course data from Moodle pages (Dashboard and All Courses views).
 * Uses fallback selectors to support multiple Moodle versions (3.x and 4.x).
 */

import type { UniversityConfig, ScrapedCourse, MoodleVersion } from '../../shared/types';
import {
  findAllElements,
  querySelectorWithFallback,
  extractCourseId,
  cleanMoodleText,
  detectMoodleVersionFromPage,
  SELECTOR_FALLBACKS,
} from '../../shared/selectors';

// ========================================
// Course Scraping
// ========================================

/**
 * Scrape courses from the current page.
 * Works on Dashboard (/my/) and All Courses (/course/index.php) pages.
 *
 * @param config - University configuration with selectors
 * @returns Array of scraped courses (empty if not on a Moodle page or no courses found)
 */
export function scrapeCourses(config: UniversityConfig): ScrapedCourse[] {
  try {
    // First check if we're on a page that might have courses
    if (!isCourseListPage()) {
      console.debug('[CoursesScraper] Not on a course list page');
      return [];
    }

    const version = detectMoodleVersionFromPage();
    console.debug(`[CoursesScraper] Detected Moodle version: ${version}`);

    // Try multiple strategies to find courses
    let courses = scrapeFromCourseCards(version);

    if (courses.length === 0) {
      courses = scrapeFromCourseLinks(version);
    }

    if (courses.length === 0) {
      courses = scrapeFromAllCoursesPage(version);
    }

    // Deduplicate by moodleId
    const uniqueCourses = deduplicateCourses(courses);

    console.log(`[CoursesScraper] Found ${uniqueCourses.length} unique courses`);
    return uniqueCourses;
  } catch (error) {
    console.error('[CoursesScraper] Error scraping courses:', error);
    return [];
  }
}

// ========================================
// Page Detection
// ========================================

/**
 * Check if current page is likely to contain a course list.
 */
function isCourseListPage(): boolean {
  const path = window.location.pathname;

  // Dashboard page
  if (path.includes('/my/') || path.endsWith('/my')) {
    return true;
  }

  // All courses page
  if (path.includes('/course/index.php')) {
    return true;
  }

  // Course category page
  if (path.includes('/course/') && !path.includes('/view.php')) {
    return true;
  }

  // Check for Moodle body classes
  const bodyClasses = document.body.className;
  if (
    bodyClasses.includes('path-my') ||
    bodyClasses.includes('pagelayout-mydashboard') ||
    bodyClasses.includes('path-course-index')
  ) {
    return true;
  }

  return false;
}

// ========================================
// Scraping Strategies
// ========================================

/**
 * Strategy 1: Scrape from course cards (Dashboard view, Moodle 4.x style)
 */
function scrapeFromCourseCards(version: MoodleVersion): ScrapedCourse[] {
  const courses: ScrapedCourse[] = [];

  // Try course card selectors
  const cardSelectors = [
    '.dashboard-card',
    '.course-card',
    '.course-listitem',
    '[data-region="course-content"] [data-courseid]',
    '.coursebox',
  ];

  for (const selector of cardSelectors) {
    try {
      const cards = document.querySelectorAll(selector);
      if (cards.length === 0) continue;

      console.debug(`[CoursesScraper] Found ${cards.length} course cards using: ${selector}`);

      for (const card of cards) {
        const course = extractCourseFromCard(card, version);
        if (course) {
          courses.push(course);
        }
      }

      if (courses.length > 0) break;
    } catch (error) {
      console.debug(`[CoursesScraper] Selector failed: ${selector}`, error);
    }
  }

  return courses;
}

/**
 * Strategy 2: Scrape from course links directly
 */
function scrapeFromCourseLinks(version: MoodleVersion): ScrapedCourse[] {
  const courses: ScrapedCourse[] = [];

  // Find all links to course view pages
  const links = document.querySelectorAll<HTMLAnchorElement>(
    'a[href*="/course/view.php?id="]'
  );

  console.debug(`[CoursesScraper] Found ${links.length} course links`);

  for (const link of links) {
    const course = extractCourseFromLink(link, version);
    if (course) {
      courses.push(course);
    }
  }

  return courses;
}

/**
 * Strategy 3: Scrape from All Courses page (/course/index.php)
 */
function scrapeFromAllCoursesPage(version: MoodleVersion): ScrapedCourse[] {
  const courses: ScrapedCourse[] = [];

  // Course info containers (Moodle 3.x style)
  const containers = document.querySelectorAll('.course-info-container, .coursebox');

  for (const container of containers) {
    const course = extractCourseFromContainer(container, version);
    if (course) {
      courses.push(course);
    }
  }

  return courses;
}

// ========================================
// Course Extraction Helpers
// ========================================

/**
 * Extract course data from a course card element
 */
function extractCourseFromCard(card: Element, version: MoodleVersion): ScrapedCourse | null {
  // Try to get course ID from data attribute first
  let moodleId =
    card.getAttribute('data-courseid') ||
    card.getAttribute('data-course-id');

  // Find the course link
  const link = card.querySelector<HTMLAnchorElement>(
    'a[href*="/course/view.php"]'
  );

  if (!link) {
    return null;
  }

  const url = link.href;

  // Extract ID from URL if not found in data attribute
  if (!moodleId) {
    moodleId = extractCourseId(url);
  }

  if (!moodleId) {
    return null;
  }

  // Get course name
  const nameElement = querySelectorWithFallback(card, [
    '[data-field="fullname"]',
    '.course-title',
    '.course-card-name',
    '.coursename',
    '.fullname',
    'h3',
    'h4',
  ]);

  let name = nameElement?.textContent?.trim() || link.textContent?.trim() || '';
  name = cleanMoodleText(name);

  if (!name) {
    return null;
  }

  // Extract course code from name
  const courseCode = extractCourseCode(name);

  // Clean the name (remove code if found)
  const cleanedName = courseCode ? cleanCourseName(name) : name;

  return {
    moodleId,
    name: cleanedName,
    courseCode: courseCode || undefined,
    url,
  };
}

/**
 * Extract course data from a link element
 */
function extractCourseFromLink(link: HTMLAnchorElement, version: MoodleVersion): ScrapedCourse | null {
  const url = link.href;
  const moodleId = extractCourseId(url);

  if (!moodleId) {
    return null;
  }

  // Get the name - try parent elements first for better context
  let name = '';

  // Check if link is inside a course container
  const container = link.closest(
    '.course-info-container, .coursebox, .dashboard-card, .course-card, .course-listitem'
  );

  if (container) {
    const nameElement = querySelectorWithFallback(container, [
      '.course-title',
      '.coursename',
      '.fullname',
    ]);
    name = nameElement?.textContent?.trim() || '';
  }

  // Fallback to link text
  if (!name) {
    name = link.textContent?.trim() || '';
  }

  name = cleanMoodleText(name);

  // Skip if name is too short or looks like a button/icon
  if (!name || name.length < 2) {
    return null;
  }

  const courseCode = extractCourseCode(name);
  const cleanedName = courseCode ? cleanCourseName(name) : name;

  return {
    moodleId,
    name: cleanedName,
    courseCode: courseCode || undefined,
    url,
  };
}

/**
 * Extract course data from a course container element (Moodle 3.x)
 */
function extractCourseFromContainer(
  container: Element,
  version: MoodleVersion
): ScrapedCourse | null {
  const link = container.querySelector<HTMLAnchorElement>(
    'a[href*="/course/view.php"], .coursename a'
  );

  if (!link) {
    return null;
  }

  const url = link.href;
  const moodleId = extractCourseId(url);

  if (!moodleId) {
    return null;
  }

  // Get name
  const nameElement = container.querySelector('.coursename, .fullname, h3, h4');
  let name = nameElement?.textContent?.trim() || link.textContent?.trim() || '';
  name = cleanMoodleText(name);

  if (!name) {
    return null;
  }

  const courseCode = extractCourseCode(name);
  const cleanedName = courseCode ? cleanCourseName(name) : name;

  return {
    moodleId,
    name: cleanedName,
    courseCode: courseCode || undefined,
    url,
  };
}

// ========================================
// Name Processing
// ========================================

/**
 * Extract course code from course name.
 * Patterns supported:
 * - "[CS101] Course Name"
 * - "(CS101) Course Name"
 * - "CS101 - Course Name"
 * - "CS101: Course Name"
 * - "12345 - Course Name" (numeric codes)
 */
function extractCourseCode(name: string): string | null {
  const patterns = [
    // [CODE] prefix
    /^\[([A-Z0-9\-]+)\]/,
    // (CODE) prefix
    /^\(([A-Z0-9\-]+)\)/,
    // CODE - or CODE: prefix (letters + numbers)
    /^([A-Z]{2,5}\d{3,6})[\s\-:]/,
    // Numeric code at start
    /^(\d{4,8})[\s\-:]/,
    // CODE space before the actual name
    /^([A-Z]{2,4}\s?\d{3,5})\s+/,
  ];

  for (const pattern of patterns) {
    const match = name.trim().match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Clean course name by removing the code prefix.
 */
function cleanCourseName(name: string): string {
  return name
    // Remove [CODE] prefix
    .replace(/^\[[A-Z0-9\-]+\]\s*/, '')
    // Remove (CODE) prefix
    .replace(/^\([A-Z0-9\-]+\)\s*/, '')
    // Remove CODE - or CODE: prefix
    .replace(/^[A-Z]{2,5}\d{3,6}[\s\-:]+/, '')
    // Remove numeric code prefix
    .replace(/^\d{4,8}[\s\-:]+/, '')
    // Remove CODE space prefix
    .replace(/^[A-Z]{2,4}\s?\d{3,5}\s+/, '')
    .trim();
}

/**
 * Remove duplicate courses based on moodleId.
 */
function deduplicateCourses(courses: ScrapedCourse[]): ScrapedCourse[] {
  const seen = new Set<string>();
  const unique: ScrapedCourse[] = [];

  for (const course of courses) {
    if (!seen.has(course.moodleId)) {
      seen.add(course.moodleId);
      unique.push(course);
    }
  }

  return unique;
}

// ========================================
// Export
// ========================================

export default {
  scrapeCourses,
};
