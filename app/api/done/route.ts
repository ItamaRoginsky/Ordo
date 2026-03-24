import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db.item.findMany({
    where: {
      parentId: null,
      completedAt: { not: null },
      group: { board: { ownerId: me.id } },
    },
    include: {
      group: {
        include: { board: { select: { id: true, name: true, color: true, icon: true } } },
      },
    },
    orderBy: { completedAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function DELETE(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.all) {
    await db.item.deleteMany({
      where: {
        parentId: null,
        completedAt: { not: null },
        group: { board: { ownerId: me.id } },
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.id) {
    // Verify ownership before deleting
    const item = await db.item.findUnique({
      where: { id: body.id },
      include: { group: { include: { board: true } } },
    });
    if (!item || item.group.board.ownerId !== me.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await db.item.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Bad request" }, { status: 400 });
}
