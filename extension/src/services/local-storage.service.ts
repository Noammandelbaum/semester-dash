/**
 * Local Storage Service for SemesterHub
 *
 * Manages data in chrome.storage.local with type safety.
 * Primary data store for the Moodle Embedded Architecture.
 */

import type {
  LocalStorageData,
  MoodleUser,
  SemesterData,
  UserSettings,
  CourseWithMeta,
  AssignmentProgress,
  DEFAULT_USER_SETTINGS,
} from '../shared/types';

// Re-export the default settings
export { DEFAULT_USER_SETTINGS } from '../shared/types';

// ========================================
// Storage Keys
// ========================================

const STORAGE_KEY = 'semesterhub_data';

// ========================================
// Default Data
// ========================================

const DEFAULT_DATA: LocalStorageData = {
  currentUser: null,
  currentSemester: null,
  settings: {
    showCompleted: true,
    theme: 'auto',
  },
  lastSyncedAt: null,
};

// ========================================
// Core Functions
// ========================================

/**
 * Get all stored data
 */
export async function getData(): Promise<LocalStorageData> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const data = result[STORAGE_KEY] as LocalStorageData | undefined;

    if (!data) {
      return { ...DEFAULT_DATA };
    }

    // Merge with defaults to ensure all fields exist
    return {
      ...DEFAULT_DATA,
      ...data,
      settings: {
        ...DEFAULT_DATA.settings,
        ...data.settings,
      },
    };
  } catch (error) {
    console.error('[SemesterHub Storage] Error getting data:', error);
    return { ...DEFAULT_DATA };
  }
}

/**
 * Set/update stored data (partial update)
 */
export async function setData(updates: Partial<LocalStorageData>): Promise<void> {
  try {
    const currentData = await getData();
    const newData: LocalStorageData = {
      ...currentData,
      ...updates,
      // Deep merge settings if provided
      settings: updates.settings
        ? { ...currentData.settings, ...updates.settings }
        : currentData.settings,
    };

    await chrome.storage.local.set({ [STORAGE_KEY]: newData });
    console.debug('[SemesterHub Storage] Data updated:', Object.keys(updates));
  } catch (error) {
    console.error('[SemesterHub Storage] Error setting data:', error);
    throw error;
  }
}

// ========================================
// User Functions
// ========================================

/**
 * Get current Moodle user
 */
export async function getCurrentUser(): Promise<MoodleUser | null> {
  const data = await getData();
  return data.currentUser;
}

/**
 * Set current Moodle user
 */
export async function setCurrentUser(user: MoodleUser | null): Promise<void> {
  await setData({ currentUser: user });
  console.log('[SemesterHub Storage] User set:', user?.moodleUserId || 'null');
}

// ========================================
// Semester Functions
// ========================================

/**
 * Get current semester data
 */
export async function getCurrentSemester(): Promise<SemesterData | null> {
  const data = await getData();
  return data.currentSemester;
}

/**
 * Set current semester data
 */
export async function setCurrentSemester(semester: SemesterData | null): Promise<void> {
  await setData({
    currentSemester: semester,
    lastSyncedAt: semester ? new Date().toISOString() : null,
  });
  console.log('[SemesterHub Storage] Semester set:', semester?.name || 'null');
}

/**
 * Update semester with partial data
 */
export async function updateSemester(
  updates: Partial<SemesterData>
): Promise<SemesterData | null> {
  const currentSemester = await getCurrentSemester();
  if (!currentSemester) {
    console.warn('[SemesterHub Storage] No semester to update');
    return null;
  }

  const updatedSemester: SemesterData = {
    ...currentSemester,
    ...updates,
    lastSyncedAt: new Date().toISOString(),
  };

  await setCurrentSemester(updatedSemester);
  return updatedSemester;
}

// ========================================
// Settings Functions
// ========================================

/**
 * Get user settings
 */
export async function getSettings(): Promise<UserSettings> {
  const data = await getData();
  return data.settings;
}

/**
 * Update user settings (partial update)
 */
export async function updateSettings(updates: Partial<UserSettings>): Promise<void> {
  const currentSettings = await getSettings();
  await setData({
    settings: { ...currentSettings, ...updates },
  });
  console.log('[SemesterHub Storage] Settings updated:', Object.keys(updates));
}

// ========================================
// Course Helper Functions
// ========================================

/**
 * Update a specific course in the current semester
 */
