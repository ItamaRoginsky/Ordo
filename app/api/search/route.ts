import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ boards: [], items: [] }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q || q.length < 1) return NextResponse.json({ boards: [], items: [] });

  const [boards, items] = await Promise.all([
    db.board.findMany({
      where: { ownerId: me.id, name: { contains: q } },
      select: { id: true, name: true, color: true, icon: true },
      take: 4,
    }),
    db.item.findMany({
      where: {
        group: { board: { ownerId: me.id } },
        name: { contains: q },
        completedAt: null,
      },
      select: {
        id: true,
        name: true,
        priority: true,
        deadline: true,
        group: {
          select: {
            name: true,
            board: { select: { name: true, color: true, id: true } },
          },
        },
      },
      take: 8,
    }),
  ]);

  return NextResponse.json({ boards, items });
}
