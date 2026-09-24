import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/settings",
  "/tasks",
  "/monitoring",
  "/admin",
  "/notifications",
  "/meeting-minutes",
  "/roles",
  "/users",
  "/task-categories",
];

const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/two-factor-challenge"];

/**
 * Proxy (pengganti middleware di Next 16): penjaga route berbasis session cookie.
 * Nama cookie diambil dari Go API (package 5/Sprint 1 akan memastikan kesesuaian).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/tasks/:path*",
    "/monitoring/:path*",
    "/admin/:path*",
    "/notifications/:path*",
    "/meeting-minutes/:path*",
    "/roles/:path*",
    "/users/:path*",
    "/task-categories/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/two-factor-challenge",
  ],
};
