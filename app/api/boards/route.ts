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
  return NextResponse.json(boards);
}

export async function POST(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, icon, color } = await req.json();
  const board = await db.board.create({
    data: { name, icon, color, ownerId: me.id },
  });
  return NextResponse.json(board, { status: 201 });
}
