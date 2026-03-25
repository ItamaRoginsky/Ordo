import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuth0User } from "@/lib/auth0-management";

export async function POST(req: NextRequest) {
  const caller = await getOrdoUser();
  if (!caller)         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!caller.isAdmin) return NextResponse.json({ error: "Forbidden" },    { status: 403 });

  const { email, password, name } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Email, password and name are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  let auth0User: { user_id: string };
  try {
    auth0User = await createAuth0User({ email, password, name });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Auth0 error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const user = await db.user.create({
    data: {
      auth0Id:  auth0User.user_id,
      email,
      name,
      isAdmin:  false,
      isActive: true,
    },
  });

  await db.auditLog.create({
    data: {
      actorId:    caller.id,
      action:     "USER_CREATED",
      targetId:   user.id,
      targetType: "User",
      meta:       JSON.stringify({ email, name, createdBy: caller.email }),
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
