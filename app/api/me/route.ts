import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ id: me.id, name: me.name, email: me.email, isAdmin: me.isAdmin, weeklyGoalsTarget: me.weeklyGoalsTarget });
}

export async function PATCH(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (typeof body.weeklyGoalsTarget === "number") {
    data.weeklyGoalsTarget = Math.min(10, Math.max(1, Math.round(body.weeklyGoalsTarget)));
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const updated = await db.user.update({ where: { id: me.id }, data });
  return NextResponse.json({ weeklyGoalsTarget: updated.weeklyGoalsTarget });
}
