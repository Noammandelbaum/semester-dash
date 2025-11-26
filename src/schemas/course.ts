import { z } from "zod";

/**
 * Course color options (aligned with design system)
 */
export const COURSE_COLORS = [
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "indigo",
  "purple",
  "pink",
] as const;

/**
 * Schema for creating a new course
 */
export const CreateCourseSchema = z.object({
  name: z
    .string()
    .min(1, "Course name is required")
    .max(200, "Course name must be 200 characters or less")
    .trim(),
  courseCode: z.string().trim().optional().nullable(),
  credits: z
    .number()
    .min(0, "Credits cannot be negative")
    .max(20, "Credits must be 20 or less")
    .multipleOf(0.5, "Credits must be in increments of 0.5 (e.g., 2.5, 3.0)")
    .optional(),
  color: z
    .enum(COURSE_COLORS, {
      message: "Invalid color selected",
    })
    .default("indigo")
    .optional(),
});

/**
 * Schema for updating an existing course (all fields optional)
 */
export const UpdateCourseSchema = CreateCourseSchema.partial();

/**
 * Schema for validating course ID parameter
 */
export const CourseIdSchema = z.object({
  id: z.string().cuid("Invalid course ID format"),
});

/**
 * Type exports for TypeScript
 */
export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;
export type CourseIdInput = z.infer<typeof CourseIdSchema>;
