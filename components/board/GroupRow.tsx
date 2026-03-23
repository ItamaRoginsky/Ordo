"use client";

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Plus, MoreHorizontal, Trash2 } from "lucide-react";
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
  const storageKey = `ordo-collapsed-${group.id}`;
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(storageKey) === "true"
  );
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const color = group.color ?? "#5b9cf6";

  function toggleCollapse() {
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
    onError: (_err, _name, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["board", boardId], ctx.prev);
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

  function openAddItem() {
    setIsAddingItem(true);
    setTimeout(() => addInputRef.current?.focus(), 0);
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
    setTimeout(() => addInputRef.current?.focus(), 0);
  }

  return (
    <div className="min-w-[640px]">
      {/* Group header */}
      <div className="flex items-center gap-2 mb-1.5 pl-1 group/hdr">
        <button
          onClick={toggleCollapse}
          className="text-white/20 hover:text-white/60 transition-colors p-0.5 rounded"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        </button>
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <h3
          className="text-sm font-semibold"
          style={{ color }}
        >
          {group.name}
        </h3>
        <span className="text-xs text-white/20">{group.items.length}</span>

        {/* Kebab menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="ml-1 p-1 rounded opacity-0 group-hover/hdr:opacity-100 hover:bg-white/[0.06] text-white/30 hover:text-white/70 transition-all">
              <MoreHorizontal size={14} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[180px] bg-[#252525] border border-white/[0.09] rounded-xl shadow-2xl p-1 z-50"
              sideOffset={6}
            >
              <DropdownMenu.Item
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/10 cursor-pointer outline-none transition-colors"
                onSelect={() => {
                  if (confirm(`Delete "${group.name}" and all ${group.items.length} items?`))
                    deleteGroup.mutate();
                }}
              >
                <Trash2 size={13} />
                Delete group
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Collapsible table */}
      <div
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{ maxHeight: collapsed ? 0 : "9999px", opacity: collapsed ? 0 : 1 }}
      >
        <div
          className="ml-4 rounded-xl overflow-hidden border border-white/[0.07] bg-[#1c1c1c]"
          style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.35)" }}
        >
          <div className="relative">
            {/* Left color accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px]"
              style={{ backgroundColor: color }}
            />
            <div className="pl-[3px]">
              <ColHeaders columns={columns} />
              {group.items.map((item) => (
                <ItemRow key={item.id} item={item} columns={columns} boardId={boardId} />
              ))}
              {/* Add item row */}
              {isAddingItem ? (
                <div className="flex items-center gap-2 px-5 py-2 border-t border-white/[0.05]">
                  <input
                    ref={addInputRef}
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
                    className="flex-1 px-2 py-1 text-sm bg-[#252525] border border-[#5b9cf6]/40 text-white/90 rounded-lg outline-none focus:border-[#5b9cf6]/70 focus:ring-2 focus:ring-[#5b9cf6]/10 placeholder:text-white/20 transition-all"
                    disabled={addItem.isPending}
                  />
                </div>
              ) : (
                <div
                  onClick={openAddItem}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm text-white/25 hover:text-white/50 hover:bg-white/[0.02] cursor-pointer transition-colors border-t border-white/[0.05]"
                >
                  <Plus size={13} />
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
