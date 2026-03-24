import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, name, type, position } = await req.json();

  const board = await db.board.findUnique({ where: { id: boardId } });
  if (!board || board.ownerId !== me.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const column = await db.column.create({ data: { boardId, name, type, position } });
  return NextResponse.json(column, { status: 201 });
}
