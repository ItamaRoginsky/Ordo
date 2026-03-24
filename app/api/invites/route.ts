import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { inviteUser } from "@/lib/auth0-management";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  await inviteUser(email);

  await db.auditLog.create({
    data: {
      actorId: me.id,
      action: "USER_INVITED",
      targetType: "User",
      meta: JSON.stringify({ email }),
    },
  });

  return NextResponse.json({ ok: true });
}
