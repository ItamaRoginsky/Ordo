"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, MoreVertical, Trash2 } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { Item, Column, ColumnValue } from "@prisma/client";

type ItemWithValues = Item & { columnValues: ColumnValue[] };

function CellValue({ type, value }: { type: string; value: unknown }) {
  if (value == null || value === "") return <span className="text-gray-300">—</span>;

  switch (type) {
    case "status":
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          {String(value)}
        </span>
      );
    case "checkbox":
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          readOnly
          className="w-4 h-4 accent-blue-600 cursor-default"
        />
      );
    case "date":
      return <span className="text-gray-600 text-xs">{String(value)}</span>;
    default:
      return <span className="text-gray-700 text-sm">{String(value)}</span>;
  }
}

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

  const renameItem = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to rename item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete item");
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["board", boardId] });
      const prev = queryClient.getQueryData(["board", boardId]);
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
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(["board", boardId], context.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });

  function startEditing() {
    setEditName(item.name);
    setIsEditing(true);
  }

  function submitRename() {
    setIsEditing(false);
    const name = editName.trim();
    if (!name || name === item.name) {
      setEditName(item.name);
      return;
    }
    renameItem.mutate(name);
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
    <div className="flex items-center border-b border-gray-100 hover:bg-blue-50/40 group transition-colors">
      <div className="w-80 shrink-0 px-4 py-2.5 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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
            className="flex-1 text-sm text-gray-800 px-1 py-0 border border-blue-400 rounded outline-none focus:ring-2 focus:ring-blue-200"
          />
        ) : (
          <span
            className="text-sm text-gray-800 truncate cursor-pointer hover:text-blue-600 flex items-center gap-1.5"
            onClick={startEditing}
          >
            {item.name}
            <Pencil size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </span>
        )}
      </div>
      {columns.map((col) => (
        <div key={col.id} className="w-36 shrink-0 px-3 py-2.5 flex items-center justify-center">
          <CellValue type={col.type} value={getCellValue(col.id)} />
        </div>
      ))}
      {/* Kebab menu */}
      <div className="px-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <MoreVertical size={14} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[140px] bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50"
              sideOffset={5}
            >
              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 cursor-pointer outline-none"
                onSelect={() => deleteItem.mutate()}
              >
                <Trash2 size={14} />
                Delete item
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
}
