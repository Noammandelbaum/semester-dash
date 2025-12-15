import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jwtVerify } from "jose";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MoodleSyncPayloadSchema } from "@/schemas/sync";
import { apiSyncLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";
import type { MoodleCourse, MoodleAssignment } from "@/schemas/sync";
import {
  suggestCurrentSemester,
  getSemesterStartDate,
  getSemesterEndDate,
} from "@/lib/semester-utils";

/**
 * CORS headers for extension requests
 */
function getCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin") || "";

  // Allow requests from Chrome/Firefox extensions and localhost for development
  const allowedOrigins = [
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    /^http:\/\/localhost/,
    /^https:\/\/semester-dash\.vercel\.app/,
  ];

  const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

/**
 * OPTIONS /api/sync/moodle
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request),
  });
}

/**
 * Authenticate request via Bearer token (extension) or session (web app)
 * @returns userId if authenticated
 * @throws Error if not authenticated
 */
async function authenticateRequest(req: Request): Promise<string> {
  // First, try Bearer token authentication (for extension)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const jwtSecret = process.env.EXTENSION_JWT_SECRET || process.env.AUTH_SECRET;

    if (!jwtSecret) {
      throw new Error("Server configuration error");
    }

    try {
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token, secret, {
        issuer: "semesterhub",
        audience: "extension",
      });

      const userId = payload.sub || (payload as { userId?: string }).userId;
      if (!userId) {
        throw new Error("Invalid token: missing user ID");
      }

      return userId;
    } catch (jwtError) {
      // Invalid token
      const message = jwtError instanceof Error ? jwtError.message : "Invalid token";
      throw new Error(`Token error: ${message}`);
    }
  }

  // Fallback to session authentication (for web app)
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return session.user.id;
}

/**
 * POST /api/sync/moodle
 * Sync courses and assignments from Moodle extension
 *
 * Supports two authentication methods:
 * 1. Bearer token (for browser extension) - Authorization: Bearer <token>
 * 2. Session cookie (for web app fallback)
 */
export async function POST(req: Request) {
  const corsHeaders = getCorsHeaders(req);
  try {
    // 1. Authentication check (supports both Bearer token and session)
    const userId = await authenticateRequest(req);

    // 2. Rate limiting (10 req/min for sync operations)
    const rateLimitId = getRateLimitIdentifier(req, userId);
    await apiSyncLimiter.check(10, rateLimitId);

    // 3. Parse and validate request body
    const body = await req.json();
    const validatedData = MoodleSyncPayloadSchema.parse(body);

    // 4. Initialize counters
    const courseCounts = { created: 0, updated: 0, unchanged: 0 };
    const assignmentCounts = { created: 0, updated: 0, unchanged: 0 };

    // 5. Find or create current semester
    const semester = await findOrCreateCurrentSemester(userId);

    // 6. Build moodleId -> courseId map for assignment linking
    const moodleIdToCourseId = new Map<string, string>();

    // 7. Upsert courses (with semester association)
    for (const course of validatedData.courses) {
      const result = await upsertCourse(userId, course, semester.id);
      courseCounts[result.action]++;
      moodleIdToCourseId.set(course.moodleId, result.courseId);
    }

    // 8. Upsert assignments
    for (const assignment of validatedData.assignments) {
      // Find the course ID for this assignment
      let courseId = moodleIdToCourseId.get(assignment.courseMoodleId);

      // If course wasn't in this sync, try to find it by moodleId
      if (!courseId) {
        const existingCourse = await prisma.course.findFirst({
          where: {
            userId,
            moodleId: assignment.courseMoodleId,
          },
          select: { id: true },
        });
        courseId = existingCourse?.id;
      }

      // Skip assignment if course not found
      if (!courseId) {
        console.warn(
          `Skipping assignment "${assignment.title}": course with moodleId ${assignment.courseMoodleId} not found`
        );
        continue;
      }

      const result = await upsertAssignment(
        userId,
        courseId,
        assignment
      );
      assignmentCounts[result.action]++;
    }

    // 9. Return sync summary
    return NextResponse.json(
      {
        success: true,
        courses: courseCounts,
        assignments: assignmentCounts,
        syncedAt: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Handle authentication errors
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message.startsWith("Token error:")) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401, headers: corsHeaders }
        );
      }

      if (error.message === "Server configuration error") {
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500, headers: corsHeaders }
        );
      }

      if (error.message === "Rate limit exceeded") {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429, headers: corsHeaders }
        );
      }
    }

    // Log unexpected errors
    console.error("Error syncing Moodle data:", error);

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Find or create the current semester for a user
 * Based on current date using suggestCurrentSemester()
 */
