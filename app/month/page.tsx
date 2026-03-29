"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  subDays,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  isPast,
  parseISO,
  isSameDay,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";

type ViewMode = "3" | "7" | "month";
const VIEW_OPTIONS: { key: ViewMode; label: string }[] = [
  { key: "3",     label: "3d"    },
  { key: "7",     label: "7d"    },
  { key: "month", label: "Month" },
];
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { AddTaskModal, type NewTask } from "@/components/tasks/AddTaskModal";
import { sortByPriority } from "@/components/tasks/PriorityDot";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MonthItem {
  id: string;
  name: string;
  scheduledDate: string | null;
  completedAt: string | null;
  priority: string | null;
  description: string | null;
  deadline: string | null;
  category: string | null;
  groupId: string;
  group: {
    board: { id: string; name: string; color: string | null; icon: string | null };
  };
  subItems: { id: string; name: string; completedAt: string | null; priority: string | null }[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  p1: "#ef4444",
  p2: "#f97316",
  p3: "#5b9cf6",
  p4: "#6b7280",
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE = 3;

// ─── Calendar grid builder ───────────────────────────────────────────────────

function buildGrid(viewDate: Date): Date[] {
  const start   = startOfMonth(viewDate);
  const end     = endOfMonth(viewDate);
  // Convert Sun-based getDay() to Mon-based index: Mon=0 … Sun=6
  const leadDays  = (getDay(start) + 6) % 7;
  const trailDays = (getDay(end) + 6) % 7;
  return eachDayOfInterval({
    start: subDays(start, leadDays),
    end:   addDays(end, trailDays === 6 ? 0 : 6 - trailDays),
  });
}

// ─── Draggable task row ──────────────────────────────────────────────────────

function TaskRow({
  item,
  onToggle,
  onOpen,
}: {
  item:     MonthItem;
  onToggle: (item: MonthItem) => void;
  onOpen:   (item: MonthItem) => void;
}) {
  const done      = !!item.completedAt;
  const overdue   = !done &&
    !!item.scheduledDate &&
    isPast(parseISO(item.scheduledDate)) &&
    !isToday(parseISO(item.scheduledDate));
  const boardColor = item.group.board.color ?? "#9EC5F7";
  const prioColor  = item.priority ? (PRIORITY_COLORS[item.priority] ?? null) : null;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id:   item.id,
    data: { item },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); onOpen(item); }}
      style={{
        display:        "flex",
        alignItems:     "center",
        gap:            4,
        padding:        "2px 4px",
        borderRadius:   5,
        borderLeft:     `2px solid ${overdue ? "var(--sys-red)" : boardColor}`,
        opacity:        isDragging ? 0.3 : 1,
        cursor:         "pointer",
        touchAction:    "none",
        background:     "transparent",
        minWidth:       0,
        transition:     "background 0.1s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {/* Completion circle */}
      <div
        onClick={(ev) => { ev.stopPropagation(); onToggle(item); }}
        style={{
          width:        9,
          height:       9,
          borderRadius: "50%",
          flexShrink:   0,
          border:       `1.5px solid ${done ? "#22c55e" : "var(--border-strong)"}`,
          background:   done ? "#22c55e" : "transparent",
          cursor:       "pointer",
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
        }}
      >
        {done && (
          <span style={{ color: "#fff", fontSize: 5, fontWeight: 700, lineHeight: 1 }}>✓</span>
        )}
      </div>

      {/* Priority dot */}
      {prioColor && item.priority !== "p4" && (
        <span
          style={{
            width: 5, height: 5, borderRadius: "50%",
            background: prioColor, flexShrink: 0,
          }}
        />
      )}

      {/* Name */}
      <span
        style={{
          fontSize:       "clamp(10px, 2.5vw, 11px)",
          flex:           1,
          overflow:       "hidden",
          textOverflow:   "ellipsis",
          whiteSpace:     "nowrap",
          cursor:         "pointer",
          color:          done
            ? "var(--text-4)"
            : overdue
            ? "var(--sys-red)"
            : "var(--text-2)",
          textDecoration: done ? "line-through" : "none",
          opacity:        done ? 0.65 : 1,
        }}
      >
        {item.name}
      </span>
    </div>
  );
}

// ─── Day cell (droppable) ────────────────────────────────────────────────────

