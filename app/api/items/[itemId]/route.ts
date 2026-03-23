import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

async function verifyItemOwnership(itemId: string, userId: string) {
    const item = await db.item.findUnique({
        where: { id: itemId },
        include: { group: { include: { board: true } } },
    });
    if (!item || item.group.board.ownerId !== userId) return null;
    return item;
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ itemId: string }> }
) {
    const me = await getOrdoUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;
    const item = await verifyItemOwnership(itemId, me.id);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { name, notes, position, groupId } = await req.json();
    const updated = await db.item.update({
        where: { id: itemId },
        data: {
            ...(name !== undefined && { name }),
            ...(notes !== undefined && { notes }),
            ...(position !== undefined && { position }),
            ...(groupId !== undefined && { groupId }),
        },
        include: { columnValues: true },
    });
    return NextResponse.json(updated);
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ itemId: string }> }
) {
    const me = await getOrdoUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;
    const item = await verifyItemOwnership(itemId, me.id);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.item.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
}
