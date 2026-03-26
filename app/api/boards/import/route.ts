import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const me = await getOrdoUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "JSON must be an object" }, { status: 400 });
  }

  const { name, icon, color, groups } = body as Record<string, unknown>;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (name.length > 200) {
    return NextResponse.json({ error: "name must be under 200 characters" }, { status: 400 });
  }

  const rawGroups = Array.isArray(groups) ? groups : [];
  if (rawGroups.length > 50) {
    return NextResponse.json({ error: "Too many groups (max 50)" }, { status: 400 });
  }

  const board = await db.$transaction(async (tx) => {
    const b = await tx.board.create({
      data: {
        name: name.trim(),
        icon: typeof icon === "string" ? icon : "📋",
        color: typeof color === "string" ? color : "#9EC5F7",
        ownerId: me.id,
        type: "project",
      },
    });

    await tx.column.createMany({
      data: [
        { boardId: b.id, name: "Status",   type: "status",   position: 0 },
        { boardId: b.id, name: "Priority", type: "priority", position: 1 },
        { boardId: b.id, name: "Due date", type: "date",     position: 2 },
      ],
    });

    for (let gi = 0; gi < rawGroups.length; gi++) {
      const g = rawGroups[gi] as Record<string, unknown>;
      const groupName  = typeof g.name  === "string" ? g.name.trim()  : `Group ${gi + 1}`;
      const groupColor = typeof g.color === "string" ? g.color        : "#9EC5F7";

      const group = await tx.group.create({
        data: { boardId: b.id, name: groupName, color: groupColor, position: gi },
      });

      const rawItems = Array.isArray(g.items) ? (g.items as unknown[]).slice(0, 200) : [];

      for (let ii = 0; ii < rawItems.length; ii++) {
        const item = rawItems[ii] as Record<string, unknown>;
        const itemName = typeof item.name === "string" ? item.name.trim().slice(0, 500) : "";
        if (!itemName) continue;

        const parseDate = (v: unknown): Date | null => {
          if (typeof v !== "string" || !v) return null;
          const d = new Date(v);
          return isNaN(d.getTime()) ? null : d;
        };

        await tx.item.create({
          data: {
            groupId:       group.id,
            name:          itemName,
            notes:         typeof item.notes === "string" ? item.notes.slice(0, 10000) : null,
            position:      ii,
            priority:      typeof item.priority === "string" ? item.priority : null,
            scheduledDate: parseDate(item.scheduledDate),
            deadline:      parseDate(item.deadline),
          },
        });
      }
    }

    if (rawGroups.length === 0) {
      await tx.group.create({
        data: { boardId: b.id, name: "New Group", position: 0, color: "#9EC5F7" },
      });
    }

    return b;
  });

  return NextResponse.json(board, { status: 201 });
}
