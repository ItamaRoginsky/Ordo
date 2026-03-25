import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Lightweight ping — keeps the serverless function and DB connection warm.
// Hit this every 4–5 minutes from an external cron (cron-job.org, UptimeRobot, etc.)
// to eliminate cold start latency for real users.
export async function GET() {
  await db.$queryRaw`SELECT 1`;
  return NextResponse.json({ ok: true });
}
