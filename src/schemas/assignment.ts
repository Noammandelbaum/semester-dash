import { z } from "zod";

/**
 * Assignment status options (aligned with Prisma schema)
 */
export const ASSIGNMENT_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
] as const;

/**
 * Assignment priority options (aligned with Prisma schema)
 */
export const ASSIGNMENT_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

/**
 * Schema for creating a new assignment
 */
export const CreateAssignmentSchema = z.object({
  title: z
    .string()
    .min(1, "Assignment title is required")
    .max(200, "Assignment title must be 200 characters or less")
    .trim(),
  description: z.string().trim().optional().nullable(),
  courseId: z.string().cuid("Invalid course ID format"),
  dueDate: z
    .string()
    .datetime("Invalid date format")
    .transform((str) => new Date(str)),
  weight: z
    .number()
    .min(0, "Weight cannot be negative")
    .max(100, "Weight cannot exceed 100%")
    .optional()
    .nullable(),
  priority: z
    .enum(ASSIGNMENT_PRIORITIES, {
      message: "Invalid priority selected",
    })
    .default("MEDIUM")
    .optional(),
  status: z
    .enum(ASSIGNMENT_STATUSES, {
      message: "Invalid status selected",
    })
    .default("NOT_STARTED")
    .optional(),
});

/**
 * Schema for updating an existing assignment (all fields optional)
 */
export const UpdateAssignmentSchema = CreateAssignmentSchema.partial().extend({
  completedAt: z
    .string()
    .datetime("Invalid date format")
    .transform((str) => new Date(str))
    .optional()
    .nullable(),
});

/**
 * Schema for validating assignment ID parameter
 */
export const AssignmentIdSchema = z.object({
  id: z.string().cuid("Invalid assignment ID format"),
});

/**
 * Schema for querying assignments (filters)
 */
export const AssignmentQuerySchema = z.object({
  courseId: z.string().cuid("Invalid course ID format").optional(),
  status: z.enum(ASSIGNMENT_STATUSES).optional(),
  priority: z.enum(ASSIGNMENT_PRIORITIES).optional(),
  limit: z
    .string()
    .regex(/^\d+$/, "Limit must be a number")
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .optional(),
  offset: z
    .string()
    .regex(/^\d+$/, "Offset must be a number")
    .transform(Number)
    .pipe(z.number().int().min(0))
    .optional(),
});

/**
 * Type exports for TypeScript
 */
export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof UpdateAssignmentSchema>;
export type AssignmentIdInput = z.infer<typeof AssignmentIdSchema>;
export type AssignmentQueryInput = z.infer<typeof AssignmentQuerySchema>;