async function findOrCreateCurrentSemester(userId: string) {
  const suggestion = suggestCurrentSemester();
  const { type, year, name } = suggestion.suggested;

  // Try to find existing semester
  let semester = await prisma.semester.findFirst({
    where: {
      userId,
      type,
      year,
    },
  });

  if (!semester) {
    // Create new semester
    semester = await prisma.semester.create({
      data: {
        userId,
        name,
        type,
        year,
        startDate: getSemesterStartDate(type, year),
        endDate: getSemesterEndDate(type, year),
        isActive: true,
      },
    });

    // Deactivate other semesters
    await prisma.semester.updateMany({
      where: {
        userId,
        id: { not: semester.id },
        isActive: true,
      },
      data: { isActive: false },
    });
  }

  return semester;
}

/**
 * Upsert a course from Moodle data
 * Uses atomic upsert to prevent race conditions
 */
async function upsertCourse(
  userId: string,
  course: MoodleCourse,
  semesterId: string
): Promise<{ action: "created" | "updated" | "unchanged"; courseId: string }> {
  // First check if course exists by courseCode (for migration from manual courses)
  if (course.courseCode) {
    const manualCourse = await prisma.course.findFirst({
      where: {
        userId,
        courseCode: course.courseCode,
        moodleId: null, // Only match if moodleId not set (manual course)
      },
    });

    if (manualCourse) {
      // Update manual course with Moodle data
      await prisma.course.update({
        where: { id: manualCourse.id },
        data: {
          name: course.name,
          moodleId: course.moodleId,
          moodleUrl: course.url,
          semesterId,
        },
      });
      return { action: "updated", courseId: manualCourse.id };
    }
  }

  // Use atomic upsert by unique constraint (userId, moodleId)
  // This prevents race conditions when multiple sync requests arrive simultaneously
  const existingCourse = await prisma.course.findUnique({
    where: {
      userId_moodleId: {
        userId,
        moodleId: course.moodleId,
      },
    },
  });

  const result = await prisma.course.upsert({
    where: {
      userId_moodleId: {
        userId,
        moodleId: course.moodleId,
      },
    },
    update: {
      name: course.name,
      moodleUrl: course.url,
      courseCode: course.courseCode,
      semesterId,
    },
    create: {
      userId,
      name: course.name,
      moodleId: course.moodleId,
      moodleUrl: course.url,
      courseCode: course.courseCode,
      semesterId,
    },
  });

  // Determine action based on whether course existed before
  if (!existingCourse) {
    return { action: "created", courseId: result.id };
  }

  // Check if anything actually changed
  const wasUnchanged =
    existingCourse.name === course.name &&
    existingCourse.moodleUrl === course.url &&
    existingCourse.semesterId === semesterId &&
    existingCourse.courseCode === course.courseCode;

  return {
    action: wasUnchanged ? "unchanged" : "updated",
    courseId: result.id,
  };
}

/**
 * Upsert an assignment from Moodle data
 * Uses atomic upsert to prevent race conditions
 */
async function upsertAssignment(
  userId: string,
  courseId: string,
  assignment: MoodleAssignment
): Promise<{ action: "created" | "updated" | "unchanged" }> {
  // Map Moodle assignment type to Prisma enum
  const typeMap: Record<string, "ASSIGNMENT" | "QUIZ" | "FORUM" | "OTHER"> = {
    assignment: "ASSIGNMENT",
    quiz: "QUIZ",
    forum: "FORUM",
    other: "OTHER",
  };
  const assignmentType = typeMap[assignment.type] || "OTHER";
  const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  // Check if assignment exists before upsert (to determine action)
  const existingAssignment = await prisma.assignment.findUnique({
    where: {
      moodleId_courseId: {
        moodleId: assignment.moodleId,
        courseId,
      },
    },
  });

  // Use atomic upsert by unique constraint (moodleId, courseId)
  const result = await prisma.assignment.upsert({
    where: {
      moodleId_courseId: {
        moodleId: assignment.moodleId,
        courseId,
      },
    },
    update: {
      title: assignment.title,
      description: assignment.description,
      moodleUrl: assignment.url,
      type: assignmentType,
      dueDate: assignment.dueDate || undefined, // Keep existing if no new date
    },
    create: {
      userId,
      courseId,
      title: assignment.title,
      description: assignment.description,
      moodleId: assignment.moodleId,
      moodleUrl: assignment.url,
      type: assignmentType,
      dueDate: assignment.dueDate || defaultDueDate,
      priority: "MEDIUM",
      status: "NOT_STARTED",
    },
  });

  // Determine action based on whether assignment existed before
  if (!existingAssignment) {
    return { action: "created" };
  }

  // Check if anything actually changed
  const wasUnchanged =
    existingAssignment.title === assignment.title &&
    existingAssignment.description === assignment.description &&
    existingAssignment.moodleUrl === assignment.url &&
    existingAssignment.type === assignmentType;

  return { action: wasUnchanged ? "unchanged" : "updated" };
}
