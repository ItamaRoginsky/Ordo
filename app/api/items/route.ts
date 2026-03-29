import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId, name, priority, category, parentId, isToday, scheduledDate, description, weeklyGoalId } = await req.json();

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (name.length > 500) {
    return NextResponse.json({ error: "name must be under 500 characters" }, { status: 400 });
  }
  if (!groupId || typeof groupId !== "string") {
    return NextResponse.json({ error: "groupId is required" }, { status: 400 });
  }

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { board: true },
  });
  if (!group || group.board.ownerId !== me.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const maxPos = await db.item.aggregate({
    where: { groupId },
    _max: { position: true },
  });
  const position = (maxPos._max.position ?? -1) + 1;

  const item = await db.item.create({
    data: {
      groupId,
      name: name.trim(),
      position,
      ...(priority !== undefined && { priority }),
      ...(category !== undefined && { category }),
      ...(parentId !== undefined && { parentId }),
      ...(isToday !== undefined && { isToday }),
      ...(scheduledDate !== undefined && { scheduledDate: new Date(scheduledDate) }),
      ...(description    !== undefined && { description }),
      ...(weeklyGoalId   !== undefined && { weeklyGoalId }),
    },
    include: { columnValues: true, subItems: true },
  });
  return NextResponse.json(item, { status: 201 });
}
