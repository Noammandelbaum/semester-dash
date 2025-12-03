import type { UniversityConfig, MoodleSelectors } from './types';

// SemesterHub API configuration
// For development: change to 'http://localhost:3000' and rebuild
// For production: 'https://semester-dash.vercel.app'
export const API_BASE_URL = 'https://semester-dash.vercel.app';

// ========================================
// Known Israeli Institutions
// ========================================

/**
 * Map of domain identifiers to institution info
 * Key: the subdomain/domain identifier (e.g., 'tau' from moodle.tau.ac.il)
 */
export const KNOWN_INSTITUTIONS: Record<string, { name: string; nameHe: string }> = {
  // Universities
  tau: { name: 'Tel Aviv University', nameHe: 'אוניברסיטת תל אביב' },
  huji: { name: 'Hebrew University', nameHe: 'האוניברסיטה העברית' },
  technion: { name: 'Technion', nameHe: 'הטכניון' },
  bgu: { name: 'Ben-Gurion University', nameHe: 'אוניברסיטת בן-גוריון' },
  biu: { name: 'Bar-Ilan University', nameHe: 'אוניברסיטת בר-אילן' },
  haifa: { name: 'University of Haifa', nameHe: 'אוניברסיטת חיפה' },
  openu: { name: 'Open University', nameHe: 'האוניברסיטה הפתוחה' },
  ariel: { name: 'Ariel University', nameHe: 'אוניברסיטת אריאל' },

  // Colleges - Jerusalem & Center
  jct: { name: 'Jerusalem College of Technology', nameHe: 'מכון לב - JCT' },
  lev: { name: 'Jerusalem College of Technology', nameHe: 'מכון לב' },
  machonlev: { name: 'Jerusalem College of Technology', nameHe: 'מכון לב' },
  bezalel: { name: 'Bezalel Academy', nameHe: 'בצלאל' },
  shenkar: { name: 'Shenkar College', nameHe: 'שנקר' },
  idc: { name: 'Reichman University', nameHe: 'אוניברסיטת רייכמן' },
  runi: { name: 'Reichman University', nameHe: 'אוניברסיטת רייכמן' },
  reichman: { name: 'Reichman University', nameHe: 'אוניברסיטת רייכמן' },
  mta: { name: 'Tel Aviv-Yafo College', nameHe: 'המכללה האקדמית תל אביב-יפו' },
  afeka: { name: 'Afeka College', nameHe: 'אפקה' },
  hit: { name: 'Holon Institute of Technology', nameHe: 'המכון הטכנולוגי חולון' },
  sce: { name: 'SCE College', nameHe: 'סמי שמעון' },

  // Colleges - North
  yvc: { name: 'Yezreel Valley College', nameHe: 'עמק יזרעאל' },
  gal: { name: 'Galilee College', nameHe: 'מכללת גליל' },
  telhai: { name: 'Tel-Hai College', nameHe: 'תל-חי' },
  braude: { name: 'Braude College', nameHe: 'בראודה' },

  // Colleges - South
  sapir: { name: 'Sapir College', nameHe: 'ספיר' },
  achva: { name: 'Achva College', nameHe: 'אחווה' },

  // Teacher Training Colleges
  gordon: { name: 'Gordon College', nameHe: 'גורדון' },
  oranim: { name: 'Oranim College', nameHe: 'אורנים' },
  levinsky: { name: 'Levinsky College', nameHe: 'לוינסקי' },
  seminar: { name: 'Seminar Hakibbutzim', nameHe: 'סמינר הקיבוצים' },
  kibbutzim: { name: 'Seminar Hakibbutzim', nameHe: 'סמינר הקיבוצים' },

  // Other
  hadassah: { name: 'Hadassah College', nameHe: 'הדסה' },
  ruppin: { name: 'Ruppin College', nameHe: 'רופין' },
  kinneret: { name: 'Kinneret College', nameHe: 'כנרת' },
};

// ========================================
// Default Selectors (work on all Moodle)
// ========================================

/**
 * Default selectors that work across most Moodle installations
 * Ordered by priority: data-* attributes, Moodle 4.x, Moodle 3.x, generic
 */
export const DEFAULT_SELECTORS: MoodleSelectors = {
  courseList: [
    '[data-region="course-content"]',
    '[data-courseid]',
    '.dashboard-card',
    '.course-card',
    '.course-listitem',
    '.course-info-container',
    '.coursebox',
    '.coursename',
  ],
  courseName: [
    '[data-field="fullname"]',
    '.course-title',
    '.course-card-name',
    '.coursename a',
    '.coursename',
    '.fullname',
  ],
  courseUrl: [
    '.course-title a',
    '.course-card-name a',
    '.coursename a',
    'a[href*="/course/view.php"]',
  ],
  assignmentList: [
    '[data-activityname]',
    '[data-for="cmitem"]',
    '.activity-item',
    '.activity-wrapper',
    '.activityinstance',
    '.activity',
    '.modtype_assign',
    '.modtype_quiz',
  ],
  assignmentName: [
    '[data-activityname]',
    '.activityname a',
    '.activity-name-area a',
    '.instancename',
    '.aalink',
  ],
  assignmentDueDate: [
    '[data-region="activity-dates"]',
    '.activity-dates',
    '.availabilityinfo',
    '.contentafterlink',
    '.date',
  ],
  assignmentType: [
    '[data-activitytype]',
    '[data-modname]',
    '.activityiconcontainer img',
    '.modtype_assign',
    '.modtype_quiz',
    '.modtype_forum',
  ],
  version: 'auto',
};

