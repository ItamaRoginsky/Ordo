import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import type { User } from "@prisma/client";

export async function getOrdoUser(): Promise<User | null> {
  const session = await auth0.getSession();
  if (!session) return null;

  const { sub, email, name, picture } = session.user;

  // Fast path: user already exists — return immediately, no DB writes
  const existing = await db.user.findUnique({ where: { auth0Id: sub } });
  if (existing) return existing;

  // First login: create or link user
  let user: User;
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
    try {
      user = await db.user.create({
        data: {
          auth0Id: sub,
          email: email ?? "",
          name: name ?? null,
          picture: picture ?? null,
          lastLoginAt: new Date(),
        },
      });
    } catch (err: any) {
      // Unique constraint — a concurrent request already created the user
      if (err?.code === "P2002") {
        const created = await db.user.findUnique({ where: { auth0Id: sub } });
        if (created) return created;
      }
      throw err;
    }
  }

  // Ensure inbox board exists (only for new users)
  const inbox = await db.board.findFirst({
    where: { ownerId: user.id, isSystem: true },
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
        groups: { create: { name: "Tasks", color: "#6b7280", position: 0 } },
      },
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