export async function updateCourse(
  moodleId: string,
  updates: Partial<CourseWithMeta>
): Promise<void> {
  const semester = await getCurrentSemester();
  if (!semester) {
    console.warn('[SemesterHub Storage] No semester - cannot update course');
    return;
  }

  const courseIndex = semester.courses.findIndex((c) => c.moodleId === moodleId);
  if (courseIndex === -1) {
    console.warn('[SemesterHub Storage] Course not found:', moodleId);
    return;
  }

  const updatedCourses = [...semester.courses];
  updatedCourses[courseIndex] = {
    ...updatedCourses[courseIndex],
    ...updates,
  };

  await updateSemester({ courses: updatedCourses });
  console.log('[SemesterHub Storage] Course updated:', moodleId);
}

/**
 * Get a specific course by moodleId
 */
export async function getCourse(moodleId: string): Promise<CourseWithMeta | null> {
  const semester = await getCurrentSemester();
  if (!semester) return null;

  return semester.courses.find((c) => c.moodleId === moodleId) || null;
}

// ========================================
// Assignment Helper Functions
// ========================================

/**
 * Update a specific assignment in the current semester
 */
export async function updateAssignment(
  moodleId: string,
  updates: Partial<AssignmentProgress>
): Promise<void> {
  const semester = await getCurrentSemester();
  if (!semester) {
    console.warn('[SemesterHub Storage] No semester - cannot update assignment');
    return;
  }

  const assignmentIndex = semester.assignments.findIndex((a) => a.moodleId === moodleId);
  if (assignmentIndex === -1) {
    console.warn('[SemesterHub Storage] Assignment not found:', moodleId);
    return;
  }

  const updatedAssignments = [...semester.assignments];
  updatedAssignments[assignmentIndex] = {
    ...updatedAssignments[assignmentIndex],
    ...updates,
  };

  await updateSemester({ assignments: updatedAssignments });
  console.log('[SemesterHub Storage] Assignment updated:', moodleId);
}

/**
 * Get a specific assignment by moodleId
 */
export async function getAssignment(moodleId: string): Promise<AssignmentProgress | null> {
  const semester = await getCurrentSemester();
  if (!semester) return null;

  return semester.assignments.find((a) => a.moodleId === moodleId) || null;
}

/**
 * Get all assignments for a specific course
 */
export async function getAssignmentsForCourse(
  courseMoodleId: string
): Promise<AssignmentProgress[]> {
  const semester = await getCurrentSemester();
  if (!semester) return [];

  return semester.assignments.filter((a) => a.courseMoodleId === courseMoodleId);
}

// ========================================
// Clear Functions
// ========================================

/**
 * Clear all stored data
 */
export async function clearAllData(): Promise<void> {
  try {
    await chrome.storage.local.remove(STORAGE_KEY);
    console.log('[SemesterHub Storage] All data cleared');
  } catch (error) {
    console.error('[SemesterHub Storage] Error clearing data:', error);
    throw error;
  }
}

/**
 * Clear only semester data (keep user and settings)
 */
export async function clearSemesterData(): Promise<void> {
  await setData({
    currentSemester: null,
    lastSyncedAt: null,
  });
  console.log('[SemesterHub Storage] Semester data cleared');
}

// ========================================
// Change Listeners
// ========================================

type DataChangeCallback = (data: LocalStorageData) => void;
const listeners: Set<DataChangeCallback> = new Set();

/**
 * Subscribe to data changes
 * @returns Unsubscribe function
 */
export function onDataChange(callback: DataChangeCallback): () => void {
  listeners.add(callback);

  // Return unsubscribe function
  return () => {
    listeners.delete(callback);
  };
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  if (!changes[STORAGE_KEY]) return;

  const newData = changes[STORAGE_KEY].newValue as LocalStorageData;
  if (!newData) return;

  console.debug('[SemesterHub Storage] Data changed, notifying listeners');
  listeners.forEach((callback) => {
    try {
      callback(newData);
    } catch (error) {
      console.error('[SemesterHub Storage] Listener error:', error);
    }
  });
});

// ========================================
// Debug/Development Helpers
// ========================================

/**
 * Export all data (for debugging)
 */
export async function exportData(): Promise<string> {
  const data = await getData();
  return JSON.stringify(data, null, 2);
}

/**
 * Import data (for debugging/migration)
 */
export async function importData(jsonString: string): Promise<void> {
  try {
    const data = JSON.parse(jsonString) as LocalStorageData;
    await chrome.storage.local.set({ [STORAGE_KEY]: data });
    console.log('[SemesterHub Storage] Data imported');
  } catch (error) {
    console.error('[SemesterHub Storage] Import error:', error);
    throw error;
  }
}
