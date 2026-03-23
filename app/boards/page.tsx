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
        <h1 className="text-2xl font-semibold text-gray-800">My Boards</h1>
        <CreateBoardButton />
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">No boards yet</p>
          <p className="text-sm">Create your first board to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/boards/${board.id}`}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <span className="text-2xl">{board.icon ?? "📋"}</span>
              <span className="font-medium text-gray-800 truncate">{board.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
