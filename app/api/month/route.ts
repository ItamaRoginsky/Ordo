import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth())); // 0-indexed

  const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
  const monthEnd   = new Date(year, month + 1, 0, 23, 59, 59, 999); // last day of month

  const [items, inboxBoard, projects] = await Promise.all([
    db.item.findMany({
      where: {
        parentId: null,
        group: { board: { ownerId: me.id } },
        scheduledDate: { gte: monthStart, lte: monthEnd },
      },
      include: {
        group: {
          include: {
            board: { select: { id: true, name: true, color: true, icon: true } },
          },
        },
        subItems: {
          orderBy: { position: "asc" },
          select: { id: true, name: true, completedAt: true, priority: true },
        },
      },
      orderBy: { position: "asc" },
    }),
    db.board.findFirst({
      where: { ownerId: me.id, isSystem: true, type: "inbox" },
      select: {
        id: true,
        name: true,
        color: true,
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

  return NextResponse.json(
    {
      items,
      inboxGroupId,
      inboxBoard: inboxBoard
        ? { id: inboxBoard.id, name: inboxBoard.name, color: inboxBoard.color }
        : null,
      projects,
    },
    { headers: { "Cache-Control": "private, max-age=0, stale-while-revalidate=30" } },
  );
}
