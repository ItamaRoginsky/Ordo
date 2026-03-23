import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId, name } = await req.json();

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
    data: { groupId, name, position },
    include: { columnValues: true },
  });
  return NextResponse.json(item, { status: 201 });
}
