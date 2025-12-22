/**
 * Onboarding View
 *
 * Multi-step onboarding flow for new users
 */

import type { ScrapedCourse, CourseWithMeta, SemesterData } from '../../../shared/types';
import { COURSE_COLORS } from '../../../shared/types';
import { createWelcome } from './Welcome';
import { createSelectCourses } from './SelectCourses';
import { createSelectSections, type CourseWithSections, type SelectedCourseWithSections } from './SelectSections';
import { createSetMetadata, type CourseMetadata } from './SetMetadata';
import { createDone } from './Done';

// ========================================
// Types
// ========================================

export interface OnboardingData {
  availableCourses: ScrapedCourse[];
  onComplete: (semester: SemesterData) => void;
  fetchSections: (courses: ScrapedCourse[]) => Promise<Record<string, string[]>>;
}

type OnboardingStep = 'welcome' | 'selectCourses' | 'selectSections' | 'setMetadata' | 'done';

interface OnboardingState {
  step: OnboardingStep;
  selectedCourses: ScrapedCourse[];
  coursesWithSections: CourseWithSections[];
  selectedSections: SelectedCourseWithSections[];
  metadata: CourseMetadata[];
  isSaving: boolean;
  error: string | null;
}

// ========================================
// State
// ========================================

let state: OnboardingState = {
  step: 'welcome',
  selectedCourses: [],
  coursesWithSections: [],
  selectedSections: [],
  metadata: [],
  isSaving: false,
  error: null,
};

let containerRef: HTMLElement | null = null;
let onCompleteCallback: ((semester: SemesterData) => void) | null = null;
let fetchSectionsCallback: ((courses: ScrapedCourse[]) => Promise<Record<string, string[]>>) | null = null;

// ========================================
// Rendering
// ========================================

/**
 * Render the current step
 */
function renderCurrentStep(): void {
  if (!containerRef) return;

  containerRef.innerHTML = '';

  switch (state.step) {
    case 'welcome':
      containerRef.appendChild(
        createWelcome({
          onNext: () => goToStep('selectCourses'),
        })
      );
      break;

    case 'selectCourses':
      containerRef.appendChild(
        createSelectCourses({
          courses: state.selectedCourses.length > 0 ? state.selectedCourses : [],
          onNext: handleCoursesSelected,
          onBack: () => goToStep('welcome'),
        })
      );
      break;

    case 'selectSections':
      containerRef.appendChild(
        createSelectSections({
          courses: state.coursesWithSections,
          onNext: handleSectionsSelected,
          onBack: () => goToStep('selectCourses'),
        })
      );
      break;

    case 'setMetadata':
      containerRef.appendChild(
        createSetMetadata({
          courses: state.selectedSections.map((s) => s.course),
          onNext: handleMetadataSet,
          onBack: () => goToStep('selectSections'),
          onSkip: () => {
            // Use defaults
          },
        })
      );
      break;

    case 'done':
      containerRef.appendChild(
        createDone({
          coursesCount: state.metadata.length,
          onFinish: handleFinish,
          isSaving: state.isSaving,
          error: state.error ?? undefined,
        })
      );
      break;
  }
}

// ========================================
// Navigation & Handlers
// ========================================

function goToStep(step: OnboardingStep): void {
  state = { ...state, step };
  renderCurrentStep();
}

async function handleCoursesSelected(courses: ScrapedCourse[]): Promise<void> {
  state = { ...state, selectedCourses: courses };

  // Fetch sections for selected courses
  if (fetchSectionsCallback) {
    try {
      const sectionsMap = await fetchSectionsCallback(courses);

      const coursesWithSections: CourseWithSections[] = courses.map((course) => ({
        course,
        sections: sectionsMap[course.moodleId] || ['כללי'],
      }));

      state = { ...state, coursesWithSections };
      goToStep('selectSections');
    } catch (error) {
      console.error('[Onboarding] Failed to fetch sections:', error);
      // Continue with default sections
      const coursesWithSections: CourseWithSections[] = courses.map((course) => ({
        course,
        sections: ['כללי'],
      }));
      state = { ...state, coursesWithSections };
      goToStep('selectSections');
    }
  } else {
    // No callback - use default sections
    const coursesWithSections: CourseWithSections[] = courses.map((course) => ({
      course,
      sections: ['כללי'],
    }));
    state = { ...state, coursesWithSections };
    goToStep('selectSections');
  }
}

