import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname === "/login" || pathname === "/suspended" || pathname === "/maintenance") {
    return NextResponse.next();
  }

  // Run auth0 middleware (handles /auth/* routes + token refresh)
  const authResponse = await auth0.middleware(request);

  // If auth0 issued a redirect (e.g. to /auth/login), honour it
  if (authResponse.status !== 200) return authResponse;

  // Redirect unauthenticated users to login
  const session = await auth0.getSession(request as any);
  if (!session && !pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Maintenance mode check (skip for admins and API routes)
  if (session && !pathname.startsWith("/api") && !pathname.startsWith("/admin")) {
    try {
      const setting = await db.appSetting.findUnique({ where: { key: "maintenance_mode" } });
      if (setting?.value === "true") {
        const user = await db.user.findUnique({ where: { auth0Id: session.user.sub } });
        if (!user?.isAdmin) {
          return NextResponse.redirect(new URL("/maintenance", request.url));
        }
      }
    } catch {
      // DB not available — skip maintenance check
    }
  }

  return authResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
