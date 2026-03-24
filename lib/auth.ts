import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import type { User } from "@prisma/client";

export async function getOrdoUser(): Promise<User | null> {
  const session = await auth0.getSession();
  if (!session) return null;

  const { sub, email, name, picture } = session.user;

  // Try to find by auth0Id first, then fall back to email (for admin-created users)
  let user = await db.user.findUnique({ where: { auth0Id: sub } });

  if (user) {
    user = await db.user.update({
      where: { id: user.id },
      data: {
        email: email ?? user.email,
        name: name ?? user.name,
        picture: picture ?? user.picture,
        lastLoginAt: new Date(),
      },
    });
  } else {
    // Check if admin pre-created this user by email
    const preCreated = email ? await db.user.findUnique({ where: { email } }) : null;
    if (preCreated) {
      user = await db.user.update({
        where: { id: preCreated.id },
        data: {
          auth0Id: sub,
          name: name ?? preCreated.name,
          picture: picture ?? preCreated.picture,
          lastLoginAt: new Date(),
        },
      });
    } else {
      user = await db.user.create({
        data: {
          auth0Id: sub,
          email: email ?? "",
          name: name ?? null,
          picture: picture ?? null,
        },
      });
    }
  }

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
