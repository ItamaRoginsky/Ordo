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
  parseISO,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface WeekItem {
  id: string;
  name: string;
  scheduledDate: string | null;
  completedAt: string | null;
  groupId: string;
  group: { board: { id: string; name: string; color: string | null } };
  columnValues: { columnId: string; value: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  done: "#22c55e",
  in_progress: "#5b9cf6",
  stuck: "#ef4444",
  review: "#a855f7",
  not_started: "#6b7280",
};

function getStatusColor(item: WeekItem): string {
  const statusVal = item.columnValues.find((cv) => {
    try {
      return JSON.parse(cv.value)?.type === "status" || true;
    } catch {
      return false;
    }
  });
  if (!statusVal) return "#6b7280";
  try {
    const parsed = JSON.parse(statusVal.value);
    return STATUS_COLORS[parsed] ?? STATUS_COLORS[parsed?.value] ?? "#6b7280";
  } catch {
    return "#6b7280";
  }
}

function ItemCard({
  item,
  onToggle,
}: {
  item: WeekItem;
  onToggle: (item: WeekItem) => void;
}) {
  const done = !!item.completedAt;
  const color = item.group.board.color ?? "#6b7280";
  return (
    <div
      className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] group cursor-pointer transition-colors"
      onClick={() => onToggle(item)}
    >
      <div
        className={`mt-0.5 w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
          done ? "border-[#22c55e] bg-[#22c55e]" : "border-white/20 group-hover:border-[#22c55e]"
        }`}
      >
        {done && <span className="text-white text-[7px] font-bold">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs leading-tight truncate ${done ? "line-through text-white/25" : "text-white/75"}`}>
          {item.name}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-[10px] text-white/25 truncate">{item.group.board.name}</span>
        </div>
      </div>
    </div>
  );
}

function DayColumn({
  date,
  items,
  onToggle,
  onAddItem,
}: {
  date: Date;
  items: WeekItem[];
  onToggle: (item: WeekItem) => void;
  onAddItem: (date: Date, name: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const today = isToday(date);

  function handleAdd() {
    const name = newName.trim();
    if (name) {
      onAddItem(date, name);
    }
    setNewName("");
    setAdding(false);
  }

  return (
    <div
      className={`flex flex-col min-h-0 rounded-xl border transition-colors ${
        today
          ? "border-[#5b9cf6]/40 bg-[#5b9cf6]/[0.04]"
          : "border-white/[0.06] bg-[#1c1c1c]"
      }`}
    >
      {/* Header */}
      <div
        className={`px-3 py-2.5 border-b ${
          today ? "border-[#5b9cf6]/20" : "border-white/[0.06]"
        }`}
      >
        <p className={`text-[10px] font-semibold uppercase tracking-widest ${today ? "text-[#5b9cf6]" : "text-white/30"}`}>
          {format(date, "EEE")}
        </p>
        <p className={`text-lg font-semibold leading-tight ${today ? "text-[#5b9cf6]" : "text-white/60"}`}>
          {format(date, "d")}
        </p>
      </div>

      {/* Items */}
      <div className="flex-1 p-1.5 space-y-0.5 overflow-y-auto">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onToggle={onToggle} />
        ))}

        {adding ? (
          <div className="px-2 py-1">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") { setAdding(false); setNewName(""); }
              }}
              onBlur={handleAdd}
              placeholder="Task name…"
              className="w-full bg-white/[0.06] rounded-md px-2 py-1 text-xs text-white/80 placeholder:text-white/25 outline-none border border-[#5b9cf6]/40 focus:border-[#5b9cf6]/70"
            />
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full text-left px-2 py-1 text-[10px] text-white/15 hover:text-white/35 transition-colors rounded-lg hover:bg-white/[0.03]"
          >
            + Add
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

  const startStr = format(weekStart, "yyyy-MM-dd");

  const { data, isLoading } = useQuery<{ items: WeekItem[]; inboxGroupId: string | null }>({
    queryKey: ["week", startStr],
    queryFn: () => fetch(`/api/week?start=${startStr}`).then((r) => r.json()),
  });

  const items = data?.items ?? [];
  const inboxGroupId = data?.inboxGroupId ?? null;

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
  }

  async function addItem(day: Date, name: string) {
    if (!inboxGroupId) return;
    const scheduledDate = day.toISOString();
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: inboxGroupId, name }),
    });
    const item = await res.json();
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledDate }),
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
          <Calendar size={20} className="text-[#5b9cf6]" />
          <div>
            <h1 className="text-xl font-semibold text-white/90 tracking-tight">My Week</h1>
            <p className="text-sm text-white/30">
              {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="text-xs text-white/40 hover:text-white/70 px-2.5 py-1 rounded-lg hover:bg-white/[0.06] transition-colors mr-1"
            >
              Today
            </button>
          )}
          <button
            onClick={() => setWeekStart(subWeeks(weekStart, 1))}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-white/25 text-sm">
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
              onAddItem={addItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
