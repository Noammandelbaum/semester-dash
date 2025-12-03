import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { CreateCourseSchema } from "@/schemas/course";
import { apiWriteLimiter, apiReadLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";

/**
 * POST /api/courses
 * Create a new course for the authenticated user
 */
export async function POST(req: Request) {
  try {
    // 1. Authentication check
    const session = await requireAuth();

    // 2. Rate limiting (20 req/min for writes)
    const rateLimitId = getRateLimitIdentifier(req, session.user.id);
    await apiWriteLimiter.check(20, rateLimitId);

    // 3. Parse and validate request body
    const body = await req.json();
    const validatedData = CreateCourseSchema.parse(body);

    // 4. Create course in database
    const course = await prisma.course.create({
      data: {
        name: validatedData.name,
        courseCode: validatedData.courseCode,
        credits: validatedData.credits,
        color: validatedData.color || "indigo",
        semesterId: validatedData.semesterId,
        userId: session.user.id,
      },
    });

    // 5. Return created course
    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Handle authentication/authorization errors
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      if (error.message === "Forbidden") {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      if (error.message === "Rate limit exceeded") {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        );
      }
    }

    // Log unexpected errors (will integrate Sentry later)
    console.error("Error creating course:", error);

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/courses
 * List all courses for the authenticated user
 */
export async function GET(req: Request) {
  try {
    // 1. Authentication check
    const session = await requireAuth();

    // 2. Rate limiting (100 req/min for reads)
    const rateLimitId = getRateLimitIdentifier(req, session.user.id);
    await apiReadLimiter.check(100, rateLimitId);

    // 3. Parse query parameters for pagination
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Max 100
    const offset = parseInt(searchParams.get("offset") || "0");

    // 4. Fetch user's courses
    const courses = await prisma.course.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    // 5. Get total count for pagination
    const totalCount = await prisma.course.count({
      where: {
        userId: session.user.id,
      },
    });

    // 6. Return courses with pagination metadata
    return NextResponse.json({
      courses,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
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
    console.error("Error fetching courses:", error);

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
