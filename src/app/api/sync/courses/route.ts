import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { apiReadLimiter, apiSyncLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";
import { getMoodleUrlByInstitutionId } from "@/lib/institutions";
import { SyncCoursesRequestSchema } from "@/schemas/sync-embedded";
import {
  parseSemesterFromName,
  getSemesterStartDate,
  getSemesterEndDate,
} from "@/lib/semester-utils";

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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

/**
 * OPTIONS /api/sync/courses
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request),
  });
}

/**
 * GET /api/sync/courses
 * Get courses for sync - returns active semester courses with moodleId and moodleUrl
 */
export async function GET(req: Request) {
  try {
    // 1. Authentication check
    const session = await requireAuth();

    // 2. Rate limiting
    const rateLimitId = getRateLimitIdentifier(req, session.user.id);
    await apiReadLimiter.check(100, rateLimitId);

    // 3. Get user preferences to find institution
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
      select: { institutionId: true },
    });

    if (!preferences?.institutionId) {
      return NextResponse.json(
        { error: "לא נבחר מוסד לימודים. אנא עדכן בהגדרות." },
        { status: 400 }
      );
    }

    const moodleUrl = getMoodleUrlByInstitutionId(preferences.institutionId);
    if (!moodleUrl) {
      return NextResponse.json(
        { error: "לא נמצא כתובת Moodle למוסד שנבחר." },
        { status: 400 }
      );
    }

    // 4. Get active semester
    const activeSemester = await prisma.semester.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: { id: true },
    });

    if (!activeSemester) {
      return NextResponse.json(
        { error: "אין סמסטר פעיל. אנא צור סמסטר חדש." },
        { status: 400 }
      );
    }

    // 5. Get courses with moodleId from active semester
    const courses = await prisma.course.findMany({
      where: {
        userId: session.user.id,
        semesterId: activeSemester.id,
        moodleId: { not: null }, // Only courses synced from Moodle
      },
      select: {
        id: true,
        name: true,
        moodleId: true,
        moodleUrl: true,
      },
    });

    if (courses.length === 0) {
      return NextResponse.json(
        { error: "אין קורסים מסונכרנים בסמסטר הפעיל." },
        { status: 400 }
      );
    }

    // 6. Return courses and moodleUrl
    return NextResponse.json({
      courses: courses.map((c) => ({
        moodleId: c.moodleId!,
        name: c.name,
        url: c.moodleUrl || `${moodleUrl}/course/view.php?id=${c.moodleId}`,
      })),
      moodleUrl,
    });
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

    console.error("Error fetching sync courses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sync/courses
 * Sync courses from extension to server
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
    const validatedData = SyncCoursesRequestSchema.parse(body);

    const { moodleUserId, universityDomain, semesterId, semesterName, courses } = validatedData;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: {
        moodleUserId_universityDomain: {
          moodleUserId,
          universityDomain,
        },
      },
      select: { id: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          moodleUserId,
          universityDomain,
        },
        select: { id: true },
      });
    }

    // Parse semester info from name, or use suggestion as fallback
    const parsedSemester = parseSemesterFromName(semesterName);
    const semesterInfo = parsedSemester || {
      type: "A" as const,
      year: new Date().getFullYear(),
    };

    // Find or create semester
    let semester = await prisma.semester.findFirst({
      where: {
        userId: user.id,
        type: semesterInfo.type,
        year: semesterInfo.year,
      },
      select: { id: true },
    });

    if (!semester) {
      semester = await prisma.semester.create({
        data: {
          userId: user.id,
          name: semesterName,
          type: semesterInfo.type,
          year: semesterInfo.year,
          startDate: getSemesterStartDate(semesterInfo.type, semesterInfo.year),
          endDate: getSemesterEndDate(semesterInfo.type, semesterInfo.year),
          isActive: true,
        },
        select: { id: true },
      });

      // Deactivate other semesters
      await prisma.semester.updateMany({
        where: {
          userId: user.id,
          id: { not: semester.id },
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    // Upsert courses
    let syncedCount = 0;
    for (const course of courses) {
      await prisma.course.upsert({
        where: {
          userId_moodleId: {
            userId: user.id,
            moodleId: course.moodleId,
          },
        },
        update: {
          name: course.name,
          moodleUrl: course.url,
          credits: course.credits,
          color: course.color,
          totalAssignments: course.totalAssignments,
          requiredAssignments: course.requiredAssignments,
          assignmentWeight: course.assignmentWeight,
          semesterId: semester.id,
          lastSyncedAt: new Date(),
        },
        create: {
          userId: user.id,
          moodleId: course.moodleId,
          name: course.name,
          moodleUrl: course.url,
          credits: course.credits,
          color: course.color,
          totalAssignments: course.totalAssignments,
          requiredAssignments: course.requiredAssignments,
          assignmentWeight: course.assignmentWeight,
          semesterId: semester.id,
          lastSyncedAt: new Date(),
        },
      });
      syncedCount++;
    }

    return NextResponse.json(
      {
        success: true,
        syncedCount,
        semesterId: semester.id,
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

    console.error("Error syncing courses:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
