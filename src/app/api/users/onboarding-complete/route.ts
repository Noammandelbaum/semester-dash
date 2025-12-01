import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { markOnboardingComplete } from "@/lib/onboarding-utils";
import { apiWriteLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";

/**
 * POST /api/users/onboarding-complete
 * Mark the current user's onboarding as complete
 */
export async function POST(req: Request) {
  try {
    // 1. Authentication check
    const session = await requireAuth();

    // 2. Rate limiting (20 req/min for writes)
    const rateLimitId = getRateLimitIdentifier(req, session.user.id);
    await apiWriteLimiter.check(20, rateLimitId);

    // 3. Mark onboarding as complete
    await markOnboardingComplete(session.user.id);

    // 4. Return success
    return NextResponse.json({ success: true });
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      if (error.message === "Rate limit exceeded") {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        );
      }
    }

    // Log unexpected errors
    console.error("Error marking onboarding complete:", error);

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
