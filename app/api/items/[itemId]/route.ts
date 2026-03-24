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

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ itemId: string }> }
) {
    const me = await getOrdoUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;
    const item = await db.item.findUnique({
        where: { id: itemId },
        include: {
            columnValues: true,
            customValues: true,
            comments: { orderBy: { createdAt: "asc" } },
            subItems: {
                orderBy: { position: "asc" },
                include: { columnValues: true },
            },
            group: { include: { board: true } },
        },
    });
    if (!item || item.group.board.ownerId !== me.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(item);
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

    const { name, notes, position, groupId, isToday, completedAt, scheduledDate, priority, category, parentId, description, deadline } = await req.json();

    // Auto-set scheduledDate to today midnight when pinning to My Day
    let resolvedScheduledDate = scheduledDate;
    if (isToday === true && scheduledDate === undefined && !item.scheduledDate) {
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        resolvedScheduledDate = todayMidnight.toISOString();
    }

    const updated = await db.item.update({
        where: { id: itemId },
        data: {
            ...(name !== undefined && { name }),
            ...(notes !== undefined && { notes }),
            ...(position !== undefined && { position }),
            ...(groupId !== undefined && { groupId }),
            ...(isToday !== undefined && { isToday }),
            ...(priority !== undefined && { priority }),
            ...(category !== undefined && { category }),
            ...(parentId !== undefined && { parentId: parentId === null ? null : parentId }),
            ...(description !== undefined && { description }),
            ...(deadline !== undefined && {
                deadline: deadline === null ? null : new Date(deadline),
            }),
            ...(completedAt !== undefined && {
                completedAt: completedAt === null ? null : new Date(completedAt),
            }),
            ...(resolvedScheduledDate !== undefined && {
                scheduledDate: resolvedScheduledDate === null ? null : new Date(resolvedScheduledDate),
            }),
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
