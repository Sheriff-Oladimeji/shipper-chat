import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
);

const publicPaths = [
  "/login",
  "/api/auth/login",
  "/api/auth/callback",
  "/api/auth/signup",
  "/api/auth/signin",
  "/api/auth/refresh",
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for access token
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    // Redirect to login for page requests
    if (!pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // Return 401 for API requests
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  // Verify token
  try {
    await jwtVerify(accessToken, JWT_SECRET);
    return NextResponse.next();
  } catch {
    // Token invalid or expired
    if (!pathname.startsWith("/api")) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }
    return NextResponse.json(
      { success: false, error: "Invalid token" },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
