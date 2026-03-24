import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

async function verifyFieldOwnership(fieldId: string, userId: string) {
  const field = await db.customField.findUnique({
    where: { id: fieldId },
    include: { board: true },
  });
  if (!field || field.board.ownerId !== userId) return null;
  return field;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ fieldId: string }> }
) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fieldId } = await params;
  const field = await verifyFieldOwnership(fieldId, me.id);
  if (!field) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, type, position } = await req.json();
  const updated = await db.customField.update({
    where: { id: fieldId },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(position !== undefined && { position }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ fieldId: string }> }
) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fieldId } = await params;
  const field = await verifyFieldOwnership(fieldId, me.id);
  if (!field) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.customField.delete({ where: { id: fieldId } });
  return NextResponse.json({ ok: true });
}
