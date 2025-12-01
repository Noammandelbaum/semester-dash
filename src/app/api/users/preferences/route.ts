import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { UpdatePreferencesSchema } from "@/schemas/user-preferences";
import { apiWriteLimiter, apiReadLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";

/**
 * GET /api/users/preferences
 * Get current user preferences (creates default if not exists)
 */
export async function GET(req: Request) {
  try {
    // 1. Authentication check
    const session = await requireAuth();

    // 2. Rate limiting
    const rateLimitId = getRateLimitIdentifier(req, session.user.id);
    await apiReadLimiter.check(100, rateLimitId);

    // 3. Get or create preferences
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
    });

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
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

    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/preferences
 * Update user preferences
 */
export async function PATCH(req: Request) {
  try {
    // 1. Authentication check
    const session = await requireAuth();

    // 2. Rate limiting
    const rateLimitId = getRateLimitIdentifier(req, session.user.id);
    await apiWriteLimiter.check(20, rateLimitId);

    // 3. Parse and validate request body
    const body = await req.json();
    const validatedData = UpdatePreferencesSchema.parse(body);

    // 4. Upsert preferences (create if not exists, update if exists)
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...validatedData,
      },
      update: validatedData,
    });

    return NextResponse.json(preferences);
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

    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
