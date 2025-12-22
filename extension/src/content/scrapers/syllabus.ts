/**
 * Syllabus Scraper for SemesterHub Extension
 *
 * Phase 1: Find syllabus links in course pages
 * Future Phase 2: Parse syllabus for course metadata
 */

/**
 * Patterns to identify syllabus links
 */
const SYLLABUS_PATTERNS = {
  textPatterns: [
    /סילבוס/i,
    /syllabus/i,
    /תוכנית\s*הקורס/i,
    /תכנית\s*לימודים/i,
    /course\s*outline/i,
    /course\s*program/i,
  ],
  urlPatterns: [
    /syllabus/i,
    /סילבוס/i,
    /course[_-]?outline/i,
  ],
  fileExtensions: ['.pdf', '.doc', '.docx'],
};

/**
 * Find syllabus link in a course page
 *
 * Searches for:
 * - Links with "סילבוס" / "Syllabus" text
 * - Links to PDF with "syllabus" in URL
 * - Block with title "מידע על הקורס"
 *
 * @param doc - Document to search in (defaults to current document)
 * @returns Syllabus URL if found, null otherwise
 */
export function findSyllabusInCoursePage(doc: Document = document): string | null {
  console.debug('[SyllabusScraper] Searching for syllabus link...');

  // Strategy 1: Find links with syllabus-related text
  const textLink = findLinkByText(doc);
  if (textLink) {
    console.debug('[SyllabusScraper] Found syllabus by text:', textLink);
    return textLink;
  }

  // Strategy 2: Find links with syllabus in URL
  const urlLink = findLinkByUrl(doc);
  if (urlLink) {
    console.debug('[SyllabusScraper] Found syllabus by URL:', urlLink);
    return urlLink;
  }

  // Strategy 3: Find in course info block
  const blockLink = findLinkInInfoBlock(doc);
  if (blockLink) {
    console.debug('[SyllabusScraper] Found syllabus in info block:', blockLink);
    return blockLink;
  }

  console.debug('[SyllabusScraper] No syllabus link found');
  return null;
}

/**
 * Find syllabus link by matching text content
 */
function findLinkByText(doc: Document): string | null {
  const links = doc.querySelectorAll<HTMLAnchorElement>('a[href]');

  for (const link of links) {
    const text = link.textContent?.trim() || '';
    const title = link.getAttribute('title') || '';
    const ariaLabel = link.getAttribute('aria-label') || '';

    const searchText = `${text} ${title} ${ariaLabel}`;

    for (const pattern of SYLLABUS_PATTERNS.textPatterns) {
      if (pattern.test(searchText)) {
        // Validate it's a real link (not just navigation)
        const href = link.href;
        if (isValidSyllabusUrl(href)) {
          return href;
        }
      }
    }
  }

  return null;
}

/**
 * Find syllabus link by matching URL patterns
 */
function findLinkByUrl(doc: Document): string | null {
  const links = doc.querySelectorAll<HTMLAnchorElement>('a[href]');

  for (const link of links) {
    const href = link.href;

    // Check if URL contains syllabus patterns
    for (const pattern of SYLLABUS_PATTERNS.urlPatterns) {
      if (pattern.test(href)) {
        if (isValidSyllabusUrl(href)) {
          return href;
        }
      }
    }

    // Check for PDF files with relevant names
    if (href.toLowerCase().endsWith('.pdf')) {
      const fileName = href.split('/').pop() || '';
      for (const pattern of SYLLABUS_PATTERNS.urlPatterns) {
        if (pattern.test(fileName)) {
          return href;
        }
      }
    }
  }

  return null;
}

/**
 * Find syllabus link in course info blocks
 * Moodle often has a "מידע על הקורס" or "Course Information" block
 */
function findLinkInInfoBlock(doc: Document): string | null {
  // Common selectors for course info blocks
  const infoBlockSelectors = [
    '[data-block="html"]', // HTML block
    '.block_html',
    '.course-info',
    '#course-info',
    '[class*="course-summary"]',
  ];

  for (const selector of infoBlockSelectors) {
    const blocks = doc.querySelectorAll(selector);

    for (const block of blocks) {
      // Check if block title mentions course info
      const header = block.querySelector('h2, h3, .card-title, .header');
      const headerText = header?.textContent || '';

      if (/מידע|קורס|information/i.test(headerText)) {
        // Look for syllabus link within this block
        const links = block.querySelectorAll<HTMLAnchorElement>('a[href]');

        for (const link of links) {
          const text = link.textContent?.trim() || '';
          for (const pattern of SYLLABUS_PATTERNS.textPatterns) {
            if (pattern.test(text)) {
              return link.href;
            }
          }
        }
      }
    }
  }

  return null;
}

/**
 * Validate that a URL is likely a valid syllabus link
 * Filters out navigation links, mailto, etc.
 */
function isValidSyllabusUrl(url: string): boolean {
  if (!url) return false;

  // Must be http/https
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return false;
  }

  // Skip certain patterns
  const skipPatterns = [
    /^mailto:/,
    /^javascript:/,
    /#$/,
    /\/login/,
    /\/logout/,
  ];

  for (const pattern of skipPatterns) {
    if (pattern.test(url)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if the current page is a course page
 */
export function isCoursePage(): boolean {
  const path = window.location.pathname;
  return path.includes('/course/view.php');
}

/**
 * Get course ID from current URL (for course pages)
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

// Future Phase 2: Parse syllabus for metadata
// export interface CourseMetadata {
//   credits?: number;
//   instructor?: string;
//   totalAssignments?: number;
//   assignmentWeight?: number;
// }
//
// export function parseSyllabus(syllabusHtml: string): CourseMetadata {
//   // TODO: Implement syllabus parsing
//   return {};
// }

export default {
  findSyllabusInCoursePage,
  isCoursePage,
  getCourseIdFromUrl,
};
