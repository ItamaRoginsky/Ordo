import { NextRequest, NextResponse } from "next/server";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";

function randomString(length: number) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const me = await getOrdoUser();
    if (!me?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = params;
    const newSeed = randomString(10);
    const newUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${newSeed}`;

    const user = await db.user.update({
        where: { id },
        data: { picture: newUrl },
    });

    await db.auditLog.create({
        data: {
            actorId: me.id,
            action: "USER_AVATAR_REGENERATED",
            targetId: user.id,
            targetType: "User",
            meta: JSON.stringify({ newUrl }),
        },
    });

    return NextResponse.json({ picture: newUrl });
}
