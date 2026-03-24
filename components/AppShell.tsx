import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "./sidebar/Sidebar";
import { QueryProvider } from "./QueryProvider";

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
      <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-page)" }}>
        <Sidebar boards={boards} user={user} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </QueryProvider>
  );
}
