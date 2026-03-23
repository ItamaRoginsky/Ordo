import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, name, color } = await req.json();

  const board = await db.board.findUnique({ where: { id: boardId } });
  if (!board || board.ownerId !== me.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const maxPos = await db.group.aggregate({
    where: { boardId },
    _max: { position: true },
  });
  const position = (maxPos._max.position ?? -1) + 1;

  const group = await db.group.create({ data: { boardId, name, color, position } });
  return NextResponse.json(group, { status: 201 });
}
