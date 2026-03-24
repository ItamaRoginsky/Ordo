"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Trash2, GripVertical } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { Item, Column, ColumnValue } from "@prisma/client";
import { StatusCell } from "@/components/columns/StatusCell";
import { PriorityCell } from "@/components/columns/PriorityCell";
import { DateCell } from "@/components/columns/DateCell";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { format, isPast, parseISO } from "date-fns";

type ItemWithValues = Item & {
  columnValues: ColumnValue[];
  subItems?: (Item & { columnValues: ColumnValue[] })[];
};

const PRIORITY_DOT: Record<string, string> = {
  p1: "#ef4444",
  p2: "#f97316",
  p3: "#5b9cf6",
  p4: "#6b7280",
};

export function ItemRow({
  item,
  columns,
  boardId,
  boardName,
  boardIcon,
  boardColor,
  dragHandleProps,
}: {
  item: ItemWithValues;
  columns: Column[];
  boardId: string;
  boardName?: string;
  boardIcon?: string | null;
  boardColor?: string | null;
  dragHandleProps?: Record<string, unknown>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [detailOpen, setDetailOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["board", boardId] });
  }

  const patchItem = async (patch: Record<string, unknown>) => {
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    invalidate();
  };

  const deleteItem = async () => {
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
    if (!name || name === item.name) { setEditName(item.name); return; }
    patchItem({ name });
  }

  function getCellValue(columnId: string) {
    const cv = item.columnValues.find((v) => v.columnId === columnId);
    if (!cv) return null;
    try { return JSON.parse(cv.value); } catch { return cv.value; }
  }

  const deadlineDate = item.deadline ? (typeof item.deadline === "string" ? parseISO(item.deadline) : item.deadline as Date) : null;
  const deadlineOverdue = deadlineDate && !item.completedAt && isPast(deadlineDate);

  return (
    <>
      <div className="flex items-center group transition-colors min-h-[40px]" style={{ borderBottom: "1px solid var(--border)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
        {/* Drag handle */}
        <div
          className="pl-2 pr-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-grab"
          style={{ color: "var(--text-4)" }}
          {...(dragHandleProps as React.HTMLAttributes<HTMLDivElement>)}
        >
          <GripVertical size={13} />
        </div>
        {/* Name cell */}
        <div className="w-72 shrink-0 px-3 py-2 flex items-center gap-2 min-w-0">
          {/* Priority dot */}
          {item.priority && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: PRIORITY_DOT[item.priority] ?? "#6b7280" }}
            />
          )}

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                ref={inputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitRename();
                  if (e.key === "Escape") { setEditName(item.name); setIsEditing(false); }
                }}
                onBlur={submitRename}
                className="w-full text-sm px-2 py-0.5 rounded-lg outline-none transition-colors"
                style={{ color: "var(--text-1)", background: "var(--bg-popover)", border: "1px solid var(--accent)" }}
              />
            ) : (
              <div>
                <span
                  onClick={() => setDetailOpen(true)}
                  className="text-sm truncate cursor-pointer transition-colors block"
                  style={{ color: item.completedAt ? "var(--text-4)" : "var(--text-2)", textDecoration: item.completedAt ? "line-through" : "none" }}
                >
                  {item.name}
                </span>
                {(item as any).description && (
                  <span className="text-[11px] truncate block leading-tight" style={{ color: "var(--text-4)" }}>
                    {(item as any).description}
                  </span>
                )}
              </div>
            )}
          </div>

          {deadlineDate && (
            <span
              className="text-[10px] shrink-0 px-1.5 py-0.5 rounded border"
              style={{
                color: deadlineOverdue ? "var(--sys-red)" : "var(--text-4)",
                borderColor: deadlineOverdue ? "rgba(239,68,68,0.4)" : "var(--border)",
                background: deadlineOverdue ? "rgba(239,68,68,0.1)" : "transparent",
              }}
            >
              {format(deadlineDate, "MMM d")}
            </span>
          )}
        </div>

        {/* Column cells */}
        {columns.map((col) => {
          const val = getCellValue(col.id);
          return (
            <div key={col.id} className="w-36 shrink-0 px-2 py-1.5 flex items-center justify-center">
              {col.type === "status" ? (
                <StatusCell value={val} itemId={item.id} columnId={col.id} onSuccess={invalidate} />
              ) : col.type === "priority" ? (
                <PriorityCell value={val} itemId={item.id} columnId={col.id} onSuccess={invalidate} />
              ) : col.type === "date" ? (
                <DateCell
                  value={val}
                  itemId={item.id}
                  columnId={col.id}
                  completedAt={item.completedAt instanceof Date ? item.completedAt.toISOString() : (item.completedAt ?? null)}
                  onSuccess={invalidate}
                />
              ) : col.type === "checkbox" ? (
                <input type="checkbox" checked={Boolean(val)} readOnly className="w-4 h-4 cursor-default" style={{ accentColor: "var(--chart-primary)" }} />
              ) : (
                <span className="text-sm truncate" style={{ color: "var(--text-3)" }}>
                  {val != null && val !== "" ? String(val) : <span style={{ color: "var(--text-4)" }}>—</span>}
                </span>
              )}
            </div>
          );
        })}

        {/* Kebab */}
        <div className="px-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="p-1 rounded transition-colors" style={{ color: "var(--text-4)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-4)"; }}
              >
                <MoreHorizontal size={14} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[160px] rounded-xl shadow-2xl p-1 z-50"
              style={{ background: "var(--bg-popover)", border: "1px solid var(--border-strong)" }}
                sideOffset={6}
              >
                <DropdownMenu.Item
                  className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg cursor-pointer outline-none transition-colors"
                  style={{ color: "var(--text-2)" }}
                  onSelect={() => setDetailOpen(true)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  Open detail
                </DropdownMenu.Item>
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

      {/* Task detail panel */}
      {detailOpen && (
        <TaskDetailPanel
          item={{
            ...item,
            description: (item as any).description ?? null,
            deadline: (item as any).deadline
              ? (item as any).deadline instanceof Date
                ? (item as any).deadline.toISOString()
                : (item as any).deadline
              : null,
            completedAt: item.completedAt instanceof Date
              ? item.completedAt.toISOString()
              : (item.completedAt ?? null),
            scheduledDate: item.scheduledDate instanceof Date
              ? item.scheduledDate.toISOString()
              : (item.scheduledDate ?? null),
            priority: item.priority ?? null,
            category: (item as any).category ?? null,
            group: { board: { id: boardId, name: boardName ?? "Project", color: boardColor ?? null, icon: boardIcon ?? null } },
            subItems: (item.subItems ?? []).map((s) => ({
              ...s,
              completedAt: s.completedAt instanceof Date ? s.completedAt.toISOString() : (s.completedAt ?? null),
              priority: (s as any).priority ?? null,
            })),
          }}
          onClose={() => setDetailOpen(false)}
          onUpdate={async (id, patch) => {
            await fetch(`/api/items/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(patch),
            });
            invalidate();
          }}
          onDelete={async (id) => {
            await fetch(`/api/items/${id}`, { method: "DELETE" });
            invalidate();
            setDetailOpen(false);
          }}
          onAddSubTask={async (parentId, name) => {
            await fetch("/api/items", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ groupId: item.groupId, name, parentId }),
            });
            invalidate();
          }}
          onAddCustomField={async (bId, name, type) => {
            await fetch("/api/custom-fields", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ boardId: bId, name, type }),
            });
            queryClient.invalidateQueries({ queryKey: ["board", boardId] });
          }}
          onUpdateCustomFieldValue={async (itemId, fieldId, value) => {
            await fetch("/api/custom-field-values", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ itemId, fieldId, value }),
            });
            queryClient.invalidateQueries({ queryKey: ["board", boardId] });
          }}
        />
      )}
    </>
  );
}
