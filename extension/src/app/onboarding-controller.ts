/**
 * Onboarding Controller for SemesterHub
 *
 * Manages the onboarding flow:
 * 1. Scrape available courses from Moodle
 * 2. Let user select courses
 * 3. Fetch sections for each course
 * 4. Let user select sections per course
 * 5. Let user set metadata (credits, etc.)
 * 6. Create semester and save
 */

import * as storage from '../services/local-storage.service';
import * as sync from '../services/sync.service';
import { navigate, setAvailableCourses } from '../ui';
import { handleError, showErrorToast, showSuccessToast } from './error-handler';
import type {
  MoodleUser,
  SemesterData,
  ScrapedCourse,
  CourseWithMeta,
  COURSE_COLORS,
} from '../shared/types';

// ========================================
// Constants
// ========================================

// Course colors for the cumulative view
const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
];

// ========================================
// State
// ========================================

interface OnboardingState {
  step: 'welcome' | 'select-courses' | 'select-sections' | 'set-metadata' | 'done';
  availableCourses: ScrapedCourse[];
  selectedCourseIds: string[];
  courseSections: Record<string, string[]>;
  selectedSections: Record<string, string[]>;
  courseMetadata: Record<string, Partial<CourseWithMeta>>;
}

let state: OnboardingState = {
  step: 'welcome',
  availableCourses: [],
  selectedCourseIds: [],
  courseSections: {},
  selectedSections: {},
  courseMetadata: {},
};

// ========================================
// State Management
// ========================================

/**
 * Reset onboarding state
 */
export function resetOnboardingState(): void {
  state = {
    step: 'welcome',
    availableCourses: [],
    selectedCourseIds: [],
    courseSections: {},
    selectedSections: {},
    courseMetadata: {},
  };
}

/**
 * Get current onboarding state
 */
export function getOnboardingState(): OnboardingState {
  return { ...state };
}

// ========================================
// Course Management
// ========================================

/**
 * Set available courses from scraping
 */
export function setAvailableCoursesForOnboarding(courses: ScrapedCourse[]): void {
  state.availableCourses = courses;
  setAvailableCourses(courses);
  console.log('[Onboarding] Set available courses:', courses.length);
}

/**
 * Select/deselect a course
 */
export function toggleCourseSelection(moodleId: string): void {
  const index = state.selectedCourseIds.indexOf(moodleId);
  if (index >= 0) {
    state.selectedCourseIds.splice(index, 1);
  } else {
    state.selectedCourseIds.push(moodleId);
  }
}

/**
 * Get selected courses
 */
export function getSelectedCourses(): ScrapedCourse[] {
  return state.availableCourses.filter((c) =>
    state.selectedCourseIds.includes(c.moodleId)
  );
}

// ========================================
// Section Management
// ========================================

/**
 * Set sections for a course
 */
export function setCourseSections(moodleId: string, sections: string[]): void {
  state.courseSections[moodleId] = sections;
  // Default: select all sections
  state.selectedSections[moodleId] = [...sections];
}

/**
 * Toggle section selection for a course
 */
export function toggleSectionSelection(moodleId: string, section: string): void {
  if (!state.selectedSections[moodleId]) {
    state.selectedSections[moodleId] = [];
  }

  const index = state.selectedSections[moodleId].indexOf(section);
  if (index >= 0) {
    state.selectedSections[moodleId].splice(index, 1);
  } else {
    state.selectedSections[moodleId].push(section);
  }
}

// ========================================
// Metadata Management
// ========================================

/**
 * Set metadata for a course
 */
export function setCourseMetadata(
  moodleId: string,
  metadata: Partial<CourseWithMeta>
): void {
  state.courseMetadata[moodleId] = {
    ...state.courseMetadata[moodleId],
    ...metadata,
  };
}

// ========================================
// Semester Creation
// ========================================

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `sem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Detect semester name from current date
 * In Israel: Sep-Jan = Semester A, Feb-Jun = Semester B, Jul-Aug = Summer
 */
function detectSemesterName(): string {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  // Convert to Hebrew year (approximately)
  const hebrewYear = year + 3760;
  const hebrewYearShort = hebrewYear % 1000;

  // Hebrew year letters (simplified)
  const yearLetters = getHebrewYearLetters(hebrewYearShort);

  if (month >= 8 || month <= 0) {
    // Sep-Jan = Semester A
    return `סמסטר א' תש${yearLetters}`;
  } else if (month >= 1 && month <= 5) {
    // Feb-Jun = Semester B
    return `סמסטר ב' תש${yearLetters}`;
  } else {
    // Jul-Aug = Summer
    return `סמסטר קיץ תש${yearLetters}`;
  }
}

