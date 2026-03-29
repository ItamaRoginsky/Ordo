import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const weekStartParam = searchParams.get("weekStart");

  const weekStart = weekStartParam ? new Date(weekStartParam) : (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const [goals, inboxBoard] = await Promise.all([
    db.weeklyGoal.findMany({
      where: { userId: me.id, weekStart },
      include: {
        items: {
          where: { parentId: null },
          orderBy: { position: "asc" },
          select: {
            id: true, name: true, completedAt: true, priority: true,
            scheduledDate: true, groupId: true,
          },
        },
      },
      orderBy: { position: "asc" },
    }),
    db.board.findFirst({
      where: { ownerId: me.id, isSystem: true, type: "inbox" },
      select: {
        id: true, name: true, color: true,
        groups: { select: { id: true }, orderBy: { position: "asc" }, take: 1 },
      },
    }),
  ]);

  const inboxGroupId = inboxBoard?.groups[0]?.id ?? null;

  // Serialize dates to ISO strings so the client gets consistent data
  const serializedGoals = goals.map((g) => ({
    ...g,
    weekStart: g.weekStart.toISOString(),
    createdAt: g.createdAt.toISOString(),
    items: g.items.map((i) => ({
      ...i,
      scheduledDate: i.scheduledDate?.toISOString() ?? null,
      completedAt:   i.completedAt?.toISOString()   ?? null,
    })),
  }));

  return NextResponse.json({
    goals: serializedGoals,
    weeklyGoalsTarget: me.weeklyGoalsTarget,
    inboxGroupId,
    weekStart: weekStart.toISOString(),
    weekEnd:   weekEnd.toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { weekStart: weekStartStr, title } = await req.json();
  if (!title?.trim() || !weekStartStr) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const weekStart = new Date(weekStartStr);
  weekStart.setHours(0, 0, 0, 0);

  const maxPos = await db.weeklyGoal.aggregate({
    where: { userId: me.id, weekStart },
    _max: { position: true },
  });
  const position = (maxPos._max.position ?? -1) + 1;

  const goal = await db.weeklyGoal.create({
    data: { userId: me.id, weekStart, title: title.trim(), position },
    include: { items: true },
  });

  return NextResponse.json({
    ...goal,
    weekStart: goal.weekStart.toISOString(),
    createdAt: goal.createdAt.toISOString(),
  }, { status: 201 });
}
