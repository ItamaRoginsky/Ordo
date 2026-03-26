import { db } from "@/lib/db";

/** Returns a valid access token, refreshing if needed. Returns null if not connected or refresh fails. */
export async function getGcalToken(userId: string): Promise<string | null> {
  const token = await db.googleToken.findUnique({ where: { userId } });
  if (!token) return null;

  // If token is still valid for > 5 min, return it directly
  if (token.expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
    return token.accessToken;
  }

  // Refresh
  if (!token.refreshToken) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: token.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const expiresAt = new Date(Date.now() + (data.expires_in ?? 3600) * 1000);

  await db.googleToken.update({
    where: { userId },
    data: { accessToken: data.access_token, expiresAt },
  });

  return data.access_token;
}
