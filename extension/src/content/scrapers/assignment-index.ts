/**
 * Assignment Index Page Scraper for SemesterHub Extension
 *
 * Scrapes assignments from /mod/assign/index.php?id=COURSE_ID
 * This page lists ALL assignments in a course in a simple table format.
 */

import type { ScrapedAssignment, MoodleAssignmentType } from '../../shared/types';

/**
 * Extended assignment with section info
 */
export interface ScrapedAssignmentWithSection extends ScrapedAssignment {
  section?: string; // יחידת הוראה (e.g., "תרגילים", "הרצאות")
}

// Hebrew month names for date parsing
const HEBREW_MONTHS: Record<string, number> = {
  'ינואר': 0,
  'פברואר': 1,
  'מרץ': 2,
  'מרס': 2,
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
 * Check if current page is an assignment index page
 */
export function isAssignmentIndexPage(): boolean {
  return window.location.pathname.includes('/mod/assign/index.php');
}

/**
 * Get course ID from current URL
 */
export function getCourseIdFromUrl(): string | null {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('id');
  } catch {
    const match = window.location.href.match(/[?&]id=(\d+)/);
    return match ? match[1] : null;
  }
}

/**
 * Scrape assignments from the assignment index page table
 */
export function scrapeAssignmentIndex(
  courseMoodleId: string,
  filterSections?: string[]
): ScrapedAssignmentWithSection[] {
  console.log('[AssignmentIndexScraper] Starting scrape for course:', courseMoodleId);
  if (filterSections) {
    console.log('[AssignmentIndexScraper] Filtering by sections:', filterSections);
  }

  const assignments: ScrapedAssignmentWithSection[] = [];

  // Find the assignments table
  const table = document.querySelector('table.generaltable');
  if (!table) {
    console.warn('[AssignmentIndexScraper] No table found');
    return [];
  }

  // Get all rows (skip header)
  const rows = table.querySelectorAll('tbody tr');
  console.log(`[AssignmentIndexScraper] Found ${rows.length} rows`);

  // Track current section (some rows don't have section, inherit from previous)
  let currentSection = '';

  for (const row of rows) {
    const { assignment, section } = extractAssignmentFromRow(row, courseMoodleId, currentSection);

    // Update current section if this row had one
    if (section) {
      currentSection = section;
    }

    if (assignment) {
      // Filter by sections if specified
      if (filterSections && filterSections.length > 0) {
        if (!assignment.section || !filterSections.includes(assignment.section)) {
          continue; // Skip this assignment
        }
      }
      assignments.push(assignment);
    }
  }

  console.log(`[AssignmentIndexScraper] Scraped ${assignments.length} assignments`);
  return assignments;
}

/**
 * Get unique sections from the assignment index page
 */
export function scrapeCourseSections(courseMoodleId: string): string[] {
  console.log('[AssignmentIndexScraper] Scraping sections for course:', courseMoodleId);

  const sections = new Set<string>();

  // Find the assignments table
  const table = document.querySelector('table.generaltable');
  if (!table) {
    console.warn('[AssignmentIndexScraper] No table found');
    return [];
  }

  // Get all rows
  const rows = table.querySelectorAll('tbody tr');

  for (const row of rows) {
    const sectionCell = row.querySelector('.cell.c0');
    const sectionText = sectionCell?.textContent?.trim();
    if (sectionText) {
      sections.add(sectionText);
    }
  }

  const result = Array.from(sections);
  console.log(`[AssignmentIndexScraper] Found ${result.length} sections:`, result);
  return result;
}

/**
 * Extract assignment data from a table row
 */
function extractAssignmentFromRow(
  row: Element,
  courseMoodleId: string,
  currentSection: string
): { assignment: ScrapedAssignmentWithSection | null; section: string | null } {
  // Column structure:
  // c0: Section name (יחידת הוראה)
  // c1: Assignment name with link (מטלות)
  // c2: Due date (עד לתאריך)
  // c3: Submission status (הגשה)
  // c4: Grade (ציונים)

  // Get section from this row (may be empty, then use currentSection)
  const sectionCell = row.querySelector('.cell.c0');
  const sectionText = sectionCell?.textContent?.trim() || null;
  const section = sectionText || currentSection;

  // Get the link to the assignment
  const linkCell = row.querySelector('.cell.c1');
  const link = linkCell?.querySelector('a');

  if (!link) {
    return { assignment: null, section: sectionText };
  }

  const url = link.href;
  const title = link.textContent?.trim() || '';

  if (!title) {
    return { assignment: null, section: sectionText };
  }

  // Extract moodleId from URL (e.g., /mod/assign/view.php?id=884458)
  const moodleId = extractIdFromUrl(url);
  if (!moodleId) {
    console.warn('[AssignmentIndexScraper] Could not extract ID from URL:', url);
    return { assignment: null, section: sectionText };
  }

  // Get due date
  const dueDateCell = row.querySelector('.cell.c2');
  const dueDateText = dueDateCell?.textContent?.trim() || '';
  const dueDate = parseHebrewDate(dueDateText);

  // Get submission status
  const statusCell = row.querySelector('.cell.c3');
  const status = statusCell?.textContent?.trim() || '';

  // Get grade (optional)
  const gradeCell = row.querySelector('.cell.c4');
  const gradeText = gradeCell?.textContent?.trim() || '';
  const grade = gradeText !== '-' ? gradeText : undefined;

  // Determine type - this page is only for assignments (not quizzes)
  const type: MoodleAssignmentType = 'assignment';

  return {
    assignment: {
      moodleId,
      courseMoodleId,
      title,
      dueDate: dueDate || undefined,
      url,
      type,
      section: section || undefined,
      // Store extra info in description
      description: status ? `סטטוס: ${status}${grade ? ` | ציון: ${grade}` : ''}` : undefined,
    },
    section: sectionText,
  };
}

/**
 * Extract ID from Moodle URL
 */
function extractIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('id');
  } catch {
    const match = url.match(/[?&]id=(\d+)/);
    return match ? match[1] : null;
  }
}

/**
 * Parse Hebrew date format to ISO string
 * Example: "יום שני, 3 נובמבר 2025, 11:59 PM"
 */
function parseHebrewDate(dateStr: string): string | null {
  if (!dateStr) return null;

  // Pattern: day-name, day month year, time
  // Example: "יום שני, 3 נובמבר 2025, 11:59 PM"
  const match = dateStr.match(/(\d{1,2})\s+(\S+)\s+(\d{4})/);

  if (!match) {
    return null;
  }

  const day = parseInt(match[1], 10);
  const monthName = match[2];
  const year = parseInt(match[3], 10);

  const month = HEBREW_MONTHS[monthName];
  if (month === undefined) {
    console.warn('[AssignmentIndexScraper] Unknown month:', monthName);
    return null;
  }

  // Extract time
  const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  let hours = 23;
  let minutes = 59;

  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);

    // Handle AM/PM
    const ampm = timeMatch[3]?.toUpperCase();
    if (ampm === 'PM' && hours < 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }
  }

  const date = new Date(year, month, day, hours, minutes, 0);
  return date.toISOString();
}

export default {
  isAssignmentIndexPage,
  getCourseIdFromUrl,
  scrapeAssignmentIndex,
  scrapeCourseSections,
};
