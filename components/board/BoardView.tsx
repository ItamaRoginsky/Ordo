"use client";

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Board, Group, Item, Column, ColumnValue } from "@prisma/client";
import { GroupRow } from "./GroupRow";
import { Plus } from "lucide-react";

type ItemWithValues = Item & { columnValues: ColumnValue[] };
type GroupWithItems = Group & { items: ItemWithValues[] };
export type BoardWithData = Board & { groups: GroupWithItems[]; columns: Column[] };

export function BoardView({ board }: { board: BoardWithData }) {
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const GROUP_ACCENT_COLORS = [
    "#5b9cf6", "#34d399", "#f59e0b", "#f87171", "#a78bfa", "#38bdf8",
  ];

  const addGroup = useMutation({
    mutationFn: async (name: string) => {
      const color = GROUP_ACCENT_COLORS[board.groups.length % GROUP_ACCENT_COLORS.length];
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId: board.id, name, color }),
      });
      if (!res.ok) throw new Error("Failed to create group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", board.id] });
      setNewGroupName("");
      setIsAddingGroup(false);
    },
  });

  function openAddGroup() {
    setIsAddingGroup(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function submitGroup() {
    const name = newGroupName.trim();
    if (!name) {
      setIsAddingGroup(false);
      setNewGroupName("");
      return;
    }
    addGroup.mutate(name);
  }

  return (
    <div className="flex flex-col h-full bg-[#111111]">
      {/* Board header */}
      <div className="px-8 pt-5 pb-4 bg-[#141414] border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none">{board.icon ?? "📋"}</span>
          <h1 className="text-lg font-semibold text-white/90 tracking-tight">{board.name}</h1>
        </div>
      </div>

      {/* Board body */}
      <div className="flex-1 overflow-auto px-8 py-6">
        {board.groups.length === 0 && !isAddingGroup ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <p className="text-white/25 text-sm">This project has no groups yet</p>
            <button
              onClick={openAddGroup}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[#5b9cf6] border border-[#5b9cf6]/25 rounded-lg hover:bg-[#5b9cf6]/10 transition-colors"
            >
              <Plus size={14} />
              Add group
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-5 min-w-max">
              {board.groups.map((group) => (
                <GroupRow
                  key={group.id}
                  group={group}
                  columns={board.columns}
                  boardId={board.id}
                  boardName={board.name}
                  boardIcon={board.icon ?? null}
                  boardColor={board.color ?? null}
                />
              ))}
            </div>

            {isAddingGroup ? (
              <input
                ref={inputRef}
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitGroup();
                  if (e.key === "Escape") {
                    setIsAddingGroup(false);
                    setNewGroupName("");
                  }
                }}
                onBlur={submitGroup}
                placeholder="Group name"
                className="mt-4 block px-3 py-2 text-sm bg-[#1e1e1e] border border-[#5b9cf6]/40 text-white/90 rounded-lg outline-none focus:border-[#5b9cf6]/70 focus:ring-2 focus:ring-[#5b9cf6]/10 w-64 placeholder:text-white/20 transition-all"
                disabled={addGroup.isPending}
              />
            ) : (
              <button
                onClick={openAddGroup}
                className="mt-4 flex items-center gap-2 px-3 py-2 text-sm text-white/30 hover:text-white/60 hover:bg-white/[0.04] border border-dashed border-white/[0.1] rounded-lg transition-colors"
              >
                <Plus size={13} />
                Add group
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
