/**
 * Validation utilities for SemesterHub extension
 * Validates scraped data before sending to API
 */

import { createError, type ExtensionError } from '../errors';
import type {
  ScrapedCourse,
  ScrapedAssignment,
  SyncPayload,
  MoodleAssignmentType
} from '../types';

// ========================================
// Result Type
// ========================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ExtensionError };

// ========================================
// Validation Helpers
// ========================================

/**
 * Check if a string is non-empty
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a string is a valid ISO datetime
 */
function isValidDatetime(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Check if value is a valid Moodle assignment type
 */
function isValidAssignmentType(value: unknown): value is MoodleAssignmentType {
  return value === 'assignment' || value === 'quiz' || value === 'forum' || value === 'other';
}

// ========================================
// Course Validation
// ========================================

/**
 * Validate a single scraped course
 */
export function validateCourse(course: unknown): ValidationResult<ScrapedCourse> {
  if (!course || typeof course !== 'object') {
    return {
      success: false,
      error: createError('E3004', { reason: 'Course is not an object' })
    };
  }

  const c = course as Record<string, unknown>;

  // Required fields
  if (!isNonEmptyString(c.moodleId)) {
    return {
      success: false,
      error: createError('E3004', { reason: 'Course missing moodleId', course: c })
    };
  }

  if (!isNonEmptyString(c.name)) {
    return {
      success: false,
      error: createError('E3004', { reason: 'Course missing name', moodleId: c.moodleId })
    };
  }

  if (!isValidUrl(c.url)) {
    return {
      success: false,
      error: createError('E3004', { reason: 'Course has invalid URL', moodleId: c.moodleId })
    };
  }

  // Build validated course
  const validatedCourse: ScrapedCourse = {
    moodleId: c.moodleId as string,
    name: c.name as string,
    url: c.url as string,
    courseCode: typeof c.courseCode === 'string' ? c.courseCode : undefined,
  };

  return { success: true, data: validatedCourse };
}

/**
 * Validate an array of courses
 */
export function validateCourses(courses: unknown[]): ValidationResult<ScrapedCourse[]> {
  if (!Array.isArray(courses)) {
    return {
      success: false,
      error: createError('E3004', { reason: 'Courses is not an array' })
    };
  }

  const validatedCourses: ScrapedCourse[] = [];

  for (let i = 0; i < courses.length; i++) {
    const result = validateCourse(courses[i]);
    if (!result.success) {
      return {
        success: false,
        error: createError('E3004', {
          reason: `Invalid course at index ${i}`,
          details: (result as { success: false; error: ExtensionError }).error.context
        })
      };
    }
    validatedCourses.push((result as { success: true; data: ScrapedCourse }).data);
  }

  return { success: true, data: validatedCourses };
}

// ========================================
// Assignment Validation
// ========================================

/**
 * Validate a single scraped assignment
 */
export function validateAssignment(assignment: unknown): ValidationResult<ScrapedAssignment> {
  if (!assignment || typeof assignment !== 'object') {
    return {
      success: false,
      error: createError('E3004', { reason: 'Assignment is not an object' })
    };
  }

  const a = assignment as Record<string, unknown>;

  // Required fields
  if (!isNonEmptyString(a.moodleId)) {
    return {
      success: false,
      error: createError('E3004', { reason: 'Assignment missing moodleId' })
    };
  }

  if (!isNonEmptyString(a.courseMoodleId)) {
    return {
      success: false,
      error: createError('E3004', { reason: 'Assignment missing courseMoodleId', moodleId: a.moodleId })
    };
  }

  if (!isNonEmptyString(a.title)) {
    return {
      success: false,
      error: createError('E3004', { reason: 'Assignment missing title', moodleId: a.moodleId })
    };
  }

  if (!isValidUrl(a.url)) {
    return {
      success: false,
      error: createError('E3004', { reason: 'Assignment has invalid URL', moodleId: a.moodleId })
    };
  }

  // Validate type
  const type = isValidAssignmentType(a.type) ? a.type : 'other';

  // Validate dueDate if present
  let dueDate: string | null = null;
  if (a.dueDate !== undefined && a.dueDate !== null) {
    if (!isValidDatetime(a.dueDate)) {
      // Don't fail on invalid date, just set to null
      console.warn(`[Validation] Invalid dueDate for assignment ${a.moodleId}:`, a.dueDate);
    } else {
      dueDate = a.dueDate as string;
    }
  }

  // Build validated assignment
  const validatedAssignment: ScrapedAssignment = {
    moodleId: a.moodleId as string,
    courseMoodleId: a.courseMoodleId as string,
    title: a.title as string,
    url: a.url as string,
    type,
    description: typeof a.description === 'string' ? a.description : undefined,
    dueDate,
  };

  return { success: true, data: validatedAssignment };
}

/**
 * Validate an array of assignments
 */
export function validateAssignments(assignments: unknown[]): ValidationResult<ScrapedAssignment[]> {
  if (!Array.isArray(assignments)) {
    return {
      success: false,
      error: createError('E3004', { reason: 'Assignments is not an array' })
    };
  }

  const validatedAssignments: ScrapedAssignment[] = [];

  for (let i = 0; i < assignments.length; i++) {
    const result = validateAssignment(assignments[i]);
    if (!result.success) {
      // Log warning but don't fail entire batch for single invalid assignment
      console.warn(`[Validation] Skipping invalid assignment at index ${i}:`, (result as { success: false; error: ExtensionError }).error.context);
      continue;
    }
    validatedAssignments.push((result as { success: true; data: ScrapedAssignment }).data);
  }

  return { success: true, data: validatedAssignments };
}

// ========================================
// Sync Payload Validation
// ========================================

/**
 * Validate a complete sync payload before API call
 */
export function validateSyncPayload(payload: unknown): ValidationResult<SyncPayload> {
  if (!payload || typeof payload !== 'object') {
    return {
      success: false,
      error: createError('E3004', { reason: 'Payload is not an object' })
    };
  }

  const p = payload as Record<string, unknown>;

  // Validate universityId
  if (!isNonEmptyString(p.universityId)) {
    return {
      success: false,
      error: createError('E3004', { reason: 'Payload missing universityId' })
    };
  }

  // Validate moodleUrl
  if (!isValidUrl(p.moodleUrl)) {
    return {
      success: false,
      error: createError('E3004', { reason: 'Payload has invalid moodleUrl' })
    };
  }

  // Validate courses
  const coursesResult = validateCourses(p.courses as unknown[] || []);
  if (!coursesResult.success) {
    return coursesResult as ValidationResult<SyncPayload>;
  }

  // Validate assignments (more lenient - skip invalid ones)
  const assignmentsResult = validateAssignments(p.assignments as unknown[] || []);
  const validAssignments = assignmentsResult.success ? assignmentsResult.data : [];

  // Build validated payload
  const validatedPayload: SyncPayload = {
    universityId: p.universityId as string,
    moodleUrl: p.moodleUrl as string,
    courses: coursesResult.data,
    assignments: validAssignments,
  };

  return { success: true, data: validatedPayload };
}
