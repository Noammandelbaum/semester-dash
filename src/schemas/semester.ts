import { z } from "zod";

/**
 * Semester Zod Schemas
 * Validation schemas for semester CRUD operations
 */

// Enum matching Prisma SemesterType
export const SemesterTypeEnum = z.enum(["A", "B", "SUMMER"]);

// Create Semester Schema
export const CreateSemesterSchema = z.object({
  name: z
    .string()
    .min(1, "שם הסמסטר הוא שדה חובה")
    .max(100, "שם הסמסטר ארוך מדי"),
  type: SemesterTypeEnum,
  year: z
    .number()
    .int("השנה חייבת להיות מספר שלם")
    .min(2020, "השנה חייבת להיות 2020 ומעלה")
    .max(2030, "השנה חייבת להיות עד 2030"),
  startDate: z.string().datetime("תאריך התחלה לא תקין"),
  endDate: z.string().datetime("תאריך סיום לא תקין"),
});

// Update Semester Schema - all fields optional
export const UpdateSemesterSchema = CreateSemesterSchema.partial();

// Query params for listing semesters
export const ListSemestersQuerySchema = z.object({
  limit: z.preprocess(
    (val) => (val === null || val === "" ? undefined : val),
    z.coerce.number().int().min(1).max(50).default(20)
  ),
  offset: z.preprocess(
    (val) => (val === null || val === "" ? undefined : val),
    z.coerce.number().int().min(0).default(0)
  ),
  includeArchived: z.preprocess(
    (val) => (val === null || val === "" ? undefined : val),
    z.coerce.boolean().default(false)
  ),
});

// Types
export type CreateSemesterInput = z.infer<typeof CreateSemesterSchema>;
export type UpdateSemesterInput = z.infer<typeof UpdateSemesterSchema>;
export type SemesterType = z.infer<typeof SemesterTypeEnum>;
