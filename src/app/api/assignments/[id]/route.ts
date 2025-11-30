import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { UpdateAssignmentSchema, AssignmentIdSchema } from "@/schemas/assignment";
import { apiWriteLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";

/**
 * PATCH /api/assignments/[id]
 * Update an existing assignment (partial update)
 */
export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Await params and validate assignment ID format
    const params = await props.params;
    const { id } = AssignmentIdSchema.parse({ id: params.id });

    // 2. Authentication check
    const session = await requireAuth();

    // 3. Rate limiting (20 req/min for writes)
    const rateLimitId = getRateLimitIdentifier(req, session.user.id);
    await apiWriteLimiter.check(20, rateLimitId);

    // 4. Parse and validate request body
    const body = await req.json();
    const validatedData = UpdateAssignmentSchema.parse(body);

    // 5. Verify assignment exists and check ownership
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
      select: { id: true, userId: true, courseId: true, completedAt: true },
    });

    if (!existingAssignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (existingAssignment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to update this assignment" },
        { status: 403 }
      );
    }

    // 6. If changing courseId, verify new course ownership
    if (validatedData.courseId && validatedData.courseId !== existingAssignment.courseId) {
      const newCourse = await prisma.course.findUnique({
        where: { id: validatedData.courseId },
        select: { userId: true },
      });

      if (!newCourse || newCourse.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Target course not found or access denied" },
          { status: 403 }
        );
      }
    }

    // 7. Auto-set completedAt when marking as completed
    const updateData: Record<string, unknown> = { ...validatedData };

    if (validatedData.status === "COMPLETED" && !existingAssignment.completedAt) {
      updateData.completedAt = new Date();
    } else if (validatedData.status && validatedData.status !== "COMPLETED") {
      updateData.completedAt = null;
    }

    // 8. Update assignment in database
    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            color: true,
            courseCode: true,
          },
        },
      },
    });

    // 9. Return updated assignment
    return NextResponse.json(updatedAssignment);
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

    // Log unexpected errors
    console.error("Error updating assignment:", error);

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/assignments/[id]
 * Delete an assignment (only if owned by the user)
 */
export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Await params and validate assignment ID format
    const params = await props.params;
    const { id } = AssignmentIdSchema.parse({ id: params.id });

    // 2. Authentication check
    const session = await requireAuth();

    // 3. Rate limiting (20 req/min for writes)
    const rateLimitId = getRateLimitIdentifier(req, session.user.id);
    await apiWriteLimiter.check(20, rateLimitId);

    // 4. Verify assignment exists and check ownership
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existingAssignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (existingAssignment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to delete this assignment" },
        { status: 403 }
      );
    }

    // 5. Delete assignment from database
    await prisma.assignment.delete({
      where: { id },
    });

    // 6. Return success response
    return NextResponse.json({ success: true, message: "Assignment deleted successfully" });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid assignment ID format",
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

    // Log unexpected errors
    console.error("Error deleting assignment:", error);

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/assignments/[id]
 * Get a single assignment by ID
 */
export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Await params and validate assignment ID format
    const params = await props.params;
    const { id } = AssignmentIdSchema.parse({ id: params.id });

    // 2. Authentication check
    const session = await requireAuth();

    // 3. Fetch assignment with course information
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            color: true,
            courseCode: true,
          },
        },
      },
    });

    // 4. Check if assignment exists
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // 5. Verify ownership
    if (assignment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to view this assignment" },
        { status: 403 }
      );
    }

    // 6. Return assignment (remove userId from response)
    const { userId, ...assignmentData } = assignment;

    return NextResponse.json(assignmentData);
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid assignment ID format",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Handle authentication errors
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
    }

    // Log unexpected errors
    console.error("Error fetching assignment:", error);

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