/**
 * Get Hebrew year letters (simplified)
 */
function getHebrewYearLetters(yearShort: number): string {
  // This is a simplified version - maps common years
  const yearMap: Record<number, string> = {
    784: 'פ"ד',
    785: 'פ"ה',
    786: 'פ"ו',
    787: 'פ"ז',
    788: 'פ"ח',
    789: 'פ"ט',
  };

  return yearMap[yearShort] || `"${yearShort}`;
}

/**
 * Create semester data from onboarding selections
 */
export async function createSemester(): Promise<SemesterData | null> {
  const user = await storage.getCurrentUser();
  if (!user) {
    showErrorToast('יש להתחבר למודל כדי להמשיך');
    return null;
  }

  if (state.selectedCourseIds.length === 0) {
    showErrorToast('יש לבחור לפחות קורס אחד');
    return null;
  }

  try {
    // Build courses with metadata
    const courses: CourseWithMeta[] = state.selectedCourseIds.map((moodleId, index) => {
      const scraped = state.availableCourses.find((c) => c.moodleId === moodleId);
      const metadata = state.courseMetadata[moodleId] || {};
      const sections = state.selectedSections[moodleId] || [];

      return {
        moodleId,
        name: scraped?.name || `Course ${moodleId}`,
        url: scraped?.url,
        credits: metadata.credits,
        totalAssignments: metadata.totalAssignments,
        requiredAssignments: metadata.requiredAssignments,
        assignmentWeight: metadata.assignmentWeight,
        color: COLORS[index % COLORS.length],
        sections,
      };
    });

    // Create semester
    const semester: SemesterData = {
      id: generateId(),
      name: detectSemesterName(),
      universityDomain: user.universityDomain,
      moodleUserId: user.moodleUserId,
      courses,
      assignments: [], // Will be populated after scraping assignments
      createdAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
    };

    // Save locally
    await storage.setCurrentSemester(semester);
    console.log('[Onboarding] Semester created:', semester.name);

    // Sync to server (non-blocking)
    syncNewSemester(user, semester);

    return semester;
  } catch (error) {
    handleError(error as Error, {
      context: 'Create semester',
      user,
    });
    showErrorToast('שגיאה ביצירת הסמסטר');
    return null;
  }
}

/**
 * Sync new semester to server
 */
async function syncNewSemester(user: MoodleUser, semester: SemesterData): Promise<void> {
  try {
    await sync.syncUser(user);
    await sync.syncCourses(user, semester);
    console.log('[Onboarding] Semester synced to server');
  } catch (error) {
    // Don't show error - data is saved locally
    console.warn('[Onboarding] Sync failed, data saved locally:', error);
  }
}

// ========================================
// Onboarding Flow
// ========================================

/**
 * Complete onboarding and navigate to dashboard
 */
export async function completeOnboarding(): Promise<void> {
  const semester = await createSemester();

  if (semester) {
    showSuccessToast('הסמסטר נוצר בהצלחה!');
    state.step = 'done';
    navigate('dashboard');
  }
}

/**
 * Start onboarding flow
 * Called when user clicks the tab for the first time
 */
export async function startOnboarding(): Promise<void> {
  console.log('[Onboarding] Starting onboarding flow');
  resetOnboardingState();
  state.step = 'welcome';
  navigate('onboarding');
}

// ========================================
// Fetch Sections Helper
// ========================================

/**
 * Fetch sections for selected courses
 * This will be called from the onboarding view
 *
 * @param courses - Selected courses to fetch sections for
 * @returns Map of course moodleId to section names
 */
export async function fetchSectionsForCourses(
  courses: ScrapedCourse[]
): Promise<Record<string, string[]>> {
  // This is a placeholder - actual implementation depends on how we fetch sections
  // In Wave 6, sections are fetched via background script navigating to assignment index pages

  console.log('[Onboarding] Fetching sections for courses:', courses.map((c) => c.name));

  // For now, return the sections we already have in state (from previous scraping)
  const result: Record<string, string[]> = {};

  for (const course of courses) {
    if (state.courseSections[course.moodleId]) {
      result[course.moodleId] = state.courseSections[course.moodleId];
    } else {
      // Default sections if not available
      result[course.moodleId] = [];
    }
  }

  return result;
}

// ========================================
// Export
// ========================================

export default {
  resetOnboardingState,
  getOnboardingState,
  setAvailableCoursesForOnboarding,
  toggleCourseSelection,
  getSelectedCourses,
  setCourseSections,
  toggleSectionSelection,
  setCourseMetadata,
  createSemester,
  completeOnboarding,
  startOnboarding,
  fetchSectionsForCourses,
};
