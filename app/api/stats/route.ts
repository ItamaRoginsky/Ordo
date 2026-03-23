import { NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const weekStart = new Date(now);
  const day = now.getDay();
  weekStart.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  weekStart.setHours(0, 0, 0, 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [allItems, boards] = await Promise.all([
    db.item.findMany({
      where: { group: { board: { ownerId: me.id } } },
      include: { group: { include: { board: true } } },
    }),
    db.board.findMany({
      where: { ownerId: me.id, type: "project" },
    }),
  ]);

  const doneThisWeek = allItems.filter(
    (i) => i.completedAt && i.completedAt >= weekStart
  ).length;

  const openTasks = allItems.filter((i) => !i.completedAt).length;

  const overdueTasks = allItems.filter(
    (i) => !i.completedAt && i.scheduledDate && i.scheduledDate < todayStart
  ).length;

  const completionRate =
    allItems.length > 0
      ? Math.round((allItems.filter((i) => i.completedAt).length / allItems.length) * 100)
      : 0;

  // Tasks by project board
  const tasksByProject = boards.map((board) => ({
    name: board.name,
    color: board.color ?? "#5b9cf6",
    count: allItems.filter((i) => i.group.board.id === board.id && !i.completedAt).length,
  })).filter((b) => b.count > 0);

  // Upcoming deadlines (next 7 days, not completed)
  const upcomingEnd = new Date();
  upcomingEnd.setDate(upcomingEnd.getDate() + 7);
  const upcomingDeadlines = allItems
    .filter(
      (i) =>
        !i.completedAt &&
        i.scheduledDate &&
        i.scheduledDate >= todayStart &&
        i.scheduledDate <= upcomingEnd
    )
    .sort((a, b) => (a.scheduledDate! > b.scheduledDate! ? 1 : -1))
    .slice(0, 8)
    .map((i) => ({
      id: i.id,
      name: i.name,
      scheduledDate: i.scheduledDate!.toISOString(),
      boardName: i.group.board.name,
      boardColor: i.group.board.color ?? "#5b9cf6",
    }));

  // Weekly velocity: completed items per day for last 7 days
  const weeklyVelocity = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    d.setHours(0, 0, 0, 0);
    const dEnd = new Date(d);
    dEnd.setHours(23, 59, 59, 999);
    return {
      date: d.toISOString().split("T")[0],
      count: allItems.filter(
        (i) => i.completedAt && i.completedAt >= d && i.completedAt <= dEnd
      ).length,
    };
  });

  return NextResponse.json({
    doneThisWeek,
    openTasks,
    overdueTasks,
    completionRate,
    tasksByProject,
    upcomingDeadlines,
    weeklyVelocity,
  });
}
