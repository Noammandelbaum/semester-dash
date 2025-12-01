import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { CreateSemesterSchema, ListSemestersQuerySchema } from "@/schemas/semester";
import { apiWriteLimiter, apiReadLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";

/**
 * POST /api/semesters
 * Create a new semester for the authenticated user
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
    const validatedData = CreateSemesterSchema.parse(body);

    // 4. Validate dates
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "תאריך הסיום חייב להיות אחרי תאריך ההתחלה" },
        { status: 400 }
      );
    }

    // 5. Check if this is the first semester (should be active by default)
    const existingSemesters = await prisma.semester.count({
      where: { userId: session.user.id },
    });

    const isFirst = existingSemesters === 0;

    // 6. Create semester in database
    const semester = await prisma.semester.create({
      data: {
        name: validatedData.name,
        type: validatedData.type,
        year: validatedData.year,
        startDate,
        endDate,
        isActive: isFirst, // First semester is automatically active
        userId: session.user.id,
      },
    });

    // 7. Return created semester
    return NextResponse.json(semester, { status: 201 });
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

      if (error.message === "Rate limit exceeded") {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        );
      }
    }

    // Log unexpected errors
    console.error("Error creating semester:", error);

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/semesters
 * List all semesters for the authenticated user
 */
export async function GET(req: Request) {
  try {
    // 1. Authentication check
    const session = await requireAuth();

    // 2. Rate limiting (100 req/min for reads)
    const rateLimitId = getRateLimitIdentifier(req, session.user.id);
    await apiReadLimiter.check(100, rateLimitId);

    // 3. Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = ListSemestersQuerySchema.parse({
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
      includeArchived: searchParams.get("includeArchived"),
    });

    // 4. Fetch user's semesters
    const semesters = await prisma.semester.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [
        { isActive: "desc" }, // Active semester first
        { year: "desc" },
        { type: "asc" },
      ],
      take: query.limit,
      skip: query.offset,
      include: {
        _count: {
          select: { courses: true },
        },
      },
    });

    // 5. Get total count for pagination
    const totalCount = await prisma.semester.count({
      where: {
        userId: session.user.id,
      },
    });

    // 6. Return semesters with pagination metadata
    return NextResponse.json({
      semesters,
      pagination: {
        total: totalCount,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < totalCount,
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
    console.error("Error fetching semesters:", error);

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