// ========================================
// University Configurations
// ========================================

/**
 * Full configurations for known universities
 * Used when we need specific URLs or custom selectors
 */
export const UNIVERSITIES: Record<string, UniversityConfig> = {};

// Generate configs for all known institutions
for (const [id, info] of Object.entries(KNOWN_INSTITUTIONS)) {
  // Skip duplicates (e.g., 'lev' and 'jct' point to same institution)
  if (UNIVERSITIES[id]) continue;

  UNIVERSITIES[id] = {
    id: id as UniversityConfig['id'],
    name: info.name,
    nameHe: info.nameHe,
    moodleUrl: `https://moodle.${id}.ac.il`,
    loginUrl: `https://moodle.${id}.ac.il/login/index.php`,
    dashboardUrl: `https://moodle.${id}.ac.il/my/`,
    selectors: { ...DEFAULT_SELECTORS },
  };
}

// ========================================
// URL Parsing & Detection
// ========================================

/**
 * Extract institution identifier from a Moodle URL
 *
 * Examples:
 * - https://moodle.tau.ac.il/my/ → 'tau'
 * - https://moodle.jct.ac.il/course/view.php?id=123 → 'jct'
 * - https://lms.college.edu/my/ → 'college'
 * - https://some-moodle.org/course/ → 'some-moodle'
 */
export function extractInstitutionId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Pattern 1: moodle.XXX.ac.il or moodle.XXX.edu
    const moodleSubdomain = hostname.match(/^moodle\.([^.]+)\./);
    if (moodleSubdomain) {
      return moodleSubdomain[1];
    }

    // Pattern 2: XXX.moodle.com or lms.XXX.ac.il
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      // If starts with 'moodle' or 'lms', take the next part
      if (parts[0] === 'moodle' || parts[0] === 'lms') {
        return parts[1];
      }
      // Otherwise take the first part
      return parts[0];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get institution info from URL
 * Returns known institution info or generated info from URL
 */
export function getInstitutionInfo(url: string): { id: string; name: string; nameHe: string } | null {
  const institutionId = extractInstitutionId(url);

  if (!institutionId) {
    return null;
  }

  // Check if it's a known institution
  const known = KNOWN_INSTITUTIONS[institutionId];
  if (known) {
    return {
      id: institutionId,
      name: known.name,
      nameHe: known.nameHe,
    };
  }

  // Return generic info with the extracted ID
  return {
    id: institutionId,
    name: institutionId.toUpperCase(),
    nameHe: `Moodle - ${institutionId.toUpperCase()}`,
  };
}

/**
 * Detect university from URL
 * Works with ANY Moodle URL - returns config for known institutions
 * or generates a generic config for unknown ones
 */
export function detectUniversity(url: string): UniversityConfig | null {
  const urlLower = url.toLowerCase();

  // Must be a Moodle page
  if (!isMoodleUrl(urlLower)) {
    return null;
  }

  const info = getInstitutionInfo(url);
  if (!info) {
    return null;
  }

  // Check if we have a pre-configured university
  if (UNIVERSITIES[info.id]) {
    return UNIVERSITIES[info.id];
  }

  // Generate a generic config for this institution
  try {
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;

    return {
      id: info.id as UniversityConfig['id'],
      name: info.name,
      nameHe: info.nameHe,
      moodleUrl: baseUrl,
      loginUrl: `${baseUrl}/login/index.php`,
      dashboardUrl: `${baseUrl}/my/`,
      selectors: { ...DEFAULT_SELECTORS },
    };
  } catch {
    return null;
  }
}

/**
 * Check if URL is a Moodle URL
 */
export function isMoodleUrl(url: string): boolean {
  const urlLower = url.toLowerCase();

  // Check hostname contains 'moodle'
  if (urlLower.includes('moodle')) {
    return true;
  }

  // Check for Moodle-specific paths
  const moodlePaths = ['/my/', '/course/', '/mod/', '/login/index.php'];
  for (const path of moodlePaths) {
    if (urlLower.includes(path)) {
      return true;
    }
  }

  return false;
}

/**
 * Detect Moodle version from page
 */
export async function detectMoodleVersion(): Promise<'3.x' | '4.x'> {
  // Check for Moodle 4.x indicators
  const moodle4Indicators = [
    '[data-region="course-content"]',
    '.activity-item',
    '.course-section-header',
    '[data-for="cmitem"]',
  ];

  for (const selector of moodle4Indicators) {
    if (document.querySelector(selector)) {
      return '4.x';
    }
  }

  // Check for Moodle 3.x indicators
  const moodle3Indicators = [
    '.course-content .section',
    '.activityinstance',
    '.course-info-container',
  ];

  for (const selector of moodle3Indicators) {
    if (document.querySelector(selector)) {
      return '3.x';
    }
  }

  // Default to 4.x as it's more common now
  return '4.x';
}

/**
 * Get all supported institution IDs
 */
export function getSupportedInstitutions(): string[] {
  return Object.keys(KNOWN_INSTITUTIONS);
}
