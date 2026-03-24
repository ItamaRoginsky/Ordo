import { NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const items = await db.item.findMany({
    where: {
      parentId: null,
      completedAt: null,
      group: { board: { ownerId: me.id } },
      OR: [
        { scheduledDate: { lt: todayStart } },
        { deadline: { lt: todayStart } },
      ],
    },
    include: {
      group: {
        include: { board: { select: { id: true, name: true, color: true, icon: true } } },
      },
    },
    orderBy: [
      { scheduledDate: "asc" },
    ],
  });

  return NextResponse.json({ items });
}
