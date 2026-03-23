import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId, columnId, value } = await req.json();

  // Verify ownership chain
  const item = await db.item.findUnique({
    where: { id: itemId },
    include: { group: { include: { board: true } } },
  });
  if (!item || item.group.board.ownerId !== me.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cv = await db.columnValue.upsert({
    where: { itemId_columnId: { itemId, columnId } },
    create: { itemId, columnId, value: JSON.stringify(value) },
    update: { value: JSON.stringify(value) },
  });

  return NextResponse.json(cv);
}
