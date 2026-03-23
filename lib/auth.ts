import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import type { User } from "@prisma/client";

export async function getOrdoUser(): Promise<User | null> {
  const session = await auth0.getSession();
  if (!session) return null;

  const { sub, email, name, picture } = session.user;

  const user = await db.user.upsert({
    where: { auth0Id: sub },
    update: {
      email: email ?? "",
      name: name ?? null,
      picture: picture ?? null,
      lastLoginAt: new Date(),
    },
    create: {
      auth0Id: sub,
      email: email ?? "",
      name: name ?? null,
      picture: picture ?? null,
    },
  });

  // Ensure inbox board + default group exist (created once on first login)
  const inbox = await db.board.findFirst({
    where: { ownerId: user.id, isSystem: true, type: "inbox" },
    include: { groups: true },
  });

  if (!inbox) {
    await db.board.create({
      data: {
        ownerId: user.id,
        name: "Inbox",
        icon: "📥",
        color: "#6b7280",
        type: "inbox",
        isSystem: true,
        groups: {
          create: { name: "Tasks", color: "#6b7280", position: 0 },
        },
      },
    });
  } else if (inbox.groups.length === 0) {
    await db.group.create({
      data: { boardId: inbox.id, name: "Tasks", color: "#6b7280", position: 0 },
    });
  }

  return user;
}

// Returns the inbox group ID for "Add to today" quick input
export async function getInboxGroupId(userId: string): Promise<string | null> {
  const inbox = await db.board.findFirst({
    where: { ownerId: userId, isSystem: true, type: "inbox" },
    include: { groups: { orderBy: { position: "asc" }, take: 1 } },
  });
  return inbox?.groups[0]?.id ?? null;
}
