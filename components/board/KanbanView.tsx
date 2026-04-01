"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, isPast } from "date-fns";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCorners,
} from "@dnd-kit/core";
import type { Board, Group, Item, Column, ColumnValue } from "@prisma/client";

type ItemWithValues = Item & { columnValues: ColumnValue[] };
type GroupWithItems = Group & { items: ItemWithValues[] };
export type BoardWithData = Board & { groups: GroupWithItems[]; columns: Column[] };

const KANBAN_COLUMNS = [
  { value: "not_started", label: "Not started", color: "#94a3b8" },
  { value: "in_progress", label: "In progress", color: "#5b9cf6" },
  { value: "review",      label: "In review",   color: "#f59e0b" },
  { value: "stuck",       label: "Stuck",       color: "#ef4444" },
  { value: "done",        label: "Done",        color: "#22c55e" },
];

const PRIORITY_COLORS: Record<string, string> = {
  p1: "#ef4444", p2: "#f97316", p3: "#5b9cf6", p4: "#6b7280",
};

function getItemStatus(item: ItemWithValues, statusColumnId: string | undefined): string {
  // Completed items always go to the Done column
  if (item.completedAt) return "done";
  if (!statusColumnId) return "not_started";
  const cv = item.columnValues.find((v) => v.columnId === statusColumnId);
  if (!cv) return "not_started";
  try {
    const val = JSON.parse(cv.value);
    return typeof val === "string" ? val : "not_started";
  } catch {
    return "not_started";
  }
}

function DroppableColumn({
  colValue,
  isOver,
  children,
}: {
  colValue: string;
  isOver: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: colValue });
  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minHeight: 120,
        borderRadius: 8,
        padding: "2px 0",
        background: isOver ? "var(--bg-active)" : "transparent",
        transition: "background 0.12s",
      }}
    >
      {children}
    </div>
  );
}

// Draggable wraps the card — listeners on the whole card, distance:8 keeps clicks working
function DraggableCard({
  item,
  onOpenDetail,
}: {
  item: ItemWithValues;
  onOpenDetail: (item: ItemWithValues) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        opacity: isDragging ? 0.35 : 1,
        cursor: "grab",
        touchAction: "none",
        marginBottom: 6,
        outline: "none",
      }}
      onClick={() => onOpenDetail(item)}
    >
      <KanbanCard item={item} />
    </div>
  );
}

function KanbanCard({ item }: { item: ItemWithValues }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "10px 12px",
        cursor: "pointer",
        transition: "border-color 0.15s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease",
        opacity: item.completedAt ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.14)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "var(--text-1)",
          marginBottom: 6,
          lineHeight: 1.4,
          textDecoration: item.completedAt ? "line-through" : "none",
        }}
      >
        {item.name}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {item.priority && item.priority !== "p4" && (
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              flexShrink: 0,
              background: PRIORITY_COLORS[item.priority] ?? "#6b7280",
            }}
          />
        )}
        {item.completedAt && (
          <span style={{ fontSize: 9, color: "#22c55e" }}>✓ Done</span>
        )}
        {item.deadline && !item.completedAt && (
          <span
            style={{
              fontSize: 9,
              marginLeft: "auto",
              flexShrink: 0,
              color: isPast(new Date(item.deadline)) ? "#ef4444" : "var(--text-3)",
            }}
          >
            {format(new Date(item.deadline), "MMM d")}
          </span>
        )}
      </div>
    </div>
  );
}

export function KanbanView({
  board,
  onOpenDetail,
}: {
  board: BoardWithData;
  onOpenDetail: (item: ItemWithValues) => void;
}) {
  const queryClient = useQueryClient();
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const statusColumn = board.columns.find((c) => c.type === "status");
  // Include ALL items (including completed) — completed go to Done column
  const allItems = board.groups.flatMap((g) => g.items);

  function getItemsForColumn(colValue: string) {
    return allItems.filter((item) => getItemStatus(item, statusColumn?.id) === colValue);
  }

  const draggingItem = draggingId ? allItems.find((i) => i.id === draggingId) ?? null : null;

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setDraggingId(null);
    setOverColumn(null);
    if (!over || !statusColumn) return;

    const newStatus = over.id as string;
    const itemId = active.id as string;
    const draggedItem = allItems.find((i) => i.id === itemId);
    if (!draggedItem) return;

    const currentStatus = getItemStatus(draggedItem, statusColumn.id);
    if (currentStatus === newStatus) return;

    // If dragged to done column, mark as completed; if dragged out of done, clear completedAt
    const patch: Record<string, unknown> = {};
    if (newStatus === "done" && !draggedItem.completedAt) {
      patch.completedAt = new Date().toISOString();
    } else if (newStatus !== "done" && draggedItem.completedAt) {
      patch.completedAt = null;
    }

    // Optimistic update
    queryClient.setQueryData(["board", board.id], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        groups: old.groups.map((g: any) => ({
          ...g,
          items: g.items.map((item: any) => {
            if (item.id !== itemId) return item;
            const updated = { ...item, ...patch };
            if (newStatus !== "done") {
              const existingCV = item.columnValues.find((cv: any) => cv.columnId === statusColumn.id);
              if (existingCV) {
                updated.columnValues = item.columnValues.map((cv: any) =>
                  cv.columnId === statusColumn.id ? { ...cv, value: JSON.stringify(newStatus) } : cv
                );
              } else {
                updated.columnValues = [
                  ...item.columnValues,
                  { id: `temp-${Date.now()}`, itemId, columnId: statusColumn.id, value: JSON.stringify(newStatus) },
                ];
              }
            }
            return updated;
          }),
        })),
      };
    });

    // Persist
    if (Object.keys(patch).length > 0) {
      await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    }
    if (newStatus !== "done") {
      await fetch("/api/column-values", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, columnId: statusColumn.id, value: newStatus }),
      });
    }
    queryClient.invalidateQueries({ queryKey: ["board", board.id] });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e: DragStartEvent) => setDraggingId(e.active.id as string)}
      onDragOver={(e) => setOverColumn(e.over?.id as string ?? null)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => { setDraggingId(null); setOverColumn(null); }}
    >
      <div style={{ display: "flex", gap: 12, height: "100%", minHeight: "calc(100vh - 140px)", alignItems: "flex-start" }}>
        {KANBAN_COLUMNS.map((col, colIdx) => {
          const colItems = getItemsForColumn(col.value);
          return (
            <div
              key={col.value}
              style={{
                flex: 1, minWidth: 160, display: "flex", flexDirection: "column",
                animation: `fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${colIdx * 60}ms both`,
              }}
            >
              {/* Column header */}
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "0 4px 10px",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-1)" }}>{col.label}</span>
                <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 2 }}>{colItems.length}</span>
              </div>

              <DroppableColumn colValue={col.value} isOver={overColumn === col.value}>
                {colItems.map((item) => (
                  <DraggableCard
                    key={item.id}
                    item={item}
                    onOpenDetail={onOpenDetail}
                  />
                ))}
              </DroppableColumn>
            </div>
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {draggingItem && <KanbanCard item={draggingItem} />}
      </DragOverlay>
    </DndContext>
  );
}
