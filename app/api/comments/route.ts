import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId, text } = await req.json();
  if (!itemId || !text?.trim()) {
    return NextResponse.json({ error: "itemId and text are required" }, { status: 400 });
  }

  // Verify ownership via item → group → board
  const item = await db.item.findUnique({
    where: { id: itemId },
    include: { group: { include: { board: true } } },
  });
  if (!item || item.group.board.ownerId !== me.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const comment = await db.comment.create({
    data: { itemId, authorId: me.id, text: text.trim() },
  });

  return NextResponse.json(comment);
}
