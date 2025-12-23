/**
 * Zod schemas for Moodle Embedded Architecture API
 * These schemas match the extension types in extension/src/shared/types.ts
 */

import { z } from "zod";

// ========================================
// User Sync Schemas
// ========================================

/**
 * Request to sync user to server
 */
export const SyncUserRequestSchema = z.object({
  moodleUserId: z.string().min(1, "Moodle user ID is required"),
  universityDomain: z.string().min(1, "University domain is required"),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
});

/**
 * Response from user sync
 */
export const SyncUserResponseSchema = z.object({
  success: z.boolean(),
  userId: z.string(),
  isNewUser: z.boolean(),
});

// ========================================
// Course Sync Schemas
// ========================================

/**
 * Course with metadata (matches extension CourseWithMeta)
 */
export const CourseWithMetaSchema = z.object({
  moodleId: z.string().min(1, "Moodle ID is required"),
  name: z.string().min(1, "Course name is required"),
  url: z.string().url().optional(),
  credits: z.number().positive().optional(),
  totalAssignments: z.number().int().nonnegative().optional(),
  requiredAssignments: z.number().int().nonnegative().optional(),
  assignmentWeight: z.number().min(0).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  sections: z.array(z.string()),
});

/**
 * Request to sync courses
 */
export const SyncCoursesRequestSchema = z.object({
  moodleUserId: z.string().min(1),
  universityDomain: z.string().min(1),
  semesterId: z.string().min(1),
  semesterName: z.string().min(1),
  courses: z.array(CourseWithMetaSchema),
});

/**
 * Response from courses sync
 */
export const SyncCoursesResponseSchema = z.object({
  success: z.boolean(),
  syncedCount: z.number(),
  semesterId: z.string(),
});

// ========================================
// Progress Sync Schemas
// ========================================

/**
 * Assignment status types
 */
export const AssignmentStatusSchema = z.enum([
  "submitted",
  "pending",
  "overdue",
  "not_required",
]);

/**
 * Assignment with progress (matches extension AssignmentProgress)
 */
export const AssignmentProgressSchema = z.object({
  moodleId: z.string().min(1),
  courseMoodleId: z.string().min(1),
  name: z.string().min(1),
  sectionName: z.string(),
  orderInCourse: z.number().int().positive(),
  status: AssignmentStatusSchema,
  dueDate: z.string().datetime().optional(),
  submittedAt: z.string().datetime().optional(),
});

/**
 * Request to sync progress
 */
export const SyncProgressRequestSchema = z.object({
  moodleUserId: z.string().min(1),
  universityDomain: z.string().min(1),
  semesterId: z.string().min(1),
  assignments: z.array(AssignmentProgressSchema),
});

/**
 * Response from progress sync
 */
export const SyncProgressResponseSchema = z.object({
  success: z.boolean(),
  syncedCount: z.number(),
  updatedCount: z.number(),
});

// ========================================
// Analytics Schemas
// ========================================

/**
 * Analytics event types
 */
export const AnalyticsEventNameSchema = z.enum([
  "extension_installed",
  "tab_clicked",
  "onboarding_started",
  "onboarding_completed",
  "sync_started",
  "sync_completed",
  "sync_failed",
  "course_metadata_updated",
  "settings_changed",
  "error",
]);

/**
 * Analytics event request
 */
export const AnalyticsEventRequestSchema = z.object({
  event: z.string().min(1),
  moodleUserId: z.string().optional(),
  universityDomain: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().datetime(),
  extensionVersion: z.string(),
});

/**
 * Analytics response
 */
export const AnalyticsResponseSchema = z.object({
  success: z.boolean(),
});

// ========================================
// Type Exports
// ========================================

export type SyncUserRequest = z.infer<typeof SyncUserRequestSchema>;
export type SyncUserResponse = z.infer<typeof SyncUserResponseSchema>;
export type CourseWithMeta = z.infer<typeof CourseWithMetaSchema>;
export type SyncCoursesRequest = z.infer<typeof SyncCoursesRequestSchema>;
export type SyncCoursesResponse = z.infer<typeof SyncCoursesResponseSchema>;
export type AssignmentStatus = z.infer<typeof AssignmentStatusSchema>;
export type AssignmentProgress = z.infer<typeof AssignmentProgressSchema>;
export type SyncProgressRequest = z.infer<typeof SyncProgressRequestSchema>;
export type SyncProgressResponse = z.infer<typeof SyncProgressResponseSchema>;
export type AnalyticsEventName = z.infer<typeof AnalyticsEventNameSchema>;
export type AnalyticsEventRequest = z.infer<typeof AnalyticsEventRequestSchema>;
export type AnalyticsResponse = z.infer<typeof AnalyticsResponseSchema>;
