import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { CreateAssignmentSchema, AssignmentQuerySchema } from "@/schemas/assignment";
import {
  apiWriteLimiter,
  apiReadLimiter,
  getRateLimitIdentifier,
} from "@/lib/rate-limit";
import type { AssignmentStatus, AssignmentPriority, Prisma } from "@prisma/client";

/**
 * POST /api/assignments
 * Create a new assignment for the authenticated user
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
    const validatedData = CreateAssignmentSchema.parse(body);

    // 4. Verify that the course belongs to the user
    const course = await prisma.course.findUnique({
      where: { id: validatedData.courseId },
      select: { userId: true },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    if (course.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to add assignments to this course" },
        { status: 403 }
      );
    }

    // 5. Create assignment in database
    const assignment = await prisma.assignment.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        dueDate: validatedData.dueDate,
        weight: validatedData.weight,
        priority: validatedData.priority || "MEDIUM",
        status: validatedData.status || "NOT_STARTED",
        courseId: validatedData.courseId,
        userId: session.user.id,
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    // 6. Return created assignment
    return NextResponse.json(assignment, { status: 201 });
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
    console.error("Error creating assignment:", error);

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/assignments
 * List assignments for the authenticated user with optional filters
 * Query params: courseId, status, priority, limit, offset
 */
export async function GET(req: Request) {
  try {
    // 1. Authentication check
    const session = await requireAuth();

    // 2. Rate limiting (100 req/min for reads)
    const rateLimitId = getRateLimitIdentifier(req, session.user.id);
    await apiReadLimiter.check(100, rateLimitId);

    // 3. Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = AssignmentQuerySchema.parse(queryParams);

    // 4. Get active semester for filtering
    const activeSemester = await prisma.semester.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: { id: true },
    });

    // 5. Build where clause based on filters
    const where: Prisma.AssignmentWhereInput = {
      userId: session.user.id,
    };

    // No active semester = no assignments to show (every assignment must have a course in a semester)
    if (!activeSemester) {
      return NextResponse.json({
        assignments: [],
        pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
      });
    }

    // Filter by course (must be user's course)
    if (validatedQuery.courseId) {
      // Verify course ownership
      const course = await prisma.course.findUnique({
        where: { id: validatedQuery.courseId },
        select: { userId: true },
      });

      if (!course || course.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Course not found or access denied" },
          { status: 403 }
        );
      }

      where.courseId = validatedQuery.courseId;
    } else {
      // Show assignments from active semester courses only
      where.course = { semesterId: activeSemester.id };
    }

    // Additional filters
    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    }

    if (validatedQuery.priority) {
      where.priority = validatedQuery.priority;
    }

    // Date range filter for calendar view
    if (validatedQuery.startDate || validatedQuery.endDate) {
      where.dueDate = {};
      if (validatedQuery.startDate) {
        where.dueDate.gte = validatedQuery.startDate;
      }
      if (validatedQuery.endDate) {
        where.dueDate.lte = validatedQuery.endDate;
      }
    }

    // 5. Fetch assignments with filters and pagination
    const assignments = await prisma.assignment.findMany({
      where,
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
      orderBy: [
        { dueDate: "asc" }, // Upcoming assignments first
        { priority: "desc" }, // Higher priority first
        { createdAt: "desc" }, // Newest first if same due date
      ],
      take: validatedQuery.limit || 50,
      skip: validatedQuery.offset || 0,
    });

    // 6. Get total count for pagination
    const totalCount = await prisma.assignment.count({
      where,
    });

    // 7. Return assignments with pagination metadata
    return NextResponse.json({
      assignments,
      pagination: {
        total: totalCount,
        limit: validatedQuery.limit || 50,
        offset: validatedQuery.offset || 0,
        hasMore:
          (validatedQuery.offset || 0) + (validatedQuery.limit || 50) <
          totalCount,
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
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

      if (error.message === "Rate limit exceeded") {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        );
      }
    }

    // Log unexpected errors
    console.error("Error fetching assignments:", error);

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
