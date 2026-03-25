"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Trash2, Check } from "lucide-react";
import { t } from "@/lib/toast";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { Item, Column, ColumnValue } from "@prisma/client";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { StatusPill } from "./StatusPill";
import { BOARD_ROW_GRID, MOBILE_ROW_GRID } from "@/lib/board-layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import { format, isPast, parseISO } from "date-fns";

type ItemWithValues = Item & {
  columnValues: ColumnValue[];
  subItems?: (Item & { columnValues: ColumnValue[] })[];
};

// Lightweight tooltip — appears above child on hover
function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div style={{ position: "relative", display: "inline-flex" }} className="group/tip">
      {children}
      <div
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md text-[10px] whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity"
        style={{
          background: "var(--bg-popover)",
          border: "1px solid var(--border-strong)",
          color: "var(--text-1)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          zIndex: 9999,
        }}
      >
        {text}
      </div>
    </div>
  );
}

const PRIORITY_COLOR: Record<string, string> = {
  p1: "#ef4444", p2: "#f97316", p3: "#5b9cf6", p4: "#6b7280",
};
const PRIORITY_LABEL: Record<string, string> = {
  p1: "P1 — High", p2: "P2 — Medium", p3: "P3 — Low", p4: "No priority",
};

export function ItemRow({
  item,
  columns,
  boardId,
  boardName,
  boardIcon,
  boardColor,
}: {
  item: ItemWithValues;
  columns: Column[];
  boardId: string;
  boardName?: string;
  boardIcon?: string | null;
  boardColor?: string | null;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const rowGrid = isMobile ? MOBILE_ROW_GRID : BOARD_ROW_GRID;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["board", boardId] });
  }

  const patchItem = async (patch: Record<string, unknown>) => {
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if ("completedAt" in patch) {
      patch.completedAt
        ? t.success("Task completed", item.name)
        : t.info("Marked incomplete", item.name);
    }
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
    t.success("Task deleted");
    invalidate();
  };

  const statusCol = columns.find((c) => c.type === "status");
  const statusRaw = statusCol
    ? (() => {
        const cv = item.columnValues.find((v) => v.columnId === statusCol.id);
        if (!cv) return null;
        try { return JSON.parse(cv.value) as string; } catch { return cv.value; }
      })()
    : null;
  const effectiveStatus = item.completedAt ? "done" : statusRaw;

  const deadlineDate = item.deadline
    ? (typeof item.deadline === "string" ? parseISO(item.deadline) : item.deadline as Date)
    : null;
  const deadlineOverdue = deadlineDate && !item.completedAt && isPast(deadlineDate);
  const priority = (item as any).priority as string | null;

  return (
    <>
      <div
        className="group"
        style={{
          display: "grid",
          gridTemplateColumns: rowGrid,
          alignItems: "center",
          height: 40,
          borderBottom: "1px solid var(--border)",
          background: "transparent",
          transition: "background 0.1s",
          cursor: "pointer",
        }}
        onClick={() => setDetailOpen(true)}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        {/* Col 1 — completion circle (36px) */}
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Tip text={item.completedAt ? "Mark incomplete" : "Mark complete"}>
            <button
              onClick={() => patchItem({ completedAt: item.completedAt ? null : new Date().toISOString() })}
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: item.completedAt
                  ? "none"
                  : `2px solid ${PRIORITY_COLOR[priority ?? "p4"] ?? "var(--border-strong)"}`,
                background: item.completedAt ? "#22c55e" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              {item.completedAt && <Check size={9} color="white" strokeWidth={3} />}
            </button>
          </Tip>
        </div>

        {/* Col 2 — name + description (1fr) */}
        <div
          style={{
            paddingLeft: 4,
            paddingRight: 8,
            minWidth: 0,
            overflow: "hidden",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            {/* Priority dot */}
            <Tip text={PRIORITY_LABEL[priority ?? "p4"]}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: PRIORITY_COLOR[priority ?? "p4"] ?? "#6b7280",
                  opacity: priority && priority !== "p4" ? 1 : 0.2,
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
            </Tip>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: item.completedAt ? "var(--text-4)" : "var(--text-1)",
                textDecoration: item.completedAt ? "line-through" : "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.name}
            </span>
          </div>
          {(item as any).description && (
            <span
              style={{
                fontSize: 10,
                color: "var(--text-4)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginTop: 1,
              }}
            >
              {(item as any).description}
            </span>
          )}
        </div>

        {/* Col 3 — status (180px) */}
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => e.stopPropagation()}
        >
          {statusCol ? (
            <StatusPill
              value={effectiveStatus}
              itemId={item.id}
              columnId={statusCol.id}
              onSuccess={invalidate}
            />
          ) : (
            <span style={{ fontSize: 11, color: "var(--text-4)" }}>—</span>
          )}
        </div>

        {/* Col 4 — deadline (120px) — hidden on mobile */}
        {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          {deadlineDate ? (
            <Tip text={`${format(deadlineDate, "MMMM d, yyyy")}${deadlineOverdue ? " · overdue" : ""}`}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "2px 8px",
                  borderRadius: 5,
                  color: deadlineOverdue ? "#ef4444" : "var(--text-2)",
                  background: deadlineOverdue ? "rgba(239,68,68,0.1)" : "var(--bg-active)",
                  border: `1px solid ${deadlineOverdue ? "rgba(239,68,68,0.25)" : "var(--border)"}`,
                  whiteSpace: "nowrap",
                }}
              >
                {format(deadlineDate, "MMM d")}
              </span>
            </Tip>
          ) : (
            <span style={{ fontSize: 11, color: "var(--text-4)" }}>—</span>
          )}
        </div>
        )}

        {/* Col 5 — actions (36px) — hidden on mobile */}
        {!isMobile && (
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 5,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-3)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <MoreHorizontal size={14} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                style={{
                  background: "var(--bg-popover)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: 8,
                  padding: 4,
                  minWidth: 140,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
                  zIndex: 9999,
                }}
                sideOffset={6}
                align="end"
              >
                <DropdownMenu.Item
                  style={{
                    padding: "7px 10px",
                    borderRadius: 5,
                    fontSize: 12,
                    color: "var(--text-2)",
                    cursor: "pointer",
                    outline: "none",
                  }}
                  onSelect={() => setDetailOpen(true)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  Open detail
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  style={{
                    padding: "7px 10px",
                    borderRadius: 5,
                    fontSize: 12,
                    color: "#ef4444",
                    cursor: "pointer",
                    outline: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                  onSelect={deleteItem}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <Trash2 size={12} />
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
        )}
      </div>

      {detailOpen && (
        <TaskDetailPanel
          item={{
            ...item,
            description: (item as any).description ?? null,
            deadline: item.deadline instanceof Date
              ? item.deadline.toISOString()
              : ((item.deadline as string | null) ?? null),
            completedAt: item.completedAt instanceof Date
              ? item.completedAt.toISOString()
              : (item.completedAt ?? null),
            scheduledDate: item.scheduledDate instanceof Date
              ? item.scheduledDate.toISOString()
              : (item.scheduledDate ?? null),
            priority: (item as any).priority ?? null,
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
        />
      )}
    </>
  );
}
