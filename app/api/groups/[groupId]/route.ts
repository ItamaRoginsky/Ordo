import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

async function verifyGroupOwnership(groupId: string, userId: string) {
    const group = await db.group.findUnique({
        where: { id: groupId },
        include: { board: true },
    });
    if (!group || group.board.ownerId !== userId) return null;
    return group;
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ groupId: string }> }
) {
    const me = await getOrdoUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId } = await params;
    const group = await verifyGroupOwnership(groupId, me.id);
    if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { name, color, position } = await req.json();
    const updated = await db.group.update({
        where: { id: groupId },
        data: {
            ...(name !== undefined && { name }),
            ...(color !== undefined && { color }),
            ...(position !== undefined && { position }),
        },
    });
    return NextResponse.json(updated);
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ groupId: string }> }
) {
    const me = await getOrdoUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId } = await params;
    const group = await verifyGroupOwnership(groupId, me.id);
    if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.group.delete({ where: { id: groupId } });
    return NextResponse.json({ ok: true });
}
