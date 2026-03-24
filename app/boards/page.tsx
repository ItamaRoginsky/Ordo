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
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>My Projects</h1>
        <CreateBoardButton />
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-sm mb-4" style={{ color: "var(--text-4)" }}>No projects yet</p>
          <CreateBoardButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/boards/${board.id}`}
              className="flex items-center gap-3 p-4 rounded-xl transition-all"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)", borderRadius: "var(--radius-card)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
            >
              <span className="text-xl">{board.icon ?? "📋"}</span>
              <span className="font-medium text-sm truncate" style={{ color: "var(--text-2)" }}>{board.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
