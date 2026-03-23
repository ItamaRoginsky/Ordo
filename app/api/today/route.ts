import { NextResponse } from "next/server";
import { getOrdoUser, getInboxGroupId } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const items = await db.item.findMany({
    where: {
      group: { board: { ownerId: me.id } },
      OR: [
        { isToday: true },
        { scheduledDate: { gte: todayStart, lte: todayEnd } },
        { completedAt: { gte: todayStart, lte: todayEnd } },
      ],
    },
    include: {
      columnValues: true,
      group: {
        include: { board: { select: { id: true, name: true, color: true, icon: true } } },
      },
    },
    orderBy: { position: "asc" },
  });

  const inboxGroupId = await getInboxGroupId(me.id);

  return NextResponse.json({ items, inboxGroupId });
}
