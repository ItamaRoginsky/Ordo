import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const boardId = new URL(req.url).searchParams.get("boardId");
  if (!boardId) return NextResponse.json({ error: "boardId required" }, { status: 400 });

  const board = await db.board.findUnique({ where: { id: boardId } });
  if (!board || board.ownerId !== me.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fields = await db.customField.findMany({
    where: { boardId },
    orderBy: { position: "asc" },
  });
  return NextResponse.json(fields);
}

export async function POST(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, name, type } = await req.json();
  const board = await db.board.findUnique({ where: { id: boardId } });
  if (!board || board.ownerId !== me.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const maxPos = await db.customField.aggregate({
    where: { boardId },
    _max: { position: true },
  });
  const position = (maxPos._max.position ?? -1) + 1;

  const field = await db.customField.create({
    data: { boardId, name, type, position },
  });
  return NextResponse.json(field, { status: 201 });
}
