import { NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getOrdoUser();
  if (!user) return NextResponse.json({ connected: false });

  const token = await db.googleToken.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ connected: !!token });
}
