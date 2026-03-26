import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGcalToken } from "@/lib/gcal";

export async function POST(req: NextRequest) {
  const user = await getOrdoUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accessToken = await getGcalToken(user.id);
  if (!accessToken) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const targetDate = body.date ? new Date(body.date) : new Date();

  const start = new Date(targetDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);

  // dateStr for all-day event (YYYY-MM-DD local)
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDayStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, "0")}-${String(nextDay.getDate()).padStart(2, "0")}`;

  const items = await db.item.findMany({
    where: {
      parentId: null,
      completedAt: null,
      group: { board: { ownerId: user.id } },
      OR: [
        { isToday: true },
        { scheduledDate: { gte: start, lte: end } },
      ],
    },
    select: { name: true, description: true, priority: true },
    orderBy: { position: "asc" },
  });

  if (items.length === 0) {
    return NextResponse.json({ count: 0, message: "No tasks to export" });
  }

  const PRIORITY_EMOJI: Record<string, string> = { p1: "🔴 ", p2: "🟠 ", p3: "🔵 " };

  const created: string[] = [];
  const failed: string[] = [];

  for (const item of items) {
    const prefix = item.priority ? (PRIORITY_EMOJI[item.priority] ?? "") : "";
    const eventRes = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: `${prefix}${item.name}`,
          description: item.description ?? undefined,
          start: { date: dateStr },
          end: { date: nextDayStr },
        }),
      }
    );

    if (eventRes.ok) {
      created.push(item.name);
    } else {
      failed.push(item.name);
    }
  }

  return NextResponse.json({ count: created.length, created, failed });
}
