import { NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Same query pattern as /api/stats which powers Today's Agenda.
  // No completedAt/OR filters in Prisma WHERE — those break with SQLite.
  // Fetch all, filter in JS exactly like stats does.
  const allItems = await db.item.findMany({
    where: { parentId: null, group: { board: { ownerId: me.id } } },
    select: {
      id: true,
      name: true,
      priority: true,
      isToday: true,
      scheduledDate: true,
      completedAt: true,
      group: { select: { board: { select: { name: true, color: true } } } },
    },
  });

  // Mirror the todayAgenda filter from stats exactly
  const todayOpen = allItems.filter(
    (i) =>
      !i.completedAt &&
      (i.isToday ||
        (i.scheduledDate &&
          i.scheduledDate >= todayStart &&
          i.scheduledDate <= todayEnd))
  );

  return NextResponse.json({
    p1: todayOpen.filter((i) => i.priority === "p1"),
    p2: todayOpen.filter((i) => i.priority === "p2"),
    p3: todayOpen.filter((i) => i.priority === "p3"),
    p4: todayOpen.filter((i) => i.priority === "p4" || !i.priority),
  });
}
