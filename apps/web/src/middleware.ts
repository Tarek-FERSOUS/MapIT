import { NextRequest, NextResponse } from "next/server";

const publicPaths = ["/login", "/api/auth/login"];
const protectedPaths = ["/dashboard", "/incidents", "/documents", "/assets", "/problems", "/relationships", "/settings"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    // Redirect to dashboard if already authenticated
    if (token && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Check protected paths
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)"
  ]
};
