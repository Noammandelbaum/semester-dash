import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { apiReadLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";
import {
  calculateSemesterProgress,
  getCourseStatus,
  type CourseStatus,
} from "@/lib/dashboard-utils";

/**
 * Dashboard Stats Response Types
 */
export interface SemesterStats {
  id: string;
  name: string;
  currentWeek: number;
  totalWeeks: number;
  progressPercent: number;
  startDate: string;
  endDate: string;
}

export interface CourseWithStats {
  id: string;
  name: string;
  courseCode: string | null;
  color: string;
  assignmentStats: {
    total: number;
    completed: number;
    percent: number;
  };
  status: CourseStatus;
  nextDeadline: string | null;
}

export interface AssignmentWithCourse {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: string;
  priority: string;
  course: {
    id: string;
    name: string;
    color: string;
  };
}

export interface DashboardStats {
  semester: SemesterStats | null;
  courses: {
    total: number;
    list: CourseWithStats[];
  };
  assignments: {
    total: number;
    completed: number;
    thisWeek: number;
    upcoming: AssignmentWithCourse[];
  };
}

/**
 * GET /api/dashboard/stats
 * Get aggregated dashboard statistics for the authenticated user
 */
export async function GET(req: Request) {
  try {
    // 1. Authentication check
    const session = await requireAuth();
    const userId = session.user.id;

    // 2. Rate limiting (100 req/min for reads)
    const rateLimitId = getRateLimitIdentifier(req, userId);
    await apiReadLimiter.check(100, rateLimitId);

    // 3. Get active semester (if any)
    const activeSemester = await prisma.semester.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    // 4. Calculate semester progress
    let semesterStats: SemesterStats | null = null;
    if (activeSemester) {
      const progress = calculateSemesterProgress(
        activeSemester.startDate,
        activeSemester.endDate
      );
      semesterStats = {
        id: activeSemester.id,
        name: activeSemester.name,
        currentWeek: progress.currentWeek,
        totalWeeks: progress.totalWeeks,
        progressPercent: progress.progressPercent,
        startDate: activeSemester.startDate.toISOString(),
        endDate: activeSemester.endDate.toISOString(),
      };
    }

    // 5. Get all courses with assignment counts
    // No active semester = no courses to show (every course must have a semester)
    if (!activeSemester) {
      return NextResponse.json({
        semester: null,
        courses: { total: 0, list: [] },
        assignments: { total: 0, completed: 0, thisWeek: 0, upcoming: [] },
      });
    }

    const courses = await prisma.course.findMany({
      where: {
        userId,
        semesterId: activeSemester.id,
      },
      include: {
        assignments: {
          select: {
            id: true,
            status: true,
            dueDate: true,
            moodleSubmissionStatus: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6, // Max 6 courses on dashboard per UX research
    });

    // 6. Calculate course stats
    const now = new Date();
    const coursesWithStats: CourseWithStats[] = courses.map((course) => {
      const total = course.assignments.length;
      const completed = course.assignments.filter(
        (a) => a.status === "COMPLETED" || a.moodleSubmissionStatus === "submitted"
      ).length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Find next upcoming deadline
      const upcomingAssignments = course.assignments
        .filter((a) => a.status !== "COMPLETED" && new Date(a.dueDate) >= now)
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );

      const nextDeadline =
        upcomingAssignments.length > 0
          ? upcomingAssignments[0].dueDate.toISOString()
          : null;

      return {
        id: course.id,
        name: course.name,
        courseCode: course.courseCode,
        color: course.color || "indigo",
        assignmentStats: {
          total,
          completed,
          percent,
        },
        status: getCourseStatus(completed, total),
        nextDeadline,
      };
    });

    // 7. Get all assignments for statistics (only from active semester courses)
    const allAssignments = await prisma.assignment.findMany({
      where: {
        userId,
        course: { semesterId: activeSemester.id },
      },
      select: {
        id: true,
        status: true,
        dueDate: true,
        moodleSubmissionStatus: true,
      },
    });

    // Calculate assignment stats
    const totalAssignments = allAssignments.length;
    const completedAssignments = allAssignments.filter(
      (a) => a.status === "COMPLETED" || a.moodleSubmissionStatus === "submitted"
    ).length;

    // This week's deadlines
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const thisWeekDeadlines = allAssignments.filter((a) => {
      const dueDate = new Date(a.dueDate);
      return (
        a.status !== "COMPLETED" && dueDate >= now && dueDate <= endOfWeek
      );
    }).length;

    // 8. Get upcoming assignments (next 7 days) with course info
    const upcomingAssignments = await prisma.assignment.findMany({
      where: {
        userId,
        status: { not: "COMPLETED" },
        dueDate: {
          gte: now,
          lte: endOfWeek,
        },
        course: { semesterId: activeSemester.id },
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
      orderBy: {
        dueDate: "asc",
      },
      take: 5, // Max 5 upcoming deadlines per UX research
    });

    const upcomingWithCourse: AssignmentWithCourse[] = upcomingAssignments.map(
      (assignment) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate.toISOString(),
        status: assignment.status,
        priority: assignment.priority,
        course: {
          id: assignment.course.id,
          name: assignment.course.name,
          color: assignment.course.color || "indigo",
        },
      })
    );

    // 9. Build response
    const dashboardStats: DashboardStats = {
      semester: semesterStats,
      courses: {
        total: courses.length,
        list: coursesWithStats,
      },
      assignments: {
        total: totalAssignments,
        completed: completedAssignments,
        thisWeek: thisWeekDeadlines,
        upcoming: upcomingWithCourse,
      },
    };

    return NextResponse.json(dashboardStats);
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
    console.error("Error fetching dashboard stats:", error);

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