function handleSectionsSelected(selected: SelectedCourseWithSections[]): void {
  state = { ...state, selectedSections: selected };
  goToStep('setMetadata');
}

function handleMetadataSet(metadata: CourseMetadata[]): void {
  state = { ...state, metadata, isSaving: true };
  goToStep('done');

  // Build semester data and complete
  try {
    const semester = buildSemesterData();
    state = { ...state, isSaving: false };
    renderCurrentStep();

    // Store the semester data for when user clicks finish
  } catch (error) {
    state = {
      ...state,
      isSaving: false,
      error: error instanceof Error ? error.message : 'שגיאה בלתי צפויה',
    };
    renderCurrentStep();
  }
}

function handleFinish(): void {
  if (onCompleteCallback) {
    const semester = buildSemesterData();
    onCompleteCallback(semester);
  }
}

/**
 * Build SemesterData from collected info
 */
function buildSemesterData(): SemesterData {
  const now = new Date().toISOString();

  const courses: CourseWithMeta[] = state.selectedSections.map((selected, index) => {
    const metadata = state.metadata.find((m) => m.moodleId === selected.course.moodleId);

    return {
      moodleId: selected.course.moodleId,
      name: selected.course.name,
      url: selected.course.url,
      credits: metadata?.credits,
      totalAssignments: metadata?.totalAssignments ?? 13,
      requiredAssignments: metadata?.requiredAssignments,
      assignmentWeight: metadata?.assignmentWeight,
      color: metadata?.color ?? COURSE_COLORS[index % COURSE_COLORS.length],
      sections: selected.selectedSections,
    };
  });

  return {
    id: `semester-${Date.now()}`,
    name: getSemesterName(),
    universityDomain: '', // Will be filled by caller
    moodleUserId: '', // Will be filled by caller
    courses,
    assignments: [], // Will be populated by scraping
    createdAt: now,
    lastSyncedAt: now,
  };
}

/**
 * Get current semester name (Hebrew)
 */
function getSemesterName(): string {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  // Hebrew year calculation (approximate)
  const hebrewYear = year + 3760 + (month >= 6 ? 1 : 0);
  const hebrewYearSuffix = String(hebrewYear).slice(-2);

  // Semester A: September - February, Semester B: March - August
  const semester = month >= 8 || month <= 1 ? "א'" : "ב'";

  return `סמסטר ${semester} תשפ"${hebrewLetterForNumber(parseInt(hebrewYearSuffix))}`;
}

/**
 * Convert number to Hebrew letter (simplified)
 */
function hebrewLetterForNumber(num: number): string {
  const letters = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  if (num < 10) return letters[num];
  return 'ה'; // Default for simplicity
}

// ========================================
// Main Export
// ========================================

/**
 * Render the onboarding flow
 */
export function renderOnboarding(container: HTMLElement, data: OnboardingData): void {
  containerRef = container;
  onCompleteCallback = data.onComplete;
  fetchSectionsCallback = data.fetchSections;

  // Initialize state with available courses
  state = {
    step: 'welcome',
    selectedCourses: data.availableCourses,
    coursesWithSections: [],
    selectedSections: [],
    metadata: [],
    isSaving: false,
    error: null,
  };

  // Add wrapper class
  container.className = 'sh-onboarding';

  renderCurrentStep();
}

/**
 * Reset onboarding state
 */
export function resetOnboarding(): void {
  state = {
    step: 'welcome',
    selectedCourses: [],
    coursesWithSections: [],
    selectedSections: [],
    metadata: [],
    isSaving: false,
    error: null,
  };
  containerRef = null;
  onCompleteCallback = null;
  fetchSectionsCallback = null;
}
