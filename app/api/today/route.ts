import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dateParam = new URL(req.url).searchParams.get("date");
  const targetDate = dateParam ? new Date(dateParam) : new Date();

  const start = new Date(targetDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);

  const now = new Date();
  const isActualToday =
    targetDate.getFullYear() === now.getFullYear() &&
    targetDate.getMonth() === now.getMonth() &&
    targetDate.getDate() === now.getDate();

  // Run all queries in parallel
  const [items, inboxBoard, projects] = await Promise.all([
    db.item.findMany({
      where: {
        parentId: null,
        group: { board: { ownerId: me.id } },
        OR: [
          ...(isActualToday ? [{ isToday: true }] : []),
          { scheduledDate: { gte: start, lte: end } },
          { completedAt: { gte: start, lte: end } },
        ],
      },
      include: {
        columnValues: true,
        subItems: {
          orderBy: { position: "asc" },
          include: { columnValues: true },
        },
        group: {
          include: { board: { select: { id: true, name: true, color: true, icon: true } } },
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
    inboxGroupId,
    inboxBoard: inboxBoard ? { id: inboxBoard.id, name: inboxBoard.name } : null,
    projects,
  });
}
