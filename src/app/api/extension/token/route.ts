import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { requireAuth } from "@/lib/auth-utils";

/**
 * CORS headers for extension requests
 */
function getCorsHeaders(request: NextRequest): HeadersInit {
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
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

/**
 * OPTIONS /api/extension/token
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request),
  });
}

/**
 * GET /api/extension/token
 * Generate a JWT token for the browser extension
 *
 * Requires authenticated session (user must be logged in to SemesterHub)
 * Returns a JWT token valid for 30 days that the extension can use for API calls
 */
export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);
  try {
    // 1. Verify user is authenticated via session
    const session = await requireAuth();

    // 2. Get JWT secret from environment
    const jwtSecret = process.env.EXTENSION_JWT_SECRET || process.env.AUTH_SECRET;
    if (!jwtSecret) {
      console.error("JWT secret not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500, headers: corsHeaders }
      );
    }

    // 3. Create secret key for signing
    const secret = new TextEncoder().encode(jwtSecret);

    // 4. Calculate expiration (30 days from now)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // 5. Generate JWT token
    const token = await new SignJWT({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .setSubject(session.user.id)
      .setIssuer("semesterhub")
      .setAudience("extension")
      .sign(secret);

    // 6. Return token and expiration
    return NextResponse.json(
      {
        token,
        expiresAt: expiresAt.toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Authentication required. Please log in to SemesterHub first." },
        { status: 401, headers: corsHeaders }
      );
    }

    // Log unexpected errors
    console.error("Error generating extension token:", error);

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
