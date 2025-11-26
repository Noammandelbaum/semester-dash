import { auth } from "@/lib/auth";

/**
 * Ensures the user is authenticated
 * @throws Error if user is not authenticated
 * @returns The session object with user information
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return session;
}

/**
 * Verifies that a resource belongs to the authenticated user
 * @param resourceUserId - The userId associated with the resource
 * @throws Error if the resource doesn't belong to the user
 * @returns The session object
 */
export async function requireResourceOwnership(resourceUserId: string) {
  const session = await requireAuth();

  if (resourceUserId !== session.user.id) {
    throw new Error("Forbidden");
  }

  return session;
}
