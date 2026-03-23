"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Plus, MoreVertical, Trash2 } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { Group, Item, Column, ColumnValue } from "@prisma/client";
import { ColHeaders } from "./ColHeaders";
import { ItemRow } from "./ItemRow";

type ItemWithValues = Item & { columnValues: ColumnValue[] };
type GroupWithItems = Group & { items: ItemWithValues[] };

export function GroupRow({
  group,
  columns,
  boardId,
}: {
  group: GroupWithItems;
  columns: Column[];
  boardId: string;
}) {
  const storageKey = `ordo-group-collapsed-${group.id}`;
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(storageKey) === "true";
  });
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const color = group.color ?? "#0073ea";

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(storageKey, String(next));
  }

  const addItem = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: group.id, name }),
      });
      if (!res.ok) throw new Error("Failed to create item");
      return res.json();
    },
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: ["board", boardId] });
      const prev = queryClient.getQueryData(["board", boardId]);
      queryClient.setQueryData(["board", boardId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          groups: old.groups.map((g: any) =>
            g.id === group.id
              ? {
                  ...g,
                  items: [
                    ...g.items,
                    {
                      id: `temp-${Date.now()}`,
                      groupId: group.id,
                      name,
                      notes: null,
                      position: g.items.length,
                      assigneeId: null,
                      columnValues: [],
                    },
                  ],
                }
              : g
          ),
        };
      });
      return { prev };
    },
    onError: (_err, _name, context) => {
      if (context?.prev) queryClient.setQueryData(["board", boardId], context.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/groups/${group.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete group");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });

  function handleAddItemClick() {
    setIsAddingItem(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function submitItem() {
    const name = newItemName.trim();
    if (!name) {
      setIsAddingItem(false);
      setNewItemName("");
      return;
    }
    addItem.mutate(name);
    setNewItemName("");
    // Keep the input open for rapid entry
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleDeleteGroup() {
    if (!confirm(`Delete group "${group.name}" and all ${group.items.length} items?`)) return;
    deleteGroup.mutate();
  }

  return (
    <div>
      {/* Group header */}
      <div className="flex items-center gap-2 mb-1 px-1 group/header">
        <button
          onClick={toggleCollapsed}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
        </button>
        <h3
          className="text-sm font-semibold px-2 py-0.5 rounded"
          style={{ color }}
        >
          {group.name}
        </h3>
        <span className="text-xs text-gray-400">{group.items.length} items</span>

        {/* Kebab menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="ml-1 p-1 rounded opacity-0 group-hover/header:opacity-100 hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-600">
              <MoreVertical size={14} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[160px] bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50"
              sideOffset={5}
            >
              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 cursor-pointer outline-none"
                onSelect={handleDeleteGroup}
              >
                <Trash2 size={14} />
                Delete group
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Collapsible body */}
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{
          maxHeight: collapsed ? 0 : "9999px",
          opacity: collapsed ? 0 : 1,
        }}
      >
        <div className="ml-5 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
          {/* Left color strip */}
          <div className="relative">
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-tl-xl rounded-bl-xl"
              style={{ backgroundColor: color }}
            />
            <div className="pl-1">
              <ColHeaders columns={columns} />
              {group.items.map((item) => (
                <ItemRow key={item.id} item={item} columns={columns} boardId={boardId} />
              ))}
              {/* Add item row */}
              {isAddingItem ? (
                <div className="flex items-center gap-2 px-4 py-2">
                  <input
                    ref={inputRef}
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitItem();
                      if (e.key === "Escape") {
                        setIsAddingItem(false);
                        setNewItemName("");
                      }
                    }}
                    onBlur={submitItem}
                    placeholder="Item name"
                    className="flex-1 px-2 py-1 text-sm border border-blue-400 rounded outline-none focus:ring-2 focus:ring-blue-200"
                    disabled={addItem.isPending}
                  />
                </div>
              ) : (
                <div
                  onClick={handleAddItemClick}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <Plus size={14} />
                  Add item
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
