import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, name, color } = await req.json();

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (name.length > 200) {
    return NextResponse.json({ error: "name must be under 200 characters" }, { status: 400 });
  }
  if (!boardId || typeof boardId !== "string") {
    return NextResponse.json({ error: "boardId is required" }, { status: 400 });
  }

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
