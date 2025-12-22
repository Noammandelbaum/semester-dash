import { NextResponse } from "next/server";
import { z } from "zod";
import { AnalyticsEventRequestSchema } from "@/schemas/sync-embedded";
import { apiAnalyticsLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";

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
 * OPTIONS /api/analytics
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request),
  });
}

/**
 * POST /api/analytics
 * Track analytics events from extension
 *
 * MVP: Just logs events to console
 * Future: Store in database for analysis
 */
export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  try {
    // Rate limiting (100 req/min per IP)
    const rateLimitId = getRateLimitIdentifier(request);
    await apiAnalyticsLimiter.check(100, rateLimitId);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = AnalyticsEventRequestSchema.parse(body);

    // Log the event (MVP approach)
    // In production, store in database or send to analytics service
    console.log("[Analytics]", {
      event: validatedData.event,
      moodleUserId: validatedData.moodleUserId,
      universityDomain: validatedData.universityDomain,
      extensionVersion: validatedData.extensionVersion,
      timestamp: validatedData.timestamp,
      data: validatedData.data,
    });

    return NextResponse.json(
      { success: true },
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

    console.error("Error tracking analytics:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
