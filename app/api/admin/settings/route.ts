import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

const DEFAULTS = [
  { key: "allow_registrations", value: "true" },
  { key: "maintenance_mode", value: "false" },
  { key: "require_invite", value: "true" },
];

export async function GET() {
  const me = await getOrdoUser();
  if (!me?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Seed defaults for missing keys
  for (const { key, value } of DEFAULTS) {
    await db.appSetting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  const rows = await db.appSetting.findMany();
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;

  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key, value } = await req.json();
  if (!key || value === undefined) {
    return NextResponse.json({ error: "key and value required" }, { status: 400 });
  }

  const setting = await db.appSetting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });

  return NextResponse.json(setting);
}
