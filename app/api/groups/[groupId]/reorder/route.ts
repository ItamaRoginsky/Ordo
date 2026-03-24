import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId } = await params;
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { board: true },
  });
  if (!group || group.board.ownerId !== me.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { itemIds } = await req.json();
  if (!Array.isArray(itemIds)) {
    return NextResponse.json({ error: "itemIds must be an array" }, { status: 400 });
  }

  await db.$transaction(
    itemIds.map((id: string, index: number) =>
      db.item.update({ where: { id }, data: { position: index } })
    )
  );

  return NextResponse.json({ ok: true });
}
