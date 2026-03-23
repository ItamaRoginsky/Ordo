import { notFound } from "next/navigation";
import { getOrdoUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BoardClient } from "@/components/board/BoardClient";

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const user = await getOrdoUser();
  if (!user) notFound();

  const board = await db.board.findUnique({
    where: { id: boardId },
    include: {
      groups: {
        orderBy: { position: "asc" },
        include: {
          items: {
            orderBy: { position: "asc" },
            include: { columnValues: true },
          },
        },
      },
      columns: { orderBy: { position: "asc" } },
    },
  });

  if (!board || board.ownerId !== user.id) notFound();

  return <BoardClient boardId={boardId} initialData={board} />;
}
