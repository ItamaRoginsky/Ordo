import { NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";

export async function GET() {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ id: me.id, name: me.name, email: me.email, isAdmin: me.isAdmin });
}
