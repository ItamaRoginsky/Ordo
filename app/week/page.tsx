"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isToday,
  isPast,
  parseISO,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { AddTaskModal, type NewTask } from "@/components/tasks/AddTaskModal";
import { sortByPriority, PRIORITY_ORDER } from "@/components/tasks/PriorityDot";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";

interface WeekItem {
  id: string;
  name: string;
  scheduledDate: string | null;
  completedAt: string | null;
  priority: string | null;
  groupId: string;
  group: { board: { id: string; name: string; color: string | null } };
  columnValues: { columnId: string; value: string }[];
}

const PRIORITY_COLORS: Record<string, string> = {
  p1: "#ef4444",
  p2: "#f97316",
  p3: "#5b9cf6",
  p4: "#6b7280",
  // legacy support
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#6b7280",
};

function ItemCard({
  item,
  onToggle,
  onOpenDetail,
}: {
  item: WeekItem;
  onToggle: (item: WeekItem) => void;
  onOpenDetail?: (item: WeekItem) => void;
}) {
  const done = !!item.completedAt;
  const overdue =
    !done &&
    item.scheduledDate &&
    isPast(parseISO(item.scheduledDate)) &&
    !isToday(parseISO(item.scheduledDate));
  const boardColor = item.group.board.color ?? "#6b7280";

  return (
    <div
      className={`flex items-start gap-1.5 px-2 py-1.5 rounded-lg group cursor-pointer transition-colors border-l-2 ${
        overdue ? "border-red-500/60" : "border-transparent"
      }`}
      onClick={() => onOpenDetail ? onOpenDetail(item) : onToggle(item)}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <div
        className={`mt-0.5 w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
          done ? "border-[#22c55e] bg-[#22c55e]" : "group-hover:border-[#22c55e]"
        }`}
        style={!done ? { borderColor: "var(--border-strong)" } : undefined}
      >
        {done && <span className="text-white text-[7px] font-bold">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          {item.priority && item.priority !== "p4" && (
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: PRIORITY_COLORS[item.priority] ?? "#6b7280" }}
            />
          )}
          <p
            className="text-xs leading-tight truncate"
          style={{ color: done ? "var(--text-4)" : overdue ? "var(--sys-red)" : "var(--text-2)", textDecoration: done ? "line-through" : "none", opacity: done ? 0.7 : 1 }}
          >
            {item.name}
          </p>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: boardColor }} />
          <span className="text-[9px] truncate" style={{ color: "var(--text-4)" }}>{item.group.board.name}</span>
        </div>
      </div>
    </div>
  );
}

