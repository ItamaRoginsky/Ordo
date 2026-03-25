import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { changeAuth0UserPassword } from "@/lib/auth0-management";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, true);
  if (limited) return limited;

  const caller = await getOrdoUser();
  if (!caller)         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!caller.isAdmin) return NextResponse.json({ error: "Forbidden" },    { status: 403 });

  const { userId, newPassword } = await req.json();

  if (!userId || !newPassword) {
    return NextResponse.json({ error: "userId and newPassword are required" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.auth0Id) return NextResponse.json({ error: "User has no Auth0 account" }, { status: 400 });

  try {
    await changeAuth0UserPassword(user.auth0Id, newPassword);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Auth0 error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await db.auditLog.create({
    data: {
      actorId:    caller.id,
      action:     "USER_PASSWORD_CHANGED",
      targetId:   user.id,
      targetType: "User",
      meta:       JSON.stringify({ email: user.email, changedBy: caller.email }),
    },
  });

  return NextResponse.json({ ok: true });
}
