import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SyncProgressRequestSchema } from "@/schemas/sync-embedded";
import { apiSyncLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";

/**
 * CORS headers for extension requests
 */
function getCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin") || "";

  const allowedOrigins = [
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    /^http:\/\/localhost/,
    /^https:\/\/semesterhub\.club/,
    /^https:\/\/semester-dash\.vercel\.app/,
    // Moodle domains (content script runs in page context)
    /^https:\/\/moodle\./,
    /^https:\/\/[^/]*\.moodle\./,
  ];

  const isAllowed = allowedOrigins.some((pattern) => pattern.test(origin));

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

/**
 * OPTIONS /api/sync/progress
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request),
  });
}

/**
 * Map extension status to Prisma AssignmentStatus enum
 */
function mapStatusToPrisma(
  status: "submitted" | "pending" | "overdue" | "not_required"
): "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" {
  switch (status) {
    case "submitted":
      return "COMPLETED";
    case "pending":
    case "not_required":
      return "NOT_STARTED";
    case "overdue":
      return "IN_PROGRESS"; // Overdue means started but not completed
  }
}

/**
 * Map extension status to moodleSubmissionStatus string
 */
function mapStatusToMoodleSubmission(
  status: "submitted" | "pending" | "overdue" | "not_required"
): string {
  switch (status) {
    case "submitted":
      return "submitted";
    case "pending":
      return "pending";
    case "overdue":
      return "overdue";
    case "not_required":
      return "not_required";
  }
}

/**
 * POST /api/sync/progress
 * Sync assignment progress from extension to server
 *
 * This endpoint is open (no auth required) - identifies user by moodleUserId + universityDomain
 */
export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  try {
    // Rate limiting (30 req/min per IP)
    const rateLimitId = getRateLimitIdentifier(request);
    await apiSyncLimiter.check(30, rateLimitId);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = SyncProgressRequestSchema.parse(body);

    const { moodleUserId, universityDomain, semesterId, assignments } = validatedData;

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        moodleUserId_universityDomain: {
          moodleUserId,
          universityDomain,
        },
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please sync user first." },
        { status: 404, headers: corsHeaders }
      );
    }

    // Build a map of courseMoodleId -> courseId
    const courses = await prisma.course.findMany({
      where: { userId: user.id },
      select: { id: true, moodleId: true },
    });

    const courseMap = new Map<string, string>();
    for (const course of courses) {
      if (course.moodleId) {
        courseMap.set(course.moodleId, course.id);
      }
    }

    // Upsert assignments
    let syncedCount = 0;
    let updatedCount = 0;

    for (const assignment of assignments) {
      const courseId = courseMap.get(assignment.courseMoodleId);

      if (!courseId) {
        console.warn(
          `Skipping assignment "${assignment.name}": course with moodleId ${assignment.courseMoodleId} not found`
        );
        continue;
      }

      // Check if assignment exists
      const existing = await prisma.assignment.findUnique({
        where: {
          moodleId_courseId: {
            moodleId: assignment.moodleId,
            courseId,
          },
        },
        select: {
          id: true,
          status: true,
          moodleSubmissionStatus: true,
        },
      });

      const prismaStatus = mapStatusToPrisma(assignment.status);
      const moodleSubmissionStatus = mapStatusToMoodleSubmission(assignment.status);

      if (existing) {
        // Check if status changed
        const statusChanged =
          existing.status !== prismaStatus ||
          existing.moodleSubmissionStatus !== moodleSubmissionStatus;

        await prisma.assignment.update({
          where: { id: existing.id },
          data: {
            title: assignment.name,
            sectionName: assignment.sectionName,
            orderInCourse: assignment.orderInCourse,
            status: prismaStatus,
            moodleSubmissionStatus,
            dueDate: assignment.dueDate ? new Date(assignment.dueDate) : undefined,
            completedAt: assignment.submittedAt ? new Date(assignment.submittedAt) : undefined,
            lastSyncedAt: new Date(),
          },
        });

        syncedCount++;
        if (statusChanged) {
          updatedCount++;
        }
      } else {
        // Create new assignment
        await prisma.assignment.create({
          data: {
            userId: user.id,
            courseId,
            moodleId: assignment.moodleId,
            title: assignment.name,
            sectionName: assignment.sectionName,
            orderInCourse: assignment.orderInCourse,
            status: prismaStatus,
            moodleSubmissionStatus,
            dueDate: assignment.dueDate
              ? new Date(assignment.dueDate)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            completedAt: assignment.submittedAt ? new Date(assignment.submittedAt) : undefined,
            priority: "MEDIUM",
            type: "ASSIGNMENT",
            lastSyncedAt: new Date(),
          },
        });

        syncedCount++;
        updatedCount++;
      }
    }

    return NextResponse.json(
      {
        success: true,
        syncedCount,
        updatedCount,
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

    // Handle rate limiting
    if (error instanceof Error && error.message === "Rate limit exceeded") {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: corsHeaders }
      );
    }

    console.error("Error syncing progress:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
