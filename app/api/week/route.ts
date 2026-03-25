import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const startParam = searchParams.get("start");

  const weekStart = startParam ? new Date(startParam) : (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Run all queries in parallel
  const [items, inboxBoard, projects] = await Promise.all([
    db.item.findMany({
      where: {
        parentId: null,
        group: { board: { ownerId: me.id } },
        scheduledDate: { gte: weekStart, lte: weekEnd },
      },
      include: {
        columnValues: true,
        group: {
          include: { board: { select: { id: true, name: true, color: true } } },
        },
      },
      orderBy: { position: "asc" },
    }),
    db.board.findFirst({
      where: { ownerId: me.id, isSystem: true, type: "inbox" },
      select: {
        id: true,
        name: true,
        groups: { select: { id: true }, orderBy: { position: "asc" }, take: 1 },
      },
    }),
    db.board.findMany({
      where: { ownerId: me.id, type: "project" },
      select: { id: true, name: true, color: true, icon: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const inboxGroupId = inboxBoard?.groups[0]?.id ?? null;

  return NextResponse.json({
    items,
    weekStart: weekStart.toISOString(),
    inboxGroupId,
    inboxBoard: inboxBoard ? { id: inboxBoard.id, name: inboxBoard.name } : null,
    projects,
  }, { headers: { "Cache-Control": "private, max-age=0, stale-while-revalidate=30" } });
}
