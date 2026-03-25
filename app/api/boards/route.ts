import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const boards = await db.board.findMany({
    where: { ownerId: me.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(boards, {
    headers: { "Cache-Control": "private, max-age=0, stale-while-revalidate=60" },
  });
}

export async function POST(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, icon, color } = await req.json();

  const board = await db.$transaction(async (tx) => {
    const b = await tx.board.create({
      data: { name, icon, color, ownerId: me.id, type: "project" },
    });
    await tx.column.createMany({
      data: [
        { boardId: b.id, name: "Status", type: "status", position: 0 },
        { boardId: b.id, name: "Priority", type: "priority", position: 1 },
        { boardId: b.id, name: "Due date", type: "date", position: 2 },
      ],
    });
    await tx.group.create({
      data: { boardId: b.id, name: "New Group", position: 0, color: "#579bfc" },
    });
    return b;
  });

  return NextResponse.json(board, { status: 201 });
}