function DayCell({
  date,
  items,
  inCurrentMonth,
  isOver,
  onToggle,
  onOpen,
  onClickDate,
}: {
  date:           Date;
  items:          MonthItem[];
  inCurrentMonth: boolean;
  isOver:         boolean;
  onToggle:       (item: MonthItem) => void;
  onOpen:         (item: MonthItem) => void;
  onClickDate:    (date: Date) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { setNodeRef } = useDroppable({
    id:   format(date, "yyyy-MM-dd"),
    data: { date },
  });

  const today   = isToday(date);
  const past    = isPast(startOfDay(date)) && !today;
  const sorted  = sortByPriority(items);
  const visible = expanded ? sorted : sorted.slice(0, MAX_VISIBLE);
  const hidden  = sorted.length - MAX_VISIBLE;

  return (
    <div
      ref={setNodeRef}
      onClick={() => onClickDate(date)}
      style={{
        minHeight:      90,
        border:         `1px solid ${today ? "rgba(91,156,246,0.4)" : "var(--border)"}`,
        borderRadius:   "var(--radius-card, 10px)",
        background:     today
          ? "rgba(91,156,246,0.04)"
          : isOver
          ? "var(--bg-hover)"
          : "var(--bg-card)",
        padding:        "5px 5px 3px",
        display:        "flex",
        flexDirection:  "column",
        gap:            1,
        opacity:        inCurrentMonth ? 1 : 0.28,
        transition:     "background 0.12s",
        overflow:       "hidden",
        cursor:         "pointer",
      }}
    >
      {/* Day number + done/total badge */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          marginBottom:   2,
        }}
      >
        <span
          style={{
            fontSize:       12,
            fontWeight:     today ? 700 : 400,
            lineHeight:     1,
            width:          22,
            height:         22,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            borderRadius:   "50%",
            background:     today ? "var(--accent)" : "transparent",
            color:          today
              ? "#fff"
              : past && inCurrentMonth
              ? "var(--text-3)"
              : "var(--text-2)",
          }}
        >
          {format(date, "d")}
        </span>
        {items.length > 0 && (
          <span style={{ fontSize: 9, color: "var(--text-4)" }}>
            {items.filter((i) => i.completedAt).length}/{items.length}
          </span>
        )}
      </div>

      {/* Task rows */}
      {visible.map((item) => (
        <TaskRow key={item.id} item={item} onToggle={onToggle} onOpen={onOpen} />
      ))}

      {/* +N more */}
      {!expanded && hidden > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
          style={{
            fontSize:    10,
            color:       "var(--accent)",
            textAlign:   "left",
            padding:     "1px 4px",
            background:  "transparent",
            border:      "none",
            cursor:      "pointer",
            fontFamily:  "inherit",
          }}
        >
          +{hidden} more
        </button>
      )}

    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function MonthPage() {
  const today = new Date();
  const [viewMode,     setViewMode]     = useState<ViewMode>("month");
  const [viewDate,     setViewDate]     = useState(() => startOfMonth(today));
  const [stripStart,   setStripStart]   = useState(() => startOfDay(today));
  const [detailItem,   setDetailItem]   = useState<MonthItem | null>(null);
  const [draggingItem, setDraggingItem] = useState<MonthItem | null>(null);
  const [overDate,     setOverDate]     = useState<string | null>(null);
  const [addTaskDate,  setAddTaskDate]  = useState<Date | null>(null);
  const queryClient = useQueryClient();

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const stripDays = viewMode !== "month" ? parseInt(viewMode) : 0;
  const stripStartStr = format(stripStart, "yyyy-MM-dd");

  const { data, isLoading } = useQuery<{
    items:         MonthItem[];
    inboxGroupId:  string | null;
    inboxBoard:    { id: string; name: string; color: string | null } | null;
    projects:      { id: string; name: string; color: string | null; icon: string | null }[];
  }>({
    queryKey:  ["month", year, month],
    queryFn:   () => fetch(`/api/month?year=${year}&month=${month}`).then((r) => r.json()),
    enabled:   viewMode === "month",
  });

  const { data: stripData, isLoading: stripLoading } = useQuery<{
    items:         MonthItem[];
    inboxGroupId:  string | null;
    inboxBoard:    { id: string; name: string; color: string | null } | null;
    projects:      { id: string; name: string; color: string | null; icon: string | null }[];
  }>({
    queryKey:  ["range", stripStartStr, stripDays],
    queryFn:   () => fetch(`/api/month?start=${stripStartStr}&days=${stripDays}`).then((r) => r.json()),
    enabled:   viewMode !== "month",
  });

  const activeData   = viewMode === "month" ? data : stripData;
  const isLoading2   = viewMode === "month" ? isLoading : stripLoading;
  const items        = activeData?.items        ?? [];
  const inboxGroupId = activeData?.inboxGroupId ?? null;
  const inboxBoard   = activeData?.inboxBoard   ?? null;
  const projects     = activeData?.projects     ?? [];

  // For strip views, build the list of days to show
  const stripGrid = useMemo(() => {
    if (viewMode === "month") return [];
    return Array.from({ length: effectiveStripDays }, (_, i) => addDays(stripStart, i));
  }, [viewMode, stripStart, effectiveStripDays]);

  const grid         = useMemo(() => buildGrid(viewDate), [viewDate]);
  const weeksInGrid  = grid.length / 7;
  const rowHeight    = Math.max(90, Math.floor(600 / weeksInGrid));
  const isNowMonth   = isSameMonth(viewDate, today);
  const isMobile = useIsMobile();
  // On mobile, cap strip views at 3 columns for readability
  const effectiveStripDays = isMobile && stripDays === 7 ? 3 : stripDays;

  function invalidateActive() {
    if (viewMode === "month") {
      queryClient.invalidateQueries({ queryKey: ["month", year, month] });
    } else {
      queryClient.invalidateQueries({ queryKey: ["range", stripStartStr, stripDays] });
    }
  }

  function navigate(direction: 1 | -1) {
    if (viewMode === "month") {
      setViewDate(direction === 1 ? addMonths(viewDate, 1) : subMonths(viewDate, 1));
    } else {
      setStripStart(addDays(stripStart, direction * stripDays));
    }
  }

  function jumpToToday() {
    if (viewMode === "month") {
      setViewDate(startOfMonth(today));
    } else {
      setStripStart(startOfDay(today));
    }
  }

  const isAtToday = viewMode === "month"
    ? isSameMonth(viewDate, today)
    : isSameDay(stripStart, today) || (stripDays > 1 && stripStart <= today && today <= addDays(stripStart, stripDays - 1));

  // Group items by "yyyy-MM-dd"
  const byDate = useMemo(() => {
    const map: Record<string, MonthItem[]> = {};
    for (const item of items) {
      if (!item.scheduledDate) continue;
      const key = format(parseISO(item.scheduledDate), "yyyy-MM-dd");
      (map[key] ??= []).push(item);
    }
    return map;
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const activeQueryKey = viewMode === "month"
    ? ["month", year, month]
    : ["range", stripStartStr, stripDays];

  async function handleToggle(item: MonthItem) {
    const completedAt = item.completedAt ? null : new Date().toISOString();
    queryClient.setQueryData(activeQueryKey, (old: any) =>
      old && ({ ...old, items: old.items.map((i: MonthItem) => i.id === item.id ? { ...i, completedAt } : i) })
    );
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedAt }),
    });
    invalidateActive();
    queryClient.invalidateQueries({ queryKey: ["stats"] });
  }

  async function handleAddTask(task: NewTask, date: Date) {
    if (!inboxGroupId) return;
    const scheduledDate = new Date(date);
    scheduledDate.setHours(12, 0, 0, 0);
    await fetch("/api/items", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId: inboxGroupId, name: task.name, description: task.description,
        scheduledDate: scheduledDate.toISOString(),
        priority: task.priority !== "p4" ? task.priority : null,
        category: task.category, isToday: isToday(date),
      }),
    });
    invalidateActive();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setDraggingItem(null);
    setOverDate(null);
    if (!over) return;

    const newDate = over.data.current?.date as Date | undefined;
    if (!newDate) return;

    const item = items.find((i) => i.id === active.id);
    if (!item) return;

    if (item.scheduledDate && isSameDay(parseISO(item.scheduledDate), newDate)) return;

    const newScheduled = startOfDay(newDate).toISOString();
    const previous = queryClient.getQueryData(activeQueryKey);
    queryClient.setQueryData(activeQueryKey, (old: any) =>
      old && ({ ...old, items: old.items.map((i: MonthItem) => i.id === item.id ? { ...i, scheduledDate: newScheduled } : i) })
    );

    const res = await fetch(`/api/items/${item.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledDate: newScheduled, isToday: isToday(newDate) }),
    });
    if (!res.ok) {
      queryClient.setQueryData(activeQueryKey, previous);
    } else {
      invalidateActive();
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col h-full"
      style={{ padding: "clamp(12px, 3vw, 24px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <CalendarDays size={20} style={{ color: "var(--accent)" }} />
          <div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>
              My Month
            </h1>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              {viewMode === "month"
                ? format(viewDate, "MMMM yyyy")
                : `${format(stripStart, "MMM d")} – ${format(addDays(stripStart, stripDays - 1), "MMM d, yyyy")}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div
            className="flex rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}
          >
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setViewMode(opt.key)}
                style={{
                  padding:    "4px 10px",
                  fontSize:   11,
                  fontWeight: viewMode === opt.key ? 600 : 400,
                  color:      viewMode === opt.key ? "var(--text-1)" : "var(--text-3)",
                  background: viewMode === opt.key ? "var(--bg-hover)" : "transparent",
                  border:     "none",
                  cursor:     "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.1s",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            {!isAtToday && (
              <button
                onClick={jumpToToday}
                className="text-xs px-2.5 py-1 rounded-lg"
                style={{ color: "var(--text-3)" }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "var(--text-1)"; el.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "var(--text-3)"; el.style.background = "transparent"; }}
              >
                Today
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg"
              style={{ color: "var(--text-3)" }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "var(--text-1)"; el.style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "var(--text-3)"; el.style.background = "transparent"; }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-1.5 rounded-lg"
              style={{ color: "var(--text-3)" }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "var(--text-1)"; el.style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "var(--text-3)"; el.style.background = "transparent"; }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {isLoading2 ? (
        <div
          className="flex-1 flex items-center justify-center text-sm"
          style={{ color: "var(--text-4)" }}
        >
          Loading…
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={(e: DragStartEvent) =>
            setDraggingItem(items.find((i) => i.id === e.active.id) ?? null)
          }
          onDragOver={(e) => setOverDate((e.over?.id as string) ?? null)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setDraggingItem(null);
            setOverDate(null);
          }}
        >
          {viewMode === "month" ? (
            <>
              {/* Day-name header row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                {DAY_LABELS.map((d) => (
                  <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-4)", padding: "2px 0" }}>
                    {d}
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: `minmax(${rowHeight}px, auto)`, gap: 4, flex: 1, minHeight: 0, overflowY: "auto" }}>
                {grid.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  return (
                    <DayCell key={key} date={day} items={byDate[key] ?? []}
                      inCurrentMonth={isSameMonth(day, viewDate)} isOver={overDate === key}
                      onToggle={handleToggle} onOpen={setDetailItem} onClickDate={setAddTaskDate} />
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {/* Strip view day headers */}
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${effectiveStripDays}, minmax(0,1fr))`, gap: 4, marginBottom: 4 }}>
                {stripGrid.map((day) => (
                  <div key={format(day, "yyyy-MM-dd")} style={{ textAlign: "center", fontSize: 10, fontWeight: isToday(day) ? 700 : 600, textTransform: "uppercase", letterSpacing: "0.07em", color: isToday(day) ? "var(--accent)" : "var(--text-4)", padding: "2px 0" }}>
                    {format(day, stripDays <= 7 ? "EEE d" : "EEE d MMM")}
                  </div>
                ))}
              </div>
              {/* Strip grid */}
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${effectiveStripDays}, minmax(0,1fr))`, gap: 4, flex: 1, minHeight: 0, overflowY: "auto" }}>
                {stripGrid.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  return (
                    <DayCell key={key} date={day} items={byDate[key] ?? []}
                      inCurrentMonth={true} isOver={overDate === key}
                      onToggle={handleToggle} onOpen={setDetailItem} onClickDate={setAddTaskDate} />
                  );
                })}
              </div>
            </>
          )}

          {/* Drag overlay */}
          <DragOverlay>
            {draggingItem && (
              <div
                style={{
                  opacity:      0.9,
                  pointerEvents: "none",
                  background:   "var(--bg-card)",
                  border:       "1px solid var(--border-strong)",
                  borderRadius:  6,
                  padding:      "4px 8px",
                  fontSize:     11,
                  color:        "var(--text-2)",
                  maxWidth:     160,
                  whiteSpace:   "nowrap",
                  overflow:     "hidden",
                  textOverflow: "ellipsis",
                  boxShadow:    "0 4px 16px rgba(0,0,0,0.25)",
                }}
              >
                {draggingItem.name}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Task detail modal */}
      {detailItem && (
        <TaskDetailModal
          item={{
            ...detailItem,
            columnValues: [],
            group: {
              ...detailItem.group,
              board: { ...detailItem.group.board },
            },
          }}
          onClose={() => setDetailItem(null)}
          onUpdate={async (id, patch) => {
            await fetch(`/api/items/${id}`, {
              method:  "PATCH",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify(patch),
            });
            invalidateActive();
          }}
          onDelete={async (id) => {
            await fetch(`/api/items/${id}`, { method: "DELETE" });
            invalidateActive();
            setDetailItem(null);
          }}
        />
      )}

      {/* Add task modal — rendered at page level so it never overflows a cell */}
      {addTaskDate && (
        <AddTaskModal
          defaultDate={addTaskDate}
          projects={projects}
          inboxProject={inboxBoard}
          onClose={() => setAddTaskDate(null)}
          onSave={async (task) => {
            await handleAddTask(task, addTaskDate);
            setAddTaskDate(null);
          }}
        />
      )}
    </div>
  );
}
