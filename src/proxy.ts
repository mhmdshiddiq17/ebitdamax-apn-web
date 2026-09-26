import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/constants";

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

const JWT_ISSUER = "ebitda-max-apn";
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-jwt-secret-change-me";
const CLOCK_SKEW_SECONDS = 60;

type SessionState = "none" | "valid" | "expired" | "invalid";

/**
 * Proxy (pengganti middleware di Next 16): penjaga route berbasis access token JWT.
 * Signature & exp diverifikasi di Edge (Web Crypto); access yang kedaluwarsa masih
 * diloloskan selama refresh cookie ada karena Go API akan memperbaruinya otomatis.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const hasRefresh = request.cookies.has(REFRESH_COOKIE);

  const sessionState: SessionState = accessToken ? await verifyAccessToken(accessToken) : "none";
  const hasSession = sessionState === "valid" || (sessionState === "expired" && hasRefresh);

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = AUTH_PAGES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);

    const response = NextResponse.redirect(url);
    if (sessionState === "invalid" || sessionState === "expired") {
      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
    }
    return response;
  }

  if (isAuthPage && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/** Verifikasi signature HS256 + issuer + exp access token. */
async function verifyAccessToken(token: string): Promise<SessionState> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return "invalid";
  }

  const [headerPart, payloadPart, signaturePart] = parts;

  try {
    const header = JSON.parse(decodeBase64UrlToString(headerPart)) as { alg?: string };
    if (header.alg !== "HS256") {
      return "invalid";
    }

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const signatureValid = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64UrlToBytes(signaturePart),
      new TextEncoder().encode(`${headerPart}.${payloadPart}`),
    );
    if (!signatureValid) {
      return "invalid";
    }

    const payload = JSON.parse(decodeBase64UrlToString(payloadPart)) as { iss?: string; exp?: number };
    if (payload.iss !== JWT_ISSUER) {
      return "invalid";
    }

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp + CLOCK_SKEW_SECONDS < now) {
      return "expired";
    }

    return "valid";
  } catch {
    return "invalid";
  }
}

function decodeBase64UrlToString(value: string): string {
  return new TextDecoder().decode(decodeBase64UrlToBytes(value));
}

function decodeBase64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
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
