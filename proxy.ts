import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname === "/login" || pathname === "/suspended") {
    return NextResponse.next();
  }

  // Run auth0 proxy (handles /auth/* routes + token refresh)
  const authResponse = await auth0.middleware(request);

  // If auth0 issued a redirect (e.g. to /auth/login), honour it
  if (authResponse.status !== 200) return authResponse;

  // Redirect unauthenticated users to login
  const session = await auth0.getSession(request as any);
  if (!session && !pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return authResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
