/**
 * Status Mapper for SemesterHub Extension
 *
 * Maps Moodle submission status strings to our AssignmentStatus type.
 * Handles Hebrew, English, and various status formats.
 */

import type { AssignmentStatus } from '../../shared/types';

/**
 * Hebrew status strings from Moodle
 */
const HEBREW_SUBMITTED_PATTERNS = [
  'הוגש',
  'הוגשה',
  'נשלח',
  'נשלחה',
];

const HEBREW_DRAFT_PATTERNS = [
  'טיוטה',
  'טיוטא',
];

const HEBREW_NOT_SUBMITTED_PATTERNS = [
  'לא הוגש',
  'לא הוגשה',
  'לא נשלח',
  'לא נשלחה',
  'טרם הוגש',
];

/**
 * English status strings from Moodle
 */
const ENGLISH_SUBMITTED_PATTERNS = [
  'submitted',
  'graded',
  'marked',
];

const ENGLISH_DRAFT_PATTERNS = [
  'draft',
  'saved',
];

const ENGLISH_NOT_SUBMITTED_PATTERNS = [
  'not submitted',
  'no submission',
  'no attempt',
];

/**
 * Map Moodle status string to our AssignmentStatus type
 *
 * @param moodleStatus - Raw status string from Moodle (Hebrew or English)
 * @param dueDate - Optional due date ISO string for overdue detection
 * @returns AssignmentStatus
 */
export function mapMoodleStatus(
  moodleStatus: string | null | undefined,
  dueDate?: string | null
): AssignmentStatus {
  // Handle empty/null status
  if (!moodleStatus || moodleStatus === '-') {
    return checkIfOverdue(dueDate) ? 'overdue' : 'pending';
  }

  const statusLower = moodleStatus.toLowerCase().trim();

  // Check for submitted status (must check before "not submitted" patterns)
  if (isSubmitted(statusLower)) {
    return 'submitted';
  }

  // Check for not submitted (explicit)
  if (isNotSubmitted(statusLower)) {
    return checkIfOverdue(dueDate) ? 'overdue' : 'pending';
  }

  // Check for draft status
  if (isDraft(statusLower)) {
    return checkIfOverdue(dueDate) ? 'overdue' : 'pending';
  }

  // Default: check if overdue based on date
  return checkIfOverdue(dueDate) ? 'overdue' : 'pending';
}

/**
 * Check if status indicates submitted
 */
function isSubmitted(status: string): boolean {
  // Hebrew patterns - check "submitted" but NOT "not submitted"
  for (const pattern of HEBREW_SUBMITTED_PATTERNS) {
    if (status.includes(pattern)) {
      // Make sure it's not "לא הוגש"
      for (const notPattern of HEBREW_NOT_SUBMITTED_PATTERNS) {
        if (status.includes(notPattern)) {
          return false;
        }
      }
      return true;
    }
  }

  // English patterns
  for (const pattern of ENGLISH_SUBMITTED_PATTERNS) {
    if (status.includes(pattern)) {
      // Make sure it's not "not submitted"
      for (const notPattern of ENGLISH_NOT_SUBMITTED_PATTERNS) {
        if (status.includes(notPattern)) {
          return false;
        }
      }
      return true;
    }
  }

  return false;
}

/**
 * Check if status indicates not submitted
 */
function isNotSubmitted(status: string): boolean {
  for (const pattern of HEBREW_NOT_SUBMITTED_PATTERNS) {
    if (status.includes(pattern)) {
      return true;
    }
  }

  for (const pattern of ENGLISH_NOT_SUBMITTED_PATTERNS) {
    if (status.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if status indicates draft
 */
function isDraft(status: string): boolean {
  for (const pattern of HEBREW_DRAFT_PATTERNS) {
    if (status.includes(pattern)) {
      return true;
    }
  }

  for (const pattern of ENGLISH_DRAFT_PATTERNS) {
    if (status.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if due date has passed
 */
function checkIfOverdue(dueDate?: string | null): boolean {
  if (!dueDate) {
    return false;
  }

  try {
    const due = new Date(dueDate);
    return due < new Date();
  } catch {
    return false;
  }
}

/**
 * Map raw Moodle status to normalized string
 * Useful for storing in database
 */
export function normalizeStatusString(moodleStatus: string | null | undefined): string | null {
  if (!moodleStatus || moodleStatus === '-') {
    return null;
  }

  const statusLower = moodleStatus.toLowerCase().trim();

  if (isSubmitted(statusLower)) {
    return 'submitted';
  }

  if (isNotSubmitted(statusLower)) {
    return 'not_submitted';
  }

  if (isDraft(statusLower)) {
    return 'draft';
  }

  // Return null for unknown status
  return null;
}

export default {
  mapMoodleStatus,
  normalizeStatusString,
};
