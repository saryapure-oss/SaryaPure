import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 network boundary (formerly `middleware`).
 * - Ensures a first-party anonymous id cookie exists for privacy-friendly analytics.
 * - Adds baseline security headers to every response.
 */
const ANON_COOKIE = "sp_anon";

export function proxy(req: NextRequest) {
  const res = NextResponse.next();

  if (!req.cookies.get(ANON_COOKIE)) {
    res.cookies.set(ANON_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
