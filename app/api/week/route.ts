import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser, getInboxGroupId } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const startParam = searchParams.get("start");

  const weekStart = startParam ? new Date(startParam) : (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Start on Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const items = await db.item.findMany({
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
  });

  const inboxGroupId = await getInboxGroupId(me.id);

  const inboxBoard = await db.board.findFirst({
    where: { ownerId: me.id, isSystem: true, type: "inbox" },
    select: { id: true, name: true },
  });

  const projects = await db.board.findMany({
    where: { ownerId: me.id, type: "project" },
    select: { id: true, name: true, color: true, icon: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ items, weekStart: weekStart.toISOString(), inboxGroupId, inboxBoard, projects });
}
