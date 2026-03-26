import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const rawState = searchParams.get("state");
  const error = searchParams.get("error");

  const base = process.env.APP_BASE_URL ?? "";

  if (error || !code || !rawState) {
    return NextResponse.redirect(`${base}/today?gcal=error`);
  }

  let userId: string;
  let returnTo = "/today";

  try {
    const parsed = JSON.parse(Buffer.from(rawState, "base64url").toString());
    userId = parsed.userId;
    returnTo = parsed.returnTo ?? "/today";
  } catch {
    return NextResponse.redirect(`${base}/today?gcal=error`);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${base}/api/gcal/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${base}/today?gcal=error`);
  }

  const tokens = await tokenRes.json();
  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000);

  await db.googleToken.upsert({
    where: { userId },
    create: {
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt,
      scope: tokens.scope ?? null,
    },
    update: {
      accessToken: tokens.access_token,
      ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
      expiresAt,
      scope: tokens.scope ?? null,
    },
  });

  return NextResponse.redirect(`${base}${returnTo}?gcal=connected`);
}
