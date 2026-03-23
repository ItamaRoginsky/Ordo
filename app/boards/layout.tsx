import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { QueryProvider } from "@/components/QueryProvider";

export default async function BoardsLayout({ children }: { children: React.ReactNode }) {
  const user = await getOrdoUser();
  const boards = user
    ? await db.board.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "asc" } })
    : [];

  return (
    <QueryProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar boards={boards} user={user} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </QueryProvider>
  );
}
