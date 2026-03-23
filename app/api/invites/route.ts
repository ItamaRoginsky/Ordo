import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { inviteUser } from "@/lib/auth0-management";

export async function POST(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  await inviteUser(email);
  return NextResponse.json({ ok: true });
}
