import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { apiReadLimiter, apiWriteLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";
import { getNotifications, getUnreadCount, markAllAsRead } from "@/lib/notifications";

/**
 * GET /api/notifications
 * List notifications for the authenticated user
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
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const includeRead = searchParams.get("includeRead") !== "false";

    // 4. Fetch notifications and unread count in parallel
    const [notifications, unreadCount] = await Promise.all([
      getNotifications(session.user.id, { limit, includeRead }),
      getUnreadCount(session.user.id),
    ]);

    // 5. Return notifications with metadata
    return NextResponse.json({
      notifications,
      unreadCount,
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

    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Mark all notifications as read
 */
export async function POST(req: Request) {
  try {
    // 1. Authentication check
    const session = await requireAuth();

    // 2. Rate limiting (20 req/min for writes)
    const rateLimitId = getRateLimitIdentifier(req, session.user.id);
    await apiWriteLimiter.check(20, rateLimitId);

    // 3. Parse action from body
    const body = await req.json();
    const { action } = body;

    if (action === "markAllRead") {
      const count = await markAllAsRead(session.user.id);
      return NextResponse.json({
        success: true,
        message: `${count} התראות סומנו כנקראו`,
        count,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
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

    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
