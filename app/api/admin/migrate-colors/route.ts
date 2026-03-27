import { NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

const PASTEL_COLORS = [
  "#9EC5F7", "#A8B4F5", "#BFB0EE", "#D4AAEC", "#F0A8CC", "#F2BAA4",
  "#F2DBA0", "#C4E8A4", "#9ED4B4", "#8ED2CA", "#A4D6EE", "#D0A8E0",
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function nearestPastel(color: string): string {
  if (!color || !color.startsWith("#") || color.length !== 7) return PASTEL_COLORS[0];
  try {
    const [r1, g1, b1] = hexToRgb(color);
    let best = PASTEL_COLORS[0];
    let bestDist = Infinity;
    for (const p of PASTEL_COLORS) {
      const [r2, g2, b2] = hexToRgb(p);
      const d = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
      if (d < bestDist) { bestDist = d; best = p; }
    }
    return best;
  } catch {
    return PASTEL_COLORS[0];
  }
}

export async function POST() {
  const me = await getOrdoUser();
  if (!me?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [boards, groups] = await Promise.all([
    db.board.findMany({ select: { id: true, color: true } }),
    db.group.findMany({ select: { id: true, color: true } }),
  ]);

  const boardUpdates = boards
    .filter((b) => b.color && !PASTEL_COLORS.includes(b.color))
    .map((b) => db.board.update({ where: { id: b.id }, data: { color: nearestPastel(b.color!) } }));

  const groupUpdates = groups
    .filter((g) => g.color && !PASTEL_COLORS.includes(g.color))
    .map((g) => db.group.update({ where: { id: g.id }, data: { color: nearestPastel(g.color!) } }));

  await Promise.all([...boardUpdates, ...groupUpdates]);

  return NextResponse.json({
    updated: { boards: boardUpdates.length, groups: groupUpdates.length },
  });
}
