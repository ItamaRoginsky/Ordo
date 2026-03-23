import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, name, color, position } = await req.json();
  const group = await db.group.create({ data: { boardId, name, color, position } });
  return NextResponse.json(group, { status: 201 });
}
