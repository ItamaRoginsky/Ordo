import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId, name, position } = await req.json();
  const item = await db.item.create({ data: { groupId, name, position } });
  return NextResponse.json(item, { status: 201 });
}
