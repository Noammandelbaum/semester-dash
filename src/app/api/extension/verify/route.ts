import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

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
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

/**
 * OPTIONS /api/extension/verify
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request),
  });
}

/**
 * HEAD /api/extension/verify
 * Health check for API reachability
 */
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request),
  });
}

/**
 * GET /api/extension/verify
 * Verify an extension JWT token and return user info
 *
 * Expects: Authorization: Bearer <token>
 * Returns: { valid: boolean, user?: { id, name, email } }
 */
export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { valid: false, error: "Missing or invalid Authorization header" },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // 2. Get JWT secret from environment
    const jwtSecret = process.env.EXTENSION_JWT_SECRET || process.env.AUTH_SECRET;
    if (!jwtSecret) {
      console.error("JWT secret not configured");
      return NextResponse.json(
        { valid: false, error: "Server configuration error" },
        { status: 500, headers: corsHeaders }
      );
    }

    // 3. Verify JWT token
    const secret = new TextEncoder().encode(jwtSecret);
    let payload;
    try {
      const result = await jwtVerify(token, secret, {
        issuer: "semesterhub",
        audience: "extension",
      });
      payload = result.payload;
    } catch (jwtError) {
      // Token is invalid or expired
      const errorMessage = jwtError instanceof Error ? jwtError.message : "Invalid token";
      return NextResponse.json(
        { valid: false, error: errorMessage },
        { status: 401, headers: corsHeaders }
      );
    }

    // 4. Extract user ID from payload
    const userId = payload.sub || (payload as { userId?: string }).userId;
    if (!userId) {
      return NextResponse.json(
        { valid: false, error: "Invalid token: missing user ID" },
        { status: 401, headers: corsHeaders }
      );
    }

    // 5. Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { valid: false, error: "User not found" },
        { status: 401, headers: corsHeaders }
      );
    }

    // 6. Return valid response with user info
    return NextResponse.json(
      {
        valid: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    // Log unexpected errors
    console.error("Error verifying extension token:", error);

    // Generic error response
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
