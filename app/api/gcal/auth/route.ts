import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";

const SCOPES = "https://www.googleapis.com/auth/calendar.events";

export async function GET(req: NextRequest) {
  const user = await getOrdoUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "Google Calendar not configured" }, { status: 503 });

  const redirectUri = `${process.env.APP_BASE_URL}/api/gcal/callback`;
  const returnTo = new URL(req.url).searchParams.get("returnTo") ?? "/today";

  const state = Buffer.from(JSON.stringify({ userId: user.id, returnTo })).toString("base64url");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
