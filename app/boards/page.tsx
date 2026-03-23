import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateBoardButton } from "@/components/board/CreateBoardButton";
import Link from "next/link";

export default async function BoardsPage() {
  const user = await getOrdoUser();
  const boards = user
    ? await db.board.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "asc" } })
    : [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold text-white/90 tracking-tight">My Boards</h1>
        <CreateBoardButton />
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-white/25 text-sm mb-4">No boards yet</p>
          <CreateBoardButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/boards/${board.id}`}
              className="flex items-center gap-3 p-4 bg-[#1c1c1c] rounded-xl border border-white/[0.07] hover:border-white/[0.14] hover:bg-[#222222] transition-all"
            >
              <span className="text-xl">{board.icon ?? "📋"}</span>
              <span className="font-medium text-white/80 text-sm truncate">{board.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
