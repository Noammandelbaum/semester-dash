import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireResourceOwnership } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { UpdateSemesterSchema } from "@/schemas/semester";
import { apiWriteLimiter, apiReadLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/semesters/[id]
 * Get a single semester by ID
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 1. Authentication check
    const session = await requireAuth();

    // 2. Rate limiting
    const rateLimitId = getRateLimitIdentifier(req, session.user.id);
    await apiReadLimiter.check(100, rateLimitId);

    // 3. Fetch semester
    const semester = await prisma.semester.findUnique({
      where: { id },
      include: {
        courses: {
          include: {
            _count: {
              select: { assignments: true },
            },
          },
          orderBy: { name: "asc" },
        },
        _count: {
          select: { courses: true },
        },
      },
    });

    if (!semester) {
      return NextResponse.json(
        { error: "הסמסטר לא נמצא" },
        { status: 404 }
      );
    }

    // 4. Verify ownership
    await requireResourceOwnership(semester.userId);

    // 5. Return semester
    return NextResponse.json(semester);
  } catch (error) {
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

    console.error("Error fetching semester:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/semesters/[id]
 * Update a semester
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 1. Authentication check
    const session = await requireAuth();

    // 2. Rate limiting
    const rateLimitId = getRateLimitIdentifier(req, session.user.id);
    await apiWriteLimiter.check(20, rateLimitId);

    // 3. Verify semester exists and belongs to user
    const existingSemester = await prisma.semester.findUnique({
      where: { id },
    });

    if (!existingSemester) {
      return NextResponse.json(
        { error: "הסמסטר לא נמצא" },
        { status: 404 }
      );
    }

    await requireResourceOwnership(existingSemester.userId);

    // 4. Parse and validate request body
    const body = await req.json();
    const validatedData = UpdateSemesterSchema.parse(body);

    // 5. Prepare update data
    const updateData: Record<string, unknown> = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.year !== undefined) updateData.year = validatedData.year;
    if (validatedData.startDate !== undefined) updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate !== undefined) updateData.endDate = new Date(validatedData.endDate);

    // 6. Validate dates if both are provided
    const newStartDate = updateData.startDate as Date | undefined ?? existingSemester.startDate;
    const newEndDate = updateData.endDate as Date | undefined ?? existingSemester.endDate;

    if (newEndDate <= newStartDate) {
      return NextResponse.json(
        { error: "תאריך הסיום חייב להיות אחרי תאריך ההתחלה" },
        { status: 400 }
      );
    }

    // 7. Update semester
    const updatedSemester = await prisma.semester.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedSemester);
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

    console.error("Error updating semester:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/semesters/[id]
 * Delete a semester and all associated courses
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 1. Authentication check
    const session = await requireAuth();

    // 2. Rate limiting
    const rateLimitId = getRateLimitIdentifier(req, session.user.id);
    await apiWriteLimiter.check(20, rateLimitId);

    // 3. Verify semester exists and belongs to user
    const existingSemester = await prisma.semester.findUnique({
      where: { id },
      include: {
        _count: {
          select: { courses: true },
        },
      },
    });

    if (!existingSemester) {
      return NextResponse.json(
        { error: "הסמסטר לא נמצא" },
        { status: 404 }
      );
    }

    await requireResourceOwnership(existingSemester.userId);

    // 4. If this is the active semester, make another one active
    if (existingSemester.isActive) {
      const anotherSemester = await prisma.semester.findFirst({
        where: {
          userId: session.user.id,
          id: { not: id },
        },
        orderBy: [
          { year: "desc" },
          { type: "asc" },
        ],
      });

      if (anotherSemester) {
        await prisma.semester.update({
          where: { id: anotherSemester.id },
          data: { isActive: true },
        });
      }
    }

    // 5. Delete semester (courses will be disconnected via cascade)
    await prisma.semester.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "הסמסטר נמחק בהצלחה",
      deletedCoursesCount: existingSemester._count.courses,
    });
  } catch (error) {
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

    console.error("Error deleting semester:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
