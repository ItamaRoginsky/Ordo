import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getOrdoUser();
  if (!me?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const allowed = ["isAdmin", "isActive"];
  const data = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

  const user = await db.user.update({ where: { id }, data });

  // Audit log
  let action: string | null = null;
  if ("isAdmin" in data) action = data.isAdmin ? "ADMIN_GRANTED" : "ADMIN_REVOKED";
  else if ("isActive" in data) action = data.isActive ? "USER_REACTIVATED" : "USER_SUSPENDED";
  if (action) {
    await db.auditLog.create({
      data: {
        actorId: me.id,
        action,
        targetId: user.id,
        targetType: "User",
        meta: JSON.stringify({ email: user.email }),
      },
    });
  }

  return NextResponse.json(user);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getOrdoUser();
  if (!me?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (me.id === id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  const user = await db.user.findUnique({ where: { id } });
  await db.user.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      actorId: me.id,
      action: "USER_DELETED",
      targetId: id,
      targetType: "User",
      meta: JSON.stringify({ email: user?.email }),
    },
  });

  return NextResponse.json({ ok: true });
}
