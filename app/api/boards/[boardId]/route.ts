import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ boardId: string }> }) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;
  const board = await db.board.findUnique({
    where: { id: boardId },
    include: {
      groups: {
        orderBy: { position: "asc" },
        include: {
          items: {
            where: { parentId: null },
            orderBy: { position: "asc" },
            include: {
              columnValues: true,
              subItems: {
                orderBy: { position: "asc" },
                include: { columnValues: true },
              },
            },
          },
        },
      },
      columns: { orderBy: { position: "asc" } },
      customFields: { orderBy: { position: "asc" } },
    },
  });

  if (!board || board.ownerId !== me.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(board, {
    headers: { "Cache-Control": "private, max-age=0, stale-while-revalidate=30" },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ boardId: string }> }) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;
  const board = await db.board.findUnique({ where: { id: boardId } });
  if (!board || board.ownerId !== me.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.board.delete({ where: { id: boardId } });
  return NextResponse.json({ ok: true });
}
