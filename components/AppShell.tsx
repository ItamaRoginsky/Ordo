import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { QueryProvider } from "./QueryProvider";
import { AppShellClient } from "./AppShellClient";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getOrdoUser();
  const boards = user
    ? await db.board.findMany({
        where: { ownerId: user.id, type: "project" },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return (
    <QueryProvider>
      <AppShellClient boards={boards} user={user}>
        {children}
      </AppShellClient>
    </QueryProvider>
  );
}
