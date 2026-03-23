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

  const addGroup = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId: board.id, name, color: "#0073ea" }),
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

  function handleAddGroup() {
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
    <div className="flex flex-col h-full">
      {/* Board header */}
      <div className="px-8 pt-7 pb-4 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{board.icon ?? "📋"}</span>
          <h1 className="text-2xl font-semibold text-gray-800">{board.name}</h1>
        </div>
      </div>

      {/* Board body */}
      <div className="flex-1 overflow-auto p-8">
        {board.groups.length === 0 && !isAddingGroup ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-3">Add a group to get started</p>
            <button
              onClick={handleAddGroup}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Add group
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-6 min-w-max">
              {board.groups.map((group) => (
                <GroupRow key={group.id} group={group} columns={board.columns} boardId={board.id} />
              ))}
            </div>

            {/* Inline add group input */}
            {isAddingGroup ? (
              <div className="mt-4">
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
                  className="px-3 py-2 text-sm border border-blue-400 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 w-64"
                  disabled={addGroup.isPending}
                />
              </div>
            ) : (
              <button
                onClick={handleAddGroup}
                className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-white border border-dashed border-gray-300 rounded-lg transition-colors"
              >
                <Plus size={14} />
                Add group
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
