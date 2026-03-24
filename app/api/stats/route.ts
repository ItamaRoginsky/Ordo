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

  const weekStart = new Date(todayStart);
  const day = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));

  const [allItems, boards] = await Promise.all([
    db.item.findMany({
      where: { parentId: null, group: { board: { ownerId: me.id } } },
      include: { group: { include: { board: true } }, columnValues: true },
    }),
    db.board.findMany({
      where: { ownerId: me.id, type: "project" },
      include: {
        groups: {
          include: {
            items: {
              where: { parentId: null },
              select: { completedAt: true, deadline: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const doneThisWeek = allItems.filter(
    (i) => i.completedAt && i.completedAt >= weekStart
  ).length;

  const openTasks = allItems.filter((i) => !i.completedAt).length;

  const overdueTasks = allItems.filter(
    (i) => !i.completedAt && i.deadline && i.deadline < todayStart
  ).length;

  const totalItems = allItems.length;
  const completionRate =
    totalItems > 0
      ? Math.round((allItems.filter((i) => i.completedAt).length / totalItems) * 100)
      : 0;

  // Tasks by project
  const tasksByProject = boards
    .map((board) => ({
      name: board.name,
      color: board.color ?? "#5b9cf6",
      count: allItems.filter((i) => i.group.board.id === board.id && !i.completedAt).length,
    }))
    .filter((b) => b.count > 0);

  // Upcoming deadlines (next 14 days, not completed)
  const upcomingEnd = new Date(todayStart);
  upcomingEnd.setDate(upcomingEnd.getDate() + 14);
  upcomingEnd.setHours(23, 59, 59, 999);
  const upcomingDeadlines = allItems
    .filter(
      (i) =>
        !i.completedAt &&
        i.deadline &&
        i.deadline >= todayStart &&
        i.deadline <= upcomingEnd
    )
    .sort((a, b) => (a.deadline! > b.deadline! ? 1 : -1))
    .slice(0, 8)
    .map((i) => ({
      id: i.id,
      name: i.name,
      deadline: i.deadline!.toISOString(),
      boardName: i.group.board.name,
      boardColor: i.group.board.color,
      priority: i.priority ?? null,
    }));

  // Today's agenda (isToday or scheduledDate = today)
  const todayAgenda = allItems
    .filter(
      (i) =>
        !i.completedAt &&
        (i.isToday || (i.scheduledDate && i.scheduledDate >= todayStart && i.scheduledDate <= todayEnd))
    )
    .slice(0, 6)
    .map((i) => {
      // Status is stored as a plain string value in columnValues
      const statusCv = i.columnValues[0] ?? null;
      let status: string | null = null;
      if (statusCv) {
        try { status = JSON.parse(statusCv.value); } catch { status = statusCv.value; }
      }
      return {
        id: i.id,
        name: i.name,
        boardName: i.group.board.name,
        boardColor: i.group.board.color,
        priority: i.priority ?? null,
        status,
      };
    });

  const todayCount = allItems.filter(
    (i) => i.isToday || (i.scheduledDate && i.scheduledDate >= todayStart && i.scheduledDate <= todayEnd)
  ).length;

  const todayDoneCount = allItems.filter(
    (i) => i.completedAt && i.completedAt >= todayStart
  ).length;

  // Weekly velocity: last 7 days
  const weeklyVelocity = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - (6 - idx));
    const dEnd = new Date(d);
    dEnd.setHours(23, 59, 59, 999);
    return {
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: d.toISOString().split("T")[0],
      completed: allItems.filter(
        (i) => i.completedAt && i.completedAt >= d && i.completedAt <= dEnd
      ).length,
    };
  });

  // Streak: consecutive days ending today with at least one completion
  let streak = 0;
  const checkDay = new Date(todayStart);
  for (let i = 0; i < 365; i++) {
    const dayStart = new Date(checkDay);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const hasCompletion = allItems.some(
      (item) => item.completedAt && item.completedAt >= dayStart && item.completedAt <= dayEnd
    );
    if (!hasCompletion) break;
    streak++;
  }

  // Project progress for Open Projects widget
  const projectProgress = boards.map((board) => {
    const allBoardItems = board.groups.flatMap((g) => g.items);
    const total = allBoardItems.length;
    const done = allBoardItems.filter((i) => i.completedAt).length;
    const overdue = allBoardItems.filter(
      (i) => !i.completedAt && i.deadline && i.deadline < todayStart
    ).length;
    const lastActivity = allBoardItems
      .filter((i) => i.completedAt)
      .map((i) => i.completedAt!)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    return {
      id: board.id,
      name: board.name,
      color: board.color ?? "#5b9cf6",
      icon: board.icon ?? "📋",
      totalSteps: total,
      doneSteps: done,
      overdueSteps: overdue,
      lastActivityAt: lastActivity?.toISOString() ?? null,
    };
  });

  return NextResponse.json({
    userName: me.name?.split(" ")[0] ?? null,
    doneThisWeek,
    openTasks,
    overdueTasks,
    completionRate,
    streak,
    todayCount,
    todayDoneCount,
    tasksByProject,
    upcomingDeadlines,
    weeklyVelocity,
    todayAgenda,
    projectProgress,
  });
}
