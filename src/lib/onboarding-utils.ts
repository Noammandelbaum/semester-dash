import { prisma } from "@/lib/prisma";

/**
 * Onboarding Utilities
 *
 * Functions to detect and manage user onboarding state.
 *
 * Onboarding is needed when:
 * 1. User has no semesters
 * OR
 * 2. User has onboardingComplete = false in preferences
 */

/**
 * Check if user should see onboarding flow
 * Returns true if user needs to complete onboarding
 */
export async function shouldShowOnboarding(userId: string): Promise<boolean> {
  // Check user preferences for onboarding completion status
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId },
    select: { onboardingComplete: true },
  });

  // If onboarding was marked complete, don't show again
  // (even if user later deletes all semesters)
  if (preferences?.onboardingComplete) {
    return false;
  }

  // New user (no preferences) - check if they have semesters
  const semesterCount = await prisma.semester.count({
    where: { userId },
  });

  // No semesters and onboarding not complete = needs onboarding
  return semesterCount === 0;
}

/**
 * Mark onboarding as complete for a user
 * Creates preferences record if it doesn't exist
 */
export async function markOnboardingComplete(userId: string): Promise<void> {
  await prisma.userPreferences.upsert({
    where: { userId },
    create: {
      userId,
      onboardingComplete: true,
    },
    update: {
      onboardingComplete: true,
    },
  });
}

/**
 * Get onboarding progress for a user
 * Returns which steps are completed
 */
export async function getOnboardingProgress(userId: string): Promise<{
  hasSemester: boolean;
  hasCourse: boolean;
  isComplete: boolean;
}> {
  const [semesterCount, courseCount, preferences] = await Promise.all([
    prisma.semester.count({ where: { userId } }),
    prisma.course.count({ where: { userId } }),
    prisma.userPreferences.findUnique({
      where: { userId },
      select: { onboardingComplete: true },
    }),
  ]);

  return {
    hasSemester: semesterCount > 0,
    hasCourse: courseCount > 0,
    isComplete: preferences?.onboardingComplete ?? false,
  };
}
