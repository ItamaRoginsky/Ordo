"use client";

import { useQuery } from "@tanstack/react-query";
import { BoardView, type BoardWithData } from "./BoardView";

export function BoardClient({
  boardId,
  initialData,
}: {
  boardId: string;
  initialData: BoardWithData;
}) {
  const { data: board } = useQuery<BoardWithData>({
    queryKey: ["board", boardId],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}`);
      if (!res.ok) throw new Error("Failed to fetch board");
      return res.json();
    },
    initialData,
  });

  return <BoardView board={board!} />;
}
