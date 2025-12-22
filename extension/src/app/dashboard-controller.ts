/**
 * Dashboard Controller for SemesterHub
 *
 * Manages the dashboard view:
 * - Displays cumulative semester progress
 * - Handles sync operations
 * - Manages course editing
 */

import * as storage from '../services/local-storage.service';
import * as sync from '../services/sync.service';
import { navigate, setCurrentSemester as setUISemester, updateDashboard } from '../ui';
import { handleError, showErrorToast, showSuccessToast, showInfoToast } from './error-handler';
import type {
  MoodleUser,
  SemesterData,
  CourseWithMeta,
  AssignmentProgress,
} from '../shared/types';

// ========================================
// State
// ========================================

interface DashboardState {
  isSyncing: boolean;
  lastSyncError: string | null;
}

let state: DashboardState = {
  isSyncing: false,
  lastSyncError: null,
};

// ========================================
// Initialization
// ========================================

/**
 * Initialize dashboard with current semester data
 * @param container - Container element to render into
 */
export async function initDashboard(container: HTMLElement): Promise<void> {
  console.log('[Dashboard] Initializing...');

  const semester = await storage.getCurrentSemester();

  if (!semester) {
    console.log('[Dashboard] No semester data, redirecting to onboarding');
    navigate('onboarding');
    return;
  }

  // Update UI with current data
  setUISemester(semester);

  console.log('[Dashboard] Initialized with semester:', semester.name);
}

// ========================================
// Sync Operations
// ========================================

/**
 * Handle sync button click
 * Syncs local data to server
 */
export async function handleSync(): Promise<void> {
  if (state.isSyncing) {
    console.log('[Dashboard] Sync already in progress');
    return;
  }

  const user = await storage.getCurrentUser();
  const semester = await storage.getCurrentSemester();

  if (!user || !semester) {
    showErrorToast('לא ניתן לסנכרן - אין נתונים');
    return;
  }

  state.isSyncing = true;
  state.lastSyncError = null;
  showInfoToast('מסנכרן נתונים...');

  try {
    const result = await sync.fullSync(user, semester);

    if (result.success) {
      // Update lastSyncedAt
      const updatedSemester = await storage.updateSemester({
        lastSyncedAt: new Date().toISOString(),
      });

      if (updatedSemester) {
        setUISemester(updatedSemester);
      }

      showSuccessToast('הסנכרון הושלם בהצלחה');
      console.log('[Dashboard] Sync complete:', result);
    } else {
      state.lastSyncError = result.error || 'Unknown error';
      showErrorToast('שגיאה בסנכרון - הנתונים נשמרו מקומית');
      console.warn('[Dashboard] Sync failed:', result.error);
    }
  } catch (error) {
    state.lastSyncError = (error as Error).message;
    handleError(error as Error, {
      context: 'Dashboard sync',
      user,
    });
  } finally {
    state.isSyncing = false;
  }
}

/**
 * Check if sync is in progress
 */
export function isSyncing(): boolean {
  return state.isSyncing;
}

// ========================================
// Course Management
// ========================================

/**
 * Handle course edit
 * @param course - The course to edit
 * @param updates - Partial updates to apply
 */
export async function handleEditCourse(
  course: CourseWithMeta,
  updates: Partial<CourseWithMeta>
): Promise<void> {
  console.log('[Dashboard] Editing course:', course.moodleId, updates);

  try {
    await storage.updateCourse(course.moodleId, updates);

    // Reload semester data
    const semester = await storage.getCurrentSemester();
    if (semester) {
      setUISemester(semester);
    }

    // Sync in background
    const user = await storage.getCurrentUser();
    if (user && semester) {
      sync.syncCourses(user, semester).catch(console.error);
    }
  } catch (error) {
    handleError(error as Error, {
      context: 'Edit course',
      user: await storage.getCurrentUser(),
    });
    showErrorToast('שגיאה בעדכון הקורס');
  }
}

/**
 * Update course color
 */
export async function updateCourseColor(
  moodleId: string,
  color: string
): Promise<void> {
  await handleEditCourse({ moodleId } as CourseWithMeta, { color });
}

/**
 * Update course metadata
 */
export async function updateCourseMetadata(
  moodleId: string,
  metadata: Partial<CourseWithMeta>
): Promise<void> {
  await handleEditCourse({ moodleId } as CourseWithMeta, metadata);
}

// ========================================
// Assignment Management
// ========================================

/**
 * Update assignment status
 */
export async function updateAssignmentStatus(
  moodleId: string,
  status: AssignmentProgress['status']
): Promise<void> {
  console.log('[Dashboard] Updating assignment status:', moodleId, status);

  try {
    await storage.updateAssignment(moodleId, { status });

    // Reload and refresh UI
    const semester = await storage.getCurrentSemester();
    if (semester) {
      setUISemester(semester);
    }

    // Sync progress in background
    const user = await storage.getCurrentUser();
    if (user && semester) {
      sync.quickSync(user, semester).catch(console.error);
    }
  } catch (error) {
    handleError(error as Error, {
      context: 'Update assignment status',
      user: await storage.getCurrentUser(),
    });
  }
}

// ========================================
// Navigation
// ========================================

/**
 * Navigate to settings
 */
export function goToSettings(): void {
  navigate('settings');
}

/**
 * Navigate back to dashboard
 */
export function goToDashboard(): void {
  navigate('dashboard');
}

// ========================================
// Data Refresh
// ========================================

/**
 * Refresh dashboard with latest data from storage
 */
export async function refreshDashboard(): Promise<void> {
  const semester = await storage.getCurrentSemester();
  if (semester) {
    setUISemester(semester);
  }
}

/**
 * Get current semester data
 */
export async function getCurrentSemesterData(): Promise<SemesterData | null> {
  return storage.getCurrentSemester();
}

// ========================================
// Semester Stats
// ========================================

/**
 * Calculate semester statistics for display
 */
export function calculateStats(semester: SemesterData): {
  totalCourses: number;
  totalAssignments: number;
  submittedAssignments: number;
  pendingAssignments: number;
  overdueAssignments: number;
  progressPercent: number;
} {
  const totalCourses = semester.courses.length;
  const totalAssignments = semester.assignments.length;

  const submittedAssignments = semester.assignments.filter(
    (a) => a.status === 'submitted'
  ).length;

  const pendingAssignments = semester.assignments.filter(
    (a) => a.status === 'pending'
  ).length;

  const overdueAssignments = semester.assignments.filter(
    (a) => a.status === 'overdue'
  ).length;

  const progressPercent = totalAssignments > 0
    ? Math.round((submittedAssignments / totalAssignments) * 100)
    : 0;

  return {
    totalCourses,
    totalAssignments,
    submittedAssignments,
    pendingAssignments,
    overdueAssignments,
    progressPercent,
  };
}

// ========================================
// Export
// ========================================

export default {
  initDashboard,
  handleSync,
  isSyncing,
  handleEditCourse,
  updateCourseColor,
  updateCourseMetadata,
  updateAssignmentStatus,
  goToSettings,
  goToDashboard,
  refreshDashboard,
  getCurrentSemesterData,
  calculateStats,
};
