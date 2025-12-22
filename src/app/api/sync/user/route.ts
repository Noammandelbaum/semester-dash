import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SyncUserRequestSchema } from "@/schemas/sync-embedded";
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
 * OPTIONS /api/sync/user
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request),
  });
}

/**
 * POST /api/sync/user
 * Create or update user by Moodle ID
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
    const validatedData = SyncUserRequestSchema.parse(body);

    const { moodleUserId, universityDomain, displayName, email } = validatedData;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: {
        moodleUserId_universityDomain: {
          moodleUserId,
          universityDomain,
        },
      },
      select: { id: true },
    });

    let userId: string;
    let isNewUser: boolean;

    if (existingUser) {
      // Update existing user
      const updated = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: displayName || undefined,
          email: email || undefined,
          updatedAt: new Date(),
        },
        select: { id: true },
      });
      userId = updated.id;
      isNewUser = false;
    } else {
      // Create new user
      const created = await prisma.user.create({
        data: {
          moodleUserId,
          universityDomain,
          name: displayName,
          email,
        },
        select: { id: true },
      });
      userId = created.id;
      isNewUser = true;
    }

    return NextResponse.json(
      {
        success: true,
        userId,
        isNewUser,
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

    // Log unexpected errors
    console.error("Error syncing user:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
