/**
 * Sync Service for SemesterHub Extension
 *
 * Handles all communication with the SemesterHub API for:
 * - User sync (moodle user identification)
 * - Course sync (course metadata)
 * - Progress sync (assignment status)
 * - Analytics events
 */

import type {
  MoodleUser,
  SemesterData,
  CourseWithMeta,
  AssignmentProgress,
  SyncUserResponse,
} from "../shared/types";

// API Base URL - always use production for extension
// Development testing should be done via localhost override if needed
const API_BASE = "https://semesterhub.club/api";

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  data: unknown
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Sync user to server
 * Creates or updates user based on Moodle ID + university domain
 *
 * @returns User ID and whether this is a new user
 */
export async function syncUser(
  user: MoodleUser
): Promise<{ userId: string; isNewUser: boolean }> {
  const response = await apiFetch<SyncUserResponse>("/sync/user", {
    moodleUserId: user.moodleUserId,
    universityDomain: user.universityDomain,
    displayName: user.displayName,
    email: user.email,
  });

  return {
    userId: response.userId,
    isNewUser: response.isNewUser,
  };
}

/**
 * Sync courses to server
 *
 * @param user - Moodle user info
 * @param semester - Semester data containing courses
 */
export async function syncCourses(
  user: MoodleUser,
  semester: SemesterData
): Promise<{ syncedCount: number; semesterId: string }> {
  const response = await apiFetch<{
    success: boolean;
    syncedCount: number;
    semesterId: string;
  }>("/sync/courses", {
    moodleUserId: user.moodleUserId,
    universityDomain: user.universityDomain,
    semesterId: semester.id,
    semesterName: semester.name,
    courses: semester.courses,
  });

  return {
    syncedCount: response.syncedCount,
    semesterId: response.semesterId,
  };
}

/**
 * Sync assignment progress to server
 *
 * @param user - Moodle user info
 * @param semester - Semester data containing assignments
 */
export async function syncProgress(
  user: MoodleUser,
  semester: SemesterData
): Promise<{ syncedCount: number; updatedCount: number }> {
  const response = await apiFetch<{
    success: boolean;
    syncedCount: number;
    updatedCount: number;
  }>("/sync/progress", {
    moodleUserId: user.moodleUserId,
    universityDomain: user.universityDomain,
    semesterId: semester.id,
    assignments: semester.assignments,
  });

  return {
    syncedCount: response.syncedCount,
    updatedCount: response.updatedCount,
  };
}

/**
 * Track analytics event
 *
 * @param event - Event name
 * @param user - Optional user info for user-level analytics
 * @param data - Optional additional event data
 */
export async function trackEvent(
  event: string,
  user?: MoodleUser,
  data?: Record<string, unknown>
): Promise<void> {
  const extensionVersion = chrome.runtime.getManifest().version;

  try {
    await apiFetch<{ success: boolean }>("/analytics", {
      event,
      moodleUserId: user?.moodleUserId,
      universityDomain: user?.universityDomain,
      data,
      timestamp: new Date().toISOString(),
      extensionVersion,
    });
  } catch (error) {
    // Silently fail analytics - don't break user experience
    console.warn("[SyncService] Analytics error:", error);
  }
}

/**
 * Full sync - syncs user, courses, and progress
 * Call this periodically or after user actions
 *
 * @param user - Moodle user info
 * @param semester - Current semester data
 * @returns Sync results
 */
export async function fullSync(
  user: MoodleUser,
  semester: SemesterData
): Promise<{
  success: boolean;
  userId?: string;
  isNewUser?: boolean;
  coursesCount?: number;
  assignmentsCount?: number;
  error?: string;
}> {
  try {
    // Track sync start
    await trackEvent("sync_started", user);

    // 1. Sync user
    const userResult = await syncUser(user);

    // 2. Sync courses
    const coursesResult = await syncCourses(user, semester);

    // 3. Sync progress
    const progressResult = await syncProgress(user, semester);

    // Track sync complete
    await trackEvent("sync_completed", user, {
      coursesCount: coursesResult.syncedCount,
      assignmentsCount: progressResult.syncedCount,
      updatedCount: progressResult.updatedCount,
    });

    return {
      success: true,
      userId: userResult.userId,
      isNewUser: userResult.isNewUser,
      coursesCount: coursesResult.syncedCount,
      assignmentsCount: progressResult.syncedCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Track sync failure
    await trackEvent("sync_failed", user, { error: errorMessage });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Quick sync - only sync progress (faster, for frequent updates)
 */
export async function quickSync(
  user: MoodleUser,
  semester: SemesterData
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  try {
    const result = await syncProgress(user, semester);

    return {
      success: true,
      updatedCount: result.updatedCount,
    };
  } catch (error) {
    return {
      success: false,
      updatedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Export types for convenience
export type { MoodleUser, SemesterData, CourseWithMeta, AssignmentProgress };
