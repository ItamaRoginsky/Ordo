import { NextResponse } from "next/server";
import { getOrdoUser, getInboxGroupId } from "@/lib/auth";

export async function GET() {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const groupId = await getInboxGroupId(me.id);
  return NextResponse.json({ groupId });
}
