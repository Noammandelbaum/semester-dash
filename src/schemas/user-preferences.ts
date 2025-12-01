import { z } from "zod";

/**
 * Theme options for display preferences
 */
export const THEMES = ["system", "light", "dark"] as const;

/**
 * Schema for updating user preferences
 */
export const UpdatePreferencesSchema = z.object({
  // Notifications
  emailNotifications: z.boolean().optional(),
  inAppNotifications: z.boolean().optional(),
  reminderDaysBefore: z
    .array(z.number().int().min(0).max(30))
    .max(5)
    .optional(),
  quietHoursStart: z.number().int().min(0).max(23).nullable().optional(),
  quietHoursEnd: z.number().int().min(0).max(23).nullable().optional(),

  // Display
  theme: z.enum(THEMES).optional(),

  // Onboarding
  onboardingComplete: z.boolean().optional(),
});

/**
 * Schema for updating user profile
 */
export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .trim(),
});

/**
 * Schema for delete account confirmation
 */
export const DeleteAccountSchema = z.object({
  confirmation: z.literal("DELETE", {
    message: "Type DELETE to confirm",
  }),
});

/**
 * Type exports for TypeScript
 */
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;
