"use client";

import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, MoreHorizontal, Trash2 } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { Item, Column, ColumnValue } from "@prisma/client";
import { StatusCell } from "@/components/columns/StatusCell";
import { PriorityCell } from "@/components/columns/PriorityCell";
import { DateCell } from "@/components/columns/DateCell";

type ItemWithValues = Item & { columnValues: ColumnValue[] };

export function ItemRow({
  item,
  columns,
  boardId,
}: {
  item: ItemWithValues;
  columns: Column[];
  boardId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["board", boardId] });
  }

  const renameItem = async (name: string) => {
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    invalidate();
  };

  const deleteItem = async () => {
    // Optimistic removal
    queryClient.setQueryData(["board", boardId], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        groups: old.groups.map((g: any) => ({
          ...g,
          items: g.items.filter((i: any) => i.id !== item.id),
        })),
      };
    });
    await fetch(`/api/items/${item.id}`, { method: "DELETE" });
    invalidate();
  };

  function submitRename() {
    setIsEditing(false);
    const name = editName.trim();
    if (!name || name === item.name) {
      setEditName(item.name);
      return;
    }
    renameItem(name);
  }

  function getCellValue(columnId: string) {
    const cv = item.columnValues.find((v) => v.columnId === columnId);
    if (!cv) return null;
    try {
      return JSON.parse(cv.value);
    } catch {
      return cv.value;
    }
  }

  return (
    <div className="flex items-center border-b border-white/[0.05] hover:bg-white/[0.025] group transition-colors">
      {/* Name cell */}
      <div className="w-80 shrink-0 px-5 py-2.5 flex items-center gap-2.5 min-w-0">
        <span className="w-[3px] h-3.5 rounded-full bg-[#5b9cf6] opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
        {isEditing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
              if (e.key === "Escape") {
                setEditName(item.name);
                setIsEditing(false);
              }
            }}
            onBlur={submitRename}
            className="flex-1 text-sm text-white/90 bg-[#252525] border border-[#5b9cf6]/50 px-2 py-0.5 rounded-lg outline-none focus:border-[#5b9cf6]/80 transition-colors"
          />
        ) : (
          <span
            onClick={() => {
              setEditName(item.name);
              setIsEditing(true);
            }}
            className={`text-sm truncate cursor-text flex-1 flex items-center gap-1.5 hover:text-white/95 group/name transition-colors ${
              item.completedAt ? "line-through text-white/30" : "text-white/75"
            }`}
          >
            {item.name}
            <Pencil
              size={11}
              className="text-white/15 opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0"
            />
          </span>
        )}
      </div>

      {/* Column cells */}
      {columns.map((col) => {
        const val = getCellValue(col.id);
        return (
          <div key={col.id} className="w-36 shrink-0 px-2 py-1.5 flex items-center justify-center">
            {col.type === "status" ? (
              <StatusCell
                value={val}
                itemId={item.id}
                columnId={col.id}
                onSuccess={invalidate}
              />
            ) : col.type === "priority" ? (
              <PriorityCell
                value={val}
                itemId={item.id}
                columnId={col.id}
                onSuccess={invalidate}
              />
            ) : col.type === "date" ? (
              <DateCell
                value={val}
                itemId={item.id}
                columnId={col.id}
                completedAt={item.completedAt?.toISOString?.() ?? null}
                onSuccess={invalidate}
              />
            ) : col.type === "checkbox" ? (
              <input
                type="checkbox"
                checked={Boolean(val)}
                readOnly
                className="w-4 h-4 cursor-default accent-[#5b9cf6]"
              />
            ) : (
              <span className="text-white/50 text-sm truncate">
                {val != null && val !== "" ? String(val) : <span className="text-white/15">—</span>}
              </span>
            )}
          </div>
        );
      })}

      {/* Kebab */}
      <div className="px-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="p-1 rounded hover:bg-white/[0.06] text-white/25 hover:text-white/70 transition-colors">
              <MoreHorizontal size={14} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[140px] bg-[#252525] border border-white/[0.09] rounded-xl shadow-2xl p-1 z-50"
              sideOffset={6}
            >
              <DropdownMenu.Item
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/10 cursor-pointer outline-none transition-colors"
                onSelect={deleteItem}
              >
                <Trash2 size={13} />
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
}
