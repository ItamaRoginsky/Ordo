"use client";

import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isToday as isTodayFn, parseISO } from "date-fns";
import { Sun, ChevronDown, Plus } from "lucide-react";

interface TodayItem {
  id: string;
  name: string;
  isToday: boolean;
  scheduledDate: string | null;
  completedAt: string | null;
  groupId: string;
  group: { board: { id: string; name: string; color: string | null; icon: string | null } };
  columnValues: { columnId: string; value: string }[];
}

function ItemCard({
  item,
  onToggleComplete,
}: {
  item: TodayItem;
  onToggleComplete: (item: TodayItem) => void;
}) {
  const done = !!item.completedAt;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.025] group rounded-lg transition-colors">
      <button
        onClick={() => onToggleComplete(item)}
        className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all flex items-center justify-center ${
          done
            ? "bg-[#22c55e] border-[#22c55e]"
            : "border-white/20 hover:border-[#22c55e]"
        }`}
      >
        {done && <span className="text-white text-[9px] font-bold">✓</span>}
      </button>
      <span className={`flex-1 text-sm ${done ? "line-through text-white/25" : "text-white/80"}`}>
        {item.name}
      </span>
      <div className="flex items-center gap-1.5 opacity-60">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: item.group.board.color ?? "#6b7280" }}
        />
        <span className="text-[11px] text-white/30">{item.group.board.name}</span>
      </div>
      {item.scheduledDate && (
        <span className="text-[11px] text-white/25">
          {format(parseISO(item.scheduledDate), "MMM d")}
        </span>
      )}
    </div>
  );
}

function Section({
  title,
  items,
  defaultCollapsed = false,
  onToggleComplete,
}: {
  title: string;
  items: TodayItem[];
  defaultCollapsed?: boolean;
  onToggleComplete: (item: TodayItem) => void;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 mb-2 group"
      >
        <ChevronDown
          size={14}
          className={`text-white/30 transition-transform ${collapsed ? "-rotate-90" : ""}`}
        />
        <span className="text-sm font-medium text-white/60">{title}</span>
        <span className="text-xs text-white/25 bg-white/[0.06] px-1.5 py-0.5 rounded-full">
          {items.length}
        </span>
      </button>
      {!collapsed && (
        <div className="bg-[#1c1c1c] rounded-xl border border-white/[0.07] overflow-hidden">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onToggleComplete={onToggleComplete} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TodayPage() {
  const queryClient = useQueryClient();
  const [newTask, setNewTask] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery<{ items: TodayItem[]; inboxGroupId: string | null }>({
    queryKey: ["today"],
    queryFn: () => fetch("/api/today").then((r) => r.json()),
  });

  const items = data?.items ?? [];
  const inboxGroupId = data?.inboxGroupId ?? null;

  const today = new Date();
  const todayStart = new Date(today); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(today); todayEnd.setHours(23, 59, 59, 999);

  const pinned    = items.filter((i) => i.isToday && !i.completedAt);
  const dueToday  = items.filter(
    (i) => !i.isToday && !i.completedAt && i.scheduledDate && isTodayFn(parseISO(i.scheduledDate))
  );
  const completed = items.filter(
    (i) => i.completedAt && new Date(i.completedAt) >= todayStart
  );

  async function toggleComplete(item: TodayItem) {
    const completedAt = item.completedAt ? null : new Date().toISOString();
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedAt }),
    });
    queryClient.invalidateQueries({ queryKey: ["today"] });
  }

  async function addTask() {
    const name = newTask.trim();
    if (!name || !inboxGroupId) return;
    setNewTask("");

    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: inboxGroupId, name }),
    });
    const item = await res.json();
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isToday: true }),
    });
    queryClient.invalidateQueries({ queryKey: ["today"] });
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <Sun size={20} className="text-[#f59e0b]" />
        <h1 className="text-xl font-semibold text-white/90 tracking-tight">My Day</h1>
      </div>
      <p className="text-sm text-white/30 mb-8 ml-8">
        {format(today, "EEEE, MMMM d")}
      </p>

      {isLoading ? (
        <div className="text-white/25 text-sm text-center py-16">Loading…</div>
      ) : (
        <>
          <Section title="Pinned for today"  items={pinned}    onToggleComplete={toggleComplete} />
          <Section title="Due today"         items={dueToday}  onToggleComplete={toggleComplete} />
          <Section title="Completed today"   items={completed} defaultCollapsed onToggleComplete={toggleComplete} />

          {pinned.length === 0 && dueToday.length === 0 && completed.length === 0 && (
            <div className="text-center py-16">
              <p className="text-white/20 text-sm">Nothing planned for today</p>
            </div>
          )}

          {/* Quick add */}
          <div className="mt-6 flex items-center gap-3 px-4 py-3 bg-[#1c1c1c] rounded-xl border border-white/[0.07]">
            <Plus size={14} className="text-white/25 shrink-0" />
            <input
              ref={inputRef}
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
              placeholder="Add to today…"
              className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/20 outline-none"
            />
          </div>
        </>
      )}
    </div>
  );
}