function DayColumn({
  date,
  items,
  onToggle,
  onAddTask,
  onOpenDetail,
  projects,
  inboxBoard,
}: {
  date: Date;
  items: WeekItem[];
  onToggle: (item: WeekItem) => void;
  onAddTask: (task: NewTask, date: Date) => Promise<void>;
  onOpenDetail: (item: WeekItem) => void;
  projects: { id: string; name: string; color: string | null; icon: string | null }[];
  inboxBoard: { id: string; name: string } | null;
}) {
  const [showModal, setShowModal] = useState(false);
  const today = isToday(date);
  const doneCount = items.filter((i) => i.completedAt).length;

  return (
    <div
      className="flex flex-col min-h-0 rounded-xl border transition-colors"
      style={{
        background: today ? "rgba(91,156,246,0.03)" : "var(--bg-card)",
        border: today ? "1px solid rgba(91,156,246,0.4)" : "1px solid var(--border)",
        boxShadow: "var(--card-shadow)",
        borderRadius: "var(--radius-card)",
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2.5"
        style={{ borderBottom: today ? "1px solid rgba(91,156,246,0.2)" : "1px solid var(--border)" }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: today ? "var(--chart-primary)" : "var(--text-3)" }}>
          {format(date, "EEE")}
        </p>
        <div className="flex items-end justify-between">
          <p className="text-lg font-semibold leading-tight"
            style={{ color: today ? "var(--chart-primary)" : "var(--text-2)" }}>
            {format(date, "d")}
          </p>
          {items.length > 0 && (
            <span className="text-[9px] mb-0.5" style={{ color: "var(--text-4)" }}>
              {doneCount}/{items.length}
            </span>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 p-1.5 overflow-y-auto">
        {sortByPriority(items).map((item, idx, arr) => {
          const prevPriority = idx > 0 ? (arr[idx - 1].priority ?? "p4") : null;
          const thisPriority = item.priority ?? "p4";
          const showDivider = idx > 0 && prevPriority !== thisPriority &&
            PRIORITY_ORDER[prevPriority!] !== undefined;
          return (
            <div key={item.id}>
              {showDivider && <div className="mx-1 my-1 h-[1px]" style={{ background: "var(--border)" }} />}
              <ItemCard item={item} onToggle={onToggle} onOpenDetail={onOpenDetail} />
            </div>
          );
        })}

        {showModal ? (
          <div className="mt-1">
            <AddTaskModal
              defaultDate={date}
              projects={projects}
              inboxProject={inboxBoard}
              compact={true}
              onClose={() => setShowModal(false)}
              onSave={async (task) => {
                await onAddTask(task, date);
                setShowModal(false);
              }}
            />
          </div>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            className="w-full text-left px-2 py-1 text-[10px] transition-colors rounded-lg"
          style={{ color: "var(--text-4)" }}
          >
            + Add task
          </button>
        )}
      </div>
    </div>
  );
}

export default function WeekPage() {
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [detailItem, setDetailItem] = useState<WeekItem | null>(null);

  const startStr = format(weekStart, "yyyy-MM-dd");

  const { data, isLoading } = useQuery<{
    items: WeekItem[];
    inboxGroupId: string | null;
    inboxBoard: { id: string; name: string } | null;
    projects: { id: string; name: string; color: string | null; icon: string | null }[];
  }>({
    queryKey: ["week", startStr],
    queryFn: () => fetch(`/api/week?start=${startStr}`).then((r) => r.json()),
  });

  const items = data?.items ?? [];
  const inboxGroupId = data?.inboxGroupId ?? null;
  const inboxBoard = data?.inboxBoard ?? null;
  const projects = data?.projects ?? [];

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function itemsForDay(day: Date) {
    return items.filter(
      (item) => item.scheduledDate && isSameDay(parseISO(item.scheduledDate), day)
    );
  }

  async function toggleItem(item: WeekItem) {
    const completedAt = item.completedAt ? null : new Date().toISOString();
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedAt }),
    });
    queryClient.invalidateQueries({ queryKey: ["week", startStr] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
  }

  async function addTask(task: NewTask, date: Date) {
    if (!inboxGroupId) return;
    const scheduledDate = new Date(date);
    scheduledDate.setHours(12, 0, 0, 0);
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId: inboxGroupId,
        name: task.name,
        description: task.description,
        scheduledDate: scheduledDate.toISOString(),
        priority: task.priority !== "p4" ? task.priority : null,
        category: task.category,
        isToday: isToday(date),
      }),
    });
    queryClient.invalidateQueries({ queryKey: ["week", startStr] });
  }

  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }));

  return (
    <div className="flex flex-col h-full px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar size={20} style={{ color: "var(--chart-primary)" }} />
          <div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>My Week</h1>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="text-xs px-2.5 py-1 rounded-lg transition-colors mr-1"
              style={{ color: "var(--text-3)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              Today
            </button>
          )}
          <button
            onClick={() => setWeekStart(subWeeks(weekStart, 1))}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-sm" style={{ color: "var(--text-4)" }}>
          Loading…
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-7 gap-3 min-h-0">
          {days.map((day) => (
            <DayColumn
              key={day.toISOString()}
              date={day}
              items={itemsForDay(day)}
              onToggle={toggleItem}
              onAddTask={addTask}
              onOpenDetail={setDetailItem}
              projects={projects}
              inboxBoard={inboxBoard}
            />
          ))}
        </div>
      )}

      {detailItem && (
        <TaskDetailModal
          item={{
            ...detailItem,
            description: null,
            deadline: null,
            category: null,
            subItems: [],
            group: { ...detailItem.group, board: { ...detailItem.group.board, icon: null } },
          }}
          onClose={() => setDetailItem(null)}
          onUpdate={async (id, patch) => {
            await fetch(`/api/items/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(patch),
            });
            queryClient.invalidateQueries({ queryKey: ["week", startStr] });
          }}
          onDelete={async (id) => {
            await fetch(`/api/items/${id}`, { method: "DELETE" });
            queryClient.invalidateQueries({ queryKey: ["week", startStr] });
            setDetailItem(null);
          }}
        />
      )}
    </div>
  );
}
