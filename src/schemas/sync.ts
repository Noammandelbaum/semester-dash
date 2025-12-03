import { z } from "zod";

/**
 * Moodle assignment types
 */
export const MOODLE_ASSIGNMENT_TYPES = [
  "assignment",
  "quiz",
  "forum",
  "other",
] as const;

/**
 * Known Israeli institution IDs (for reference)
 * The system accepts any universityId - these are just the ones with Hebrew names
 */
export const KNOWN_INSTITUTIONS = [
  // Universities
  "tau",      // Tel Aviv University
  "huji",     // Hebrew University
  "technion", // Technion
  "bgu",      // Ben-Gurion University
  "biu",      // Bar-Ilan University
  "haifa",    // University of Haifa
  "openu",    // Open University
  "ariel",    // Ariel University
  // Colleges
  "jct",      // Jerusalem College of Technology (Machon Lev)
  "lev",      // Machon Lev (alias)
  "bezalel",  // Bezalel Academy
  "shenkar",  // Shenkar College
  "idc",      // Reichman University
  "runi",     // Reichman University (alias)
  "mta",      // Tel Aviv-Yafo College
  "afeka",    // Afeka College
  "hit",      // Holon Institute of Technology
  "sce",      // SCE College
  "braude",   // Braude College
  "sapir",    // Sapir College
  "ruppin",   // Ruppin College
] as const;

/**
 * Schema for a course from Moodle
 */
export const MoodleCourseSchema = z.object({
  moodleId: z.string().min(1, "Moodle course ID is required"),
  name: z.string().min(1, "Course name is required").max(200),
  courseCode: z.string().max(50).optional().nullable(),
  url: z.string().url("Invalid course URL"),
});

/**
 * Schema for an assignment from Moodle
 */
export const MoodleAssignmentSchema = z.object({
  moodleId: z.string().min(1, "Moodle assignment ID is required"),
  courseMoodleId: z.string().min(1, "Course Moodle ID is required"),
  title: z.string().min(1, "Assignment title is required").max(200),
  description: z.string().optional().nullable(),
  dueDate: z
    .string()
    .datetime("Invalid date format")
    .transform((str) => new Date(str))
    .optional()
    .nullable(),
  url: z.string().url("Invalid assignment URL"),
  type: z.enum(MOODLE_ASSIGNMENT_TYPES).default("other"),
});

/**
 * Schema for the full sync payload from the extension
 * Accepts any universityId - extracted from the Moodle URL
 */
export const MoodleSyncPayloadSchema = z.object({
  universityId: z.string().min(1, "University ID is required").max(50),
  moodleUrl: z.string().url("Invalid Moodle URL"),
  courses: z.array(MoodleCourseSchema).default([]),
  assignments: z.array(MoodleAssignmentSchema).default([]),
});

/**
 * Schema for sync response
 */
export const SyncResponseSchema = z.object({
  success: z.boolean(),
  courses: z.object({
    created: z.number(),
    updated: z.number(),
    unchanged: z.number(),
  }),
  assignments: z.object({
    created: z.number(),
    updated: z.number(),
    unchanged: z.number(),
  }),
  syncedAt: z.string().datetime(),
});

/**
 * Type exports
 */
export type MoodleCourse = z.infer<typeof MoodleCourseSchema>;
export type MoodleAssignment = z.infer<typeof MoodleAssignmentSchema>;
export type MoodleSyncPayload = z.infer<typeof MoodleSyncPayloadSchema>;
export type SyncResponse = z.infer<typeof SyncResponseSchema>;
