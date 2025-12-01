import { NextResponse } from "next/server";
import { requireAuth, requireResourceOwnership } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { apiWriteLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/semesters/[id]/activate
 * Set a semester as the active semester for the user
 * Only one semester can be active at a time
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 1. Authentication check
    const session = await requireAuth();

    // 2. Rate limiting
    const rateLimitId = getRateLimitIdentifier(req, session.user.id);
    await apiWriteLimiter.check(20, rateLimitId);

    // 3. Verify semester exists and belongs to user
    const semester = await prisma.semester.findUnique({
      where: { id },
    });

    if (!semester) {
      return NextResponse.json(
        { error: "הסמסטר לא נמצא" },
        { status: 404 }
      );
    }

    await requireResourceOwnership(semester.userId);

    // 4. If already active, return success
    if (semester.isActive) {
      return NextResponse.json(semester);
    }

    // 5. Deactivate all other semesters and activate this one
    await prisma.$transaction([
      // Deactivate all semesters for this user
      prisma.semester.updateMany({
        where: {
          userId: session.user.id,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      }),
      // Activate the selected semester
      prisma.semester.update({
        where: { id },
        data: {
          isActive: true,
        },
      }),
    ]);

    // 6. Fetch and return the updated semester
    const activatedSemester = await prisma.semester.findUnique({
      where: { id },
      include: {
        _count: {
          select: { courses: true },
        },
      },
    });

    return NextResponse.json(activatedSemester);
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

    console.error("Error activating semester:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
