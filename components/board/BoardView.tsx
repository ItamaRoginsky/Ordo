"use client";

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Board, Group, Item, Column, ColumnValue } from "@prisma/client";
import { GroupRow } from "./GroupRow";
import { KanbanView } from "./KanbanView";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

type ItemWithValues = Item & { columnValues: ColumnValue[] };
type GroupWithItems = Group & { items: ItemWithValues[] };
export type BoardWithData = Board & { groups: GroupWithItems[]; columns: Column[] };

function DroppableGroup({ groupId, children }: { groupId: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: groupId, data: { groupId } });
  return (
    <div
      ref={setNodeRef}
      style={{
        outline: isOver ? "2px solid var(--chart-primary)" : "2px solid transparent",
        borderRadius: 12,
        transition: "outline 0.15s",
      }}
    >
      {children}
    </div>
  );
}

export function BoardView({ board }: { board: BoardWithData }) {
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [kanbanDetailItem, setKanbanDetailItem] = useState<(Item & { columnValues: ColumnValue[] }) | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "kanban">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(`ordo-view-${board.id}`) as "table" | "kanban") ?? "table";
    }
    return "table";
  });
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleCrossGroupDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const allItems = board.groups.flatMap((g) => g.items);
    const activeItem = allItems.find((i) => i.id === active.id);
    if (!activeItem) return;

    // Determine target group
    const overGroupId = (over.data.current?.groupId as string | undefined) ?? over.id as string;
    const overGroup = board.groups.find((g) => g.id === overGroupId);
    if (!overGroup) return;

    if (activeItem.groupId === overGroupId) {
      // Same-group reorder
      const group = board.groups.find((g) => g.id === overGroupId)!;
      const oldIndex = group.items.findIndex((i) => i.id === active.id);
      const newIndex = group.items.findIndex((i) => i.id === over.id);
      if (oldIndex === newIndex || newIndex === -1) return;
      const reordered = arrayMove(group.items, oldIndex, newIndex);

      // Optimistic update
      queryClient.setQueryData(["board", board.id], (old: any) => ({
        ...old,
        groups: old.groups.map((g: any) =>
          g.id === overGroupId ? { ...g, items: reordered } : g
        ),
      }));

      await fetch(`/api/groups/${overGroupId}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: reordered.map((i) => i.id) }),
      });
    } else {
      // Cross-group move
      queryClient.setQueryData(["board", board.id], (old: any) => ({
        ...old,
        groups: old.groups.map((g: any) => {
          if (g.id === activeItem.groupId) {
            return { ...g, items: g.items.filter((i: any) => i.id !== activeItem.id) };
          }
          if (g.id === overGroupId) {
            return { ...g, items: [{ ...activeItem, groupId: overGroupId }, ...g.items] };
          }
          return g;
        }),
      }));

      await fetch(`/api/items/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: overGroupId, position: 0 }),
      });
    }

    queryClient.invalidateQueries({ queryKey: ["board", board.id] });
  }
  const inputRef = useRef<HTMLInputElement>(null);

  const GROUP_ACCENT_COLORS = [
    "#9EC5F7", "#BFB0EE", "#F0A8CC", "#F2BAA4", "#9ED4B4", "#8ED2CA",
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
    <div className="flex flex-col h-full" style={{ background: "var(--bg-page)" }}>
      {/* Board header */}
      <div className="px-8 pt-5 pb-4 shrink-0" style={{ background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl leading-none">{board.icon ?? "📋"}</span>
            <h1 className="text-lg font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>{board.name}</h1>
          </div>
          {/* View toggle */}
          <div style={{ display: "flex", gap: 2, padding: 3, background: "var(--bg-active)", borderRadius: 8 }}>
            {(["table", "kanban"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setViewMode(mode);
                  localStorage.setItem(`ordo-view-${board.id}`, mode);
                }}
                style={{
                  padding: "4px 12px", borderRadius: 6, fontSize: 12,
                  background: viewMode === mode ? "var(--bg-card)" : "transparent",
                  color: viewMode === mode ? "var(--text-1)" : "var(--text-3)",
                  border: "none", cursor: "pointer", fontFamily: "inherit",
                  boxShadow: viewMode === mode ? "var(--card-shadow)" : "none",
                  textTransform: "capitalize",
                  transition: "background 0.12s, color 0.12s",
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban card detail modal */}
      {kanbanDetailItem && (() => {
        const group = board.groups.find((g) => g.items.some((i) => i.id === kanbanDetailItem.id));
        return (
          <TaskDetailModal
            item={{
              ...kanbanDetailItem,
              description: (kanbanDetailItem as any).description ?? null,
              deadline: (kanbanDetailItem as any).deadline
                ? (kanbanDetailItem as any).deadline instanceof Date
                  ? (kanbanDetailItem as any).deadline.toISOString()
                  : (kanbanDetailItem as any).deadline
                : null,
              scheduledDate: (kanbanDetailItem as any).scheduledDate
                ? (kanbanDetailItem as any).scheduledDate instanceof Date
                  ? (kanbanDetailItem as any).scheduledDate.toISOString()
                  : (kanbanDetailItem as any).scheduledDate
                : null,
              completedAt: kanbanDetailItem.completedAt instanceof Date
                ? kanbanDetailItem.completedAt.toISOString()
                : (kanbanDetailItem.completedAt ?? null),
              priority: (kanbanDetailItem as any).priority ?? null,
              category: (kanbanDetailItem as any).category ?? null,
              groupId: group?.id ?? "",
              group: { board: { id: board.id, name: board.name, color: board.color ?? null, icon: board.icon ?? null } },
              subItems: [],
            }}
            onClose={() => setKanbanDetailItem(null)}
            onUpdate={async (id, patch) => {
              await fetch(`/api/items/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
              });
              queryClient.invalidateQueries({ queryKey: ["board", board.id] });
            }}
            onDelete={async (id) => {
              await fetch(`/api/items/${id}`, { method: "DELETE" });
              queryClient.invalidateQueries({ queryKey: ["board", board.id] });
              setKanbanDetailItem(null);
            }}
          />
        );
      })()}

      {/* Board body */}
      <div className="flex-1 overflow-auto px-8 py-6">
        {viewMode === "kanban" ? (
          <KanbanView board={board} onOpenDetail={(item) => setKanbanDetailItem(item)} />
        ) : board.groups.length === 0 && !isAddingGroup ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <p className="text-sm" style={{ color: "var(--text-4)" }}>This project has no groups yet</p>
            <button
              onClick={openAddGroup}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors"
              style={{ color: "var(--chart-primary)", border: "1px solid var(--border)", background: "transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--accent-subtle)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Plus size={14} />
              Add group
            </button>
          </div>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleCrossGroupDragEnd}
            >
            <div className="space-y-5 min-w-max">
              {board.groups.map((group) => (
                <DroppableGroup key={group.id} groupId={group.id}>
                  <GroupRow
                    group={group}
                    columns={board.columns}
                    boardId={board.id}
                    boardName={board.name}
                    boardIcon={board.icon ?? null}
                    boardColor={board.color ?? null}
                  />
                </DroppableGroup>
              ))}
            </div>
            </DndContext>

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
                className="mt-4 block px-3 py-2 text-sm rounded-lg outline-none w-64 transition-all"
                style={{ background: "var(--bg-input)", border: "1px solid var(--accent)", color: "var(--text-1)" }}
                disabled={addGroup.isPending}
              />
            ) : (
              <button
                onClick={openAddGroup}
                className="mt-4 flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors"
                style={{ color: "var(--text-4)", border: "1px dashed var(--border)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-4)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
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
