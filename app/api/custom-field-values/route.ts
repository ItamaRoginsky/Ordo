import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId, fieldId, value } = await req.json();

  if (!itemId || typeof itemId !== "string") {
    return NextResponse.json({ error: "itemId is required" }, { status: 400 });
  }
  if (!fieldId || typeof fieldId !== "string") {
    return NextResponse.json({ error: "fieldId is required" }, { status: 400 });
  }
  if (value === undefined) {
    return NextResponse.json({ error: "value is required" }, { status: 400 });
  }

  // Verify ownership through item → group → board chain
  const item = await db.item.findUnique({
    where: { id: itemId },
    include: { group: { include: { board: true } } },
  });
  if (!item || item.group.board.ownerId !== me.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cfv = await db.customFieldValue.upsert({
    where: { itemId_fieldId: { itemId, fieldId } },
    update: { value: JSON.stringify(value) },
    create: { itemId, fieldId, value: JSON.stringify(value) },
  });
  return NextResponse.json(cfv);
}
