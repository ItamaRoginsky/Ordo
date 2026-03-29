import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

async function getGoalForUser(id: string, userId: string) {
  return db.weeklyGoal.findFirst({ where: { id, userId } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const goal = await getGoalForUser(id, me.id);
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (typeof body.title      === "string") data.title      = body.title.trim();
  if (typeof body.isComplete === "boolean") data.isComplete = body.isComplete;
  if (typeof body.position   === "number")  data.position   = body.position;

  const updated = await db.weeklyGoal.update({ where: { id }, data });
  return NextResponse.json({ ...updated, weekStart: updated.weekStart.toISOString(), createdAt: updated.createdAt.toISOString() });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const goal = await getGoalForUser(id, me.id);
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.weeklyGoal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
