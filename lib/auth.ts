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

  return user;
}
