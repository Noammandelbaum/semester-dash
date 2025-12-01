import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { DeleteAccountSchema } from "@/schemas/user-preferences";
import { apiWriteLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";

/**
 * DELETE /api/users/delete
 * Delete user account with all related data (cascade)
 */
export async function DELETE(req: Request) {
  try {
    // 1. Authentication check
    const session = await requireAuth();

    // 2. Rate limiting (strict - 5 req/min for delete)
    const rateLimitId = getRateLimitIdentifier(req, session.user.id);
    await apiWriteLimiter.check(5, rateLimitId);

    // 3. Parse and validate request body (require confirmation)
    const body = await req.json();
    const validatedData = DeleteAccountSchema.parse(body);

    // 4. Extra safety check - confirmation must be exactly "DELETE"
    if (validatedData.confirmation !== "DELETE") {
      return NextResponse.json(
        { error: "Type DELETE to confirm account deletion" },
        { status: 400 }
      );
    }

    // 5. Delete user (cascade deletes all related data)
    // Order of cascade:
    // - UserPreferences (1:1)
    // - Sessions (1:n)
    // - Accounts (1:n)
    // - Courses (1:n) -> Assignments (cascade from Course)
    // - Semesters (1:n)
    // - Assignments (1:n direct relation)
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json(
      { message: "Account deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

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

    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
