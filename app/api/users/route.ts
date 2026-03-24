import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET() {
  const me = await getOrdoUser();
  if (!me?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, name } = await req.json();
  if (!email?.trim()) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const existing = await db.user.findUnique({ where: { email: email.trim() } });
  if (existing) return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });

  const user = await db.user.create({
    data: {
      auth0Id: `pending|${randomUUID()}`,
      email: email.trim(),
      name: name?.trim() || null,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: me.id,
      action: "USER_CREATED",
      targetId: user.id,
      targetType: "User",
      meta: JSON.stringify({ email: user.email }),
    },
  });

  return NextResponse.json(user, { status: 201 });
}
