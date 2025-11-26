import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { UpdateCourseSchema, CourseIdSchema } from "@/schemas/course";
import { apiReadLimiter, apiWriteLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";

/**
 * GET /api/courses/[id]
 * Get a single course by ID
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentication check
    const session = await requireAuth();

    // 2. Rate limiting
    const rateLimitId = getRateLimitIdentifier(req, session.user.id);
    await apiReadLimiter.check(100, rateLimitId);

    // 3. Await and validate course ID
    const { id } = CourseIdSchema.parse(await params);

    // 4. Fetch course with ownership check
    const course = await prisma.course.findUnique({
      where: { id },
    });

    // 5. Check if course exists
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // 6. Verify ownership
    if (course.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 7. Return course
    return NextResponse.json(course);
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid course ID",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Handle authentication errors
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Log unexpected errors
    console.error("Error fetching course:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/courses/[id]
 * Update a course
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentication check
    const session = await requireAuth();

    // 2. Rate limiting
    const rateLimitId = getRateLimitIdentifier(req, session.user.id);
    await apiWriteLimiter.check(20, rateLimitId);

    // 3. Await and validate course ID
    const { id } = CourseIdSchema.parse(await params);

    // 3. Check course exists and user owns it
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (existingCourse.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 4. Parse and validate update data
    const body = await req.json();
    const validatedData = UpdateCourseSchema.parse(body);

    // 5. Update course
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: validatedData,
    });

    // 6. Return updated course
    return NextResponse.json(updatedCourse);
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

    // Handle authentication errors
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Log unexpected errors
    console.error("Error updating course:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/courses/[id]
 * Delete a course (cascade deletes all related tasks)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentication check
    const session = await requireAuth();

    // 2. Rate limiting
    const rateLimitId = getRateLimitIdentifier(req, session.user.id);
    await apiWriteLimiter.check(20, rateLimitId);

    // 3. Await and validate course ID
    const { id } = CourseIdSchema.parse(await params);

    // 3. Check course exists and user owns it
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (existingCourse.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 4. Delete course (cascade will delete related tasks)
    await prisma.course.delete({
      where: { id },
    });

    // 5. Return success response
    return NextResponse.json(
      { message: "Course deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid course ID",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Handle authentication errors
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Log unexpected errors
    console.error("Error deleting course:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
