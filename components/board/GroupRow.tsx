"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Plus, MoreHorizontal, Trash2, Pencil } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { Group, Item, Column, ColumnValue } from "@prisma/client";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ColHeaders } from "./ColHeaders";
import { ItemRow } from "./ItemRow";
import { BOARD_ROW_GRID, MOBILE_ROW_GRID } from "@/lib/board-layout";
import { useIsMobile } from "@/hooks/useIsMobile";

type ItemWithValues = Item & { columnValues: ColumnValue[] };
type GroupWithItems = Group & { items: ItemWithValues[] };

function SortableItemRow({
  item,
  columns,
  boardId,
  boardName,
  boardIcon,
  boardColor,
  groupId,
}: {
  item: ItemWithValues;
  columns: Column[];
  boardId: string;
  boardName?: string;
  boardIcon?: string | null;
  boardColor?: string | null;
  groupId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { groupId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ItemRow
        item={item}
        columns={columns}
        boardId={boardId}
        boardName={boardName}
        boardIcon={boardIcon}
        boardColor={boardColor}
      />
    </div>
  );
}

export function GroupRow({
  group,
  columns,
  boardId,
  boardName,
  boardIcon,
  boardColor,
}: {
  group: GroupWithItems;
  columns: Column[];
  boardId: string;
  boardName?: string;
  boardIcon?: string | null;
  boardColor?: string | null;
}) {
  const storageKey = `ordo-collapsed-${group.id}`;
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(storageKey) === "true"
  );
  const [items, setItems] = useState(group.items);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(group.name);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const rowGrid = isMobile ? MOBILE_ROW_GRID : BOARD_ROW_GRID;
  const color = group.color ?? "#9EC5F7";

  const prevGroupItems = useRef(group.items);
  useEffect(() => {
    if (group.items !== prevGroupItems.current) {
      prevGroupItems.current = group.items;
      setItems(group.items);
    }
  }, [group.items]);

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

  const renameGroup = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to rename group");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board", boardId] }),
  });

  function startRename() {
    setDraftName(group.name);
    setIsRenaming(true);
    setTimeout(() => { renameInputRef.current?.focus(); renameInputRef.current?.select(); }, 0);
  }

  function commitRename() {
    setIsRenaming(false);
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== group.name) renameGroup.mutate(trimmed);
    else setDraftName(group.name);
  }

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
          style={{ color: "var(--text-4)" }}
          className="hover:opacity-80 transition-opacity p-0.5 rounded"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        </button>
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        {isRenaming ? (
          <input
            ref={renameInputRef}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); commitRename(); }
              if (e.key === "Escape") { setIsRenaming(false); setDraftName(group.name); }
            }}
            className="text-sm font-semibold bg-transparent outline-none border-b"
            style={{ color, borderColor: color, minWidth: 60, maxWidth: 240 }}
          />
        ) : (
          <h3
            className="text-sm font-semibold cursor-text"
            style={{ color }}
            onDoubleClick={startRename}
            title="Double-click to rename"
          >
            {group.name}
          </h3>
        )}
        <span className="text-xs" style={{ color: "var(--text-4)" }}>{items.length}</span>
        {items.length > 0 && (() => {
          const done = items.filter((i: any) => i.completedAt).length;
          const pct = Math.round((done / items.length) * 100);
          return (
            <div className="flex items-center gap-1.5 ml-2">
              <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
              <span className="text-[10px]" style={{ color: "var(--text-4)" }}>{pct}%</span>
            </div>
          );
        })()}

        {/* Kebab menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="ml-1 p-1 rounded opacity-0 group-hover/hdr:opacity-100 transition-all"
              style={{ color: "var(--text-3)", background: "transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}
            >
              <MoreHorizontal size={14} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              style={{ minWidth: 180, background: "var(--bg-popover)", border: "1px solid var(--border-strong)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.24)", padding: 4, zIndex: 50 }}
              sideOffset={6}
            >
              <DropdownMenu.Item
                className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg cursor-pointer outline-none transition-colors"
                style={{ color: "var(--text-2)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                onSelect={startRename}
              >
                <Pencil size={13} />
                Rename group
              </DropdownMenu.Item>
              <DropdownMenu.Separator style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
              <DropdownMenu.Item
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/10 cursor-pointer outline-none transition-colors"
                onSelect={() => {
                  if (confirm(`Delete "${group.name}" and all ${items.length} items?`))
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
        className="transition-all duration-200 ease-out"
        style={{ maxHeight: collapsed ? 0 : "9999px", opacity: collapsed ? 0 : 1, overflow: collapsed ? "hidden" : "visible" }}
      >
        <div
          className="ml-4 rounded-xl"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <div className="relative">
            {/* Left color accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: color }} />
            <div className="pl-[3px]">
              <ColHeaders />
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                {items.map((item) => (
                  <SortableItemRow
                    key={item.id}
                    item={item}
                    columns={columns}
                    boardId={boardId}
                    boardName={boardName}
                    boardIcon={boardIcon}
                    boardColor={boardColor}
                    groupId={group.id}
                  />
                ))}
              </SortableContext>
              {/* Add item row — uses same BOARD_ROW_GRID so columns align perfectly */}
              {isAddingItem ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: BOARD_ROW_GRID,
                    alignItems: "center",
                    height: 40,
                    borderTop: "1px solid var(--border)",
                    background: "var(--bg-hover)",
                  }}
                >
                  <div />
                  <input
                    ref={addInputRef}
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitItem();
                      if (e.key === "Escape") { setIsAddingItem(false); setNewItemName(""); }
                    }}
                    onBlur={submitItem}
                    placeholder="Item name…"
                    disabled={addItem.isPending}
                    style={{
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      fontSize: 13,
                      color: "var(--text-1)",
                      fontFamily: "inherit",
                      paddingLeft: 4,
                      width: "100%",
                    }}
                  />
                  <div /><div /><div />
                </div>
              ) : (
                <div
                  onClick={openAddItem}
                  style={{
                    display: "grid",
                    gridTemplateColumns: BOARD_ROW_GRID,
                    alignItems: "center",
                    height: 36,
                    borderTop: "1px solid var(--border)",
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <div />
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "var(--text-4)",
                    paddingLeft: 4,
                  }}>
                    <Plus size={13} />
                    Add item
                  </div>
                  <div /><div /><div />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
