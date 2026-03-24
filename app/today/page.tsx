"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addDays, subDays, isToday as isTodayFn, isPast, parseISO, isSameDay } from "date-fns";
import { Sun, ChevronLeft, ChevronRight, Plus, X, ChevronDown } from "lucide-react";
import { AddTaskModal, type NewTask } from "@/components/tasks/AddTaskModal";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";

interface SubItem {
  id: string;
  name: string;
  completedAt: string | null;
  priority: string | null;
  columnValues: { columnId: string; value: string }[];
}

interface TodayItem {
  id: string;
  name: string;
  isToday: boolean;
  scheduledDate: string | null;
  completedAt: string | null;
  priority: string | null;
  category: string | null;
  description: string | null;
  groupId: string;
  group: { board: { id: string; name: string; color: string | null; icon: string | null } };
  columnValues: { columnId: string; value: string }[];
  subItems: SubItem[];
}

const PRIORITY_GROUPS = [
  { key: "p1", label: "High",          color: "#ef4444", dotBg: "rgba(239,68,68,0.2)"   },
  { key: "p2", label: "Medium",        color: "#f97316", dotBg: "rgba(249,115,22,0.15)" },
  { key: "p3", label: "Low",           color: "#5b9cf6", dotBg: "rgba(91,156,246,0.15)" },
  { key: "p4", label: "Uncategorized", color: "rgba(255,255,255,0.2)", dotBg: "transparent" },
] as const;

const PRIORITY_CIRCLE: Record<string, { border: string; dot: string }> = {
  p1: { border: "#ef4444", dot: "#ef4444" },
  p2: { border: "#f97316", dot: "#f97316" },
  p3: { border: "#5b9cf6", dot: "#5b9cf6" },
  p4: { border: "rgba(255,255,255,0.2)", dot: "" },
};

function PriorityCircle({
  priority,
  done,
  onClick,
}: {
  priority: string | null;
  done: boolean;
  onClick: () => void;
}) {
  const cfg = PRIORITY_CIRCLE[priority ?? "p4"] ?? PRIORITY_CIRCLE.p4;

  if (done) {
    return (
      <button
        onClick={onClick}
        className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center transition-all"
        style={{ backgroundColor: "#3B6D11", border: "2px solid #3B6D11" }}
      >
        <span className="text-white text-[9px] font-bold">✓</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center hover:scale-110 transition-all group/circle"
      style={{ border: `2px solid ${cfg.border}` }}
    >
      {priority && priority !== "p4" && (
        <span
          className="w-1.5 h-1.5 rounded-full opacity-0 group-hover/circle:opacity-100 transition-opacity"
          style={{ backgroundColor: cfg.dot }}
        />
      )}
    </button>
  );
}

function SubTaskRow({
  item,
  onToggle,
  onDelete,
  onRename,
}: {
  item: SubItem;
  onToggle: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}) {
  const done = !!item.completedAt;
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);

  function submitRename() {
    setEditing(false);
    const n = editName.trim();
    if (n && n !== item.name) onRename(n);
    else setEditName(item.name);
  }

  return (
    <div className="flex items-center gap-2 pl-8 pr-2 py-1.5 hover:bg-white/[0.02] group/sub rounded-lg transition-colors">
      <PriorityCircle priority={item.priority} done={done} onClick={onToggle} />
      {editing ? (
        <input
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={submitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitRename();
            if (e.key === "Escape") { setEditing(false); setEditName(item.name); }
          }}
          className="flex-1 text-xs bg-white/[0.06] border border-[#5b9cf6]/40 rounded px-1.5 py-0.5 text-white/80 outline-none"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={`flex-1 text-xs cursor-text ${done ? "line-through text-white/20" : "text-white/60"}`}
        >
          {item.name}
        </span>
      )}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover/sub:opacity-100 p-0.5 text-white/20 hover:text-red-400 transition-all rounded"
      >
        <X size={11} />
      </button>
    </div>
  );
}

function TaskRow({
  item,
  onToggleComplete,
  onDelete,
  onUpdate,
  onAddSubTask,
  onOpenDetail,
}: {
  item: TodayItem;
  onToggleComplete: (item: TodayItem) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Record<string, unknown>) => void;
  onAddSubTask: (parentId: string, name: string) => void;
  onOpenDetail: (item: TodayItem) => void;
}) {
  const done = !!item.completedAt;
  const isInbox = item.group.board.icon === "📥";
  const [subtasksOpen, setSubtasksOpen] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskName, setSubtaskName] = useState("");

  const isOverdue =
    item.scheduledDate &&
    !item.completedAt &&
    isPast(parseISO(item.scheduledDate)) &&
    !isTodayFn(parseISO(item.scheduledDate));

  function submitSubtask() {
    const n = subtaskName.trim();
    if (n) onAddSubTask(item.id, n);
    setSubtaskName("");
    setAddingSubtask(false);
  }

  const doneSubCount = item.subItems.filter((s) => s.completedAt).length;

  return (
    <div>
      <div className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.025] group/row rounded-lg transition-colors">
        <PriorityCircle
          priority={item.priority}
          done={done}
          onClick={() => onToggleComplete(item)}
        />

        <span
          onClick={() => onOpenDetail(item)}
          className="flex-1 text-sm cursor-pointer truncate transition-colors"
          style={{ color: done ? "var(--text-4)" : "var(--text-2)", textDecoration: done ? "line-through" : "none" }}
        >
          {item.name}
        </span>

        {/* Category tag */}
        {item.category && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 shrink-0">
            {item.category}
          </span>
        )}

        {/* Source board (non-inbox) */}
        {!isInbox && (
          <div className="flex items-center gap-1 shrink-0 opacity-50">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: item.group.board.color ?? "#6b7280" }}
            />
            <span className="text-[10px] text-white/30">{item.group.board.name}</span>
          </div>
        )}

        {/* Scheduled date */}
        {item.scheduledDate && (
          <span className={`text-[10px] shrink-0 ${isOverdue ? "text-red-400" : "text-white/25"}`}>
            {format(parseISO(item.scheduledDate), "MMM d")}
          </span>
        )}

        {/* Subtask badge */}
        {item.subItems.length > 0 && (
          <button
            onClick={() => setSubtasksOpen(!subtasksOpen)}
            className="flex items-center gap-0.5 text-[10px] text-white/30 hover:text-white/60 transition-colors shrink-0"
          >
            <ChevronRight
              size={10}
              className={`transition-transform ${subtasksOpen ? "rotate-90" : ""}`}
            />
            {doneSubCount}/{item.subItems.length}
          </button>
        )}

        <button
          onClick={() => onDelete(item.id)}
          className="opacity-0 group-hover/row:opacity-100 p-0.5 text-white/15 hover:text-red-400 transition-all rounded shrink-0"
        >
          <X size={13} />
        </button>
      </div>

      {/* Subtasks */}
      {subtasksOpen && (
        <div>
          {item.subItems.map((sub) => (
            <SubTaskRow
              key={sub.id}
              item={sub}
              onToggle={() =>
                onUpdate(sub.id, { completedAt: sub.completedAt ? null : new Date().toISOString() })
              }
              onDelete={() => onDelete(sub.id)}
              onRename={(name) => onUpdate(sub.id, { name })}
            />
          ))}
          {addingSubtask ? (
            <div className="pl-8 pr-3 py-1">
              <input
                autoFocus
                value={subtaskName}
                onChange={(e) => setSubtaskName(e.target.value)}
                onBlur={submitSubtask}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSubtask();
                  if (e.key === "Escape") { setAddingSubtask(false); setSubtaskName(""); }
                }}
                placeholder="Subtask name…"
                className="w-full text-xs bg-white/[0.06] border border-[#5b9cf6]/30 rounded-lg px-2 py-1 text-white/75 placeholder:text-white/20 outline-none"
              />
            </div>
          ) : (
            <button
              onClick={() => setAddingSubtask(true)}
              className="pl-8 pr-3 py-1 text-[10px] text-white/20 hover:text-white/45 transition-colors flex items-center gap-1"
            >
              <Plus size={10} />
              Add subtask
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PrioritySection({
  group,
  items,
  onToggleComplete,
  onDelete,
  onUpdate,
  onAddSubTask,
  onOpenDetail,
  onAddTask,
  projects,
  inboxProject,
  viewDate,
}: {
  group: typeof PRIORITY_GROUPS[number];
  items: TodayItem[];
  onToggleComplete: (item: TodayItem) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Record<string, unknown>) => void;
  onAddSubTask: (parentId: string, name: string) => void;
  onOpenDetail: (item: TodayItem) => void;
  onAddTask: (task: NewTask) => Promise<void>;
  projects: { id: string; name: string; color: string | null; icon: string | null }[];
  inboxProject: { id: string; name: string } | null;
  viewDate: Date;
}) {
  const storageKey = `ordo-today-collapsed-${group.key}`;
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(storageKey) === "true"
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const doneCount = items.filter((i) => i.completedAt).length;

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(storageKey, String(next));
  }

  return (
    <div className="mb-4">
      {/* Section header */}
      <button onClick={toggle} className="flex items-center gap-2 mb-2 px-1 w-full group/hdr">
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform ${collapsed ? "-rotate-90" : ""}`}
          style={{ color: group.color }}
        />
        <div
          className="w-2.5 h-2.5 rounded-full border-2 shrink-0"
          style={{ borderColor: group.color, background: group.dotBg }}
        />
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: group.color }}
        >
          {group.label}
        </span>
        <div className="flex-1 h-px mx-2" style={{ background: "var(--border)" }} />
        <span className="text-[10px] text-white/25">
          {doneCount}/{items.length}
        </span>
      </button>

      {!collapsed && (
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-card)", boxShadow: "var(--card-shadow)" }}>
          {items.map((item) => (
            <TaskRow
              key={item.id}
              item={item}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onAddSubTask={onAddSubTask}
              onOpenDetail={onOpenDetail}
            />
          ))}

          {showAddModal ? (
            <div className="p-2 border-t border-white/[0.05]">
              <AddTaskModal
                defaultDate={viewDate}
                defaultPriority={group.key !== "p4" ? group.key : undefined}
                projects={projects}
                inboxProject={inboxProject}
                onClose={() => setShowAddModal(false)}
                onSave={async (task) => {
                  await onAddTask(task);
                  setShowAddModal(false);
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-colors"
              style={{ color: "var(--text-4)", borderTop: "1px solid var(--border)" }}
            >
              <Plus size={12} />
              Add task
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function TodayPage() {
  const queryClient = useQueryClient();
  const [viewDate, setViewDate] = useState(new Date());
  const [completedOpen, setCompletedOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<TodayItem | null>(null);

  const dateStr = format(viewDate, "yyyy-MM-dd");
  const isCurrentDay = isTodayFn(viewDate);

  const { data, isLoading } = useQuery<{
    items: TodayItem[];
    inboxGroupId: string | null;
    inboxBoard: { id: string; name: string } | null;
    projects: { id: string; name: string; color: string | null; icon: string | null }[];
  }>({
    queryKey: ["today", dateStr],
    queryFn: () => fetch(`/api/today?date=${dateStr}`).then((r) => r.json()),
  });

  const items = data?.items ?? [];
  const inboxGroupId = data?.inboxGroupId ?? null;
  const inboxBoard = data?.inboxBoard ?? null;
  const projects = data?.projects ?? [];

  const activeItems = items.filter((i) => !i.completedAt);
  const completedItems = items.filter((i) => !!i.completedAt);

  const grouped = PRIORITY_GROUPS.map((group) => ({
    ...group,
    items: activeItems.filter((item) =>
      group.key === "p4"
        ? !item.priority || item.priority === "p4"
        : item.priority === group.key
    ),
  })).filter((g) => g.items.length > 0);

  async function toggleComplete(item: TodayItem) {
    const completedAt = item.completedAt ? null : new Date().toISOString();
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedAt }),
    });
    queryClient.invalidateQueries({ queryKey: ["today", dateStr] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
  }

  async function deleteItem(id: string) {
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["today", dateStr] });
  }

  async function updateItem(id: string, patch: Record<string, unknown>) {
    await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    queryClient.invalidateQueries({ queryKey: ["today", dateStr] });
  }

  async function addSubTask(parentId: string, name: string) {
    const parent = items.find((i) => i.id === parentId);
    if (!parent) return;
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: parent.groupId, name, parentId, scheduledDate: viewDate.toISOString() }),
    });
    queryClient.invalidateQueries({ queryKey: ["today", dateStr] });
  }

  async function addTask(task: NewTask) {
    if (!inboxGroupId) return;
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId: inboxGroupId,
        name: task.name,
        description: task.description,
        scheduledDate: (task.scheduledDate ?? viewDate).toISOString(),
        priority: task.priority !== "p4" ? task.priority : null,
        category: task.category,
        isToday: isSameDay(task.scheduledDate ?? viewDate, new Date()),
      }),
    });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["today", dateStr] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    }
  }

  async function clearCompleted() {
    await Promise.all(
      completedItems.map((i) => fetch(`/api/items/${i.id}`, { method: "DELETE" }))
    );
    queryClient.invalidateQueries({ queryKey: ["today", dateStr] });
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <Sun size={20} className="text-[#f59e0b]" />
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>My Day</h1>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-2 mb-8 ml-8">
        <button
          onClick={() => setViewDate(subDays(viewDate, 1))}
          className="p-0.5 transition-colors"
          style={{ color: "var(--text-4)" }}
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm" style={{ color: "var(--text-3)" }}>
          {format(viewDate, "EEE, MMMM d")}
        </span>
        <button
          onClick={() => setViewDate(addDays(viewDate, 1))}
          className="p-0.5 transition-colors"
          style={{ color: "var(--text-4)" }}
        >
          <ChevronRight size={14} />
        </button>
        {!isCurrentDay && (
          <button
            onClick={() => setViewDate(new Date())}
            className="text-xs transition-colors ml-1 px-2 py-0.5 rounded-full"
            style={{ color: "var(--chart-primary)", background: "var(--accent-subtle)" }}
          >
            Today
          </button>
        )}
        {activeItems.length > 0 && (
          <span className="text-xs ml-1" style={{ color: "var(--text-4)" }}>
            · {activeItems.length} task{activeItems.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-center py-16" style={{ color: "var(--text-4)" }}>Loading…</div>
      ) : (
        <>
          {grouped.length === 0 && completedItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "var(--text-4)" }}>
                Nothing planned for {isCurrentDay ? "today" : format(viewDate, "MMM d")}
              </p>
            </div>
          )}

          {/* Priority groups */}
          {grouped.map((group) => (
            <PrioritySection
              key={group.key}
              group={group}
              items={group.items}
              onToggleComplete={toggleComplete}
              onDelete={deleteItem}
              onUpdate={updateItem}
              onAddSubTask={addSubTask}
              onOpenDetail={setDetailItem}
              onAddTask={addTask}
              projects={projects}
              inboxProject={inboxBoard}
              viewDate={viewDate}
            />
          ))}

          {/* Empty state — show add button for Uncategorized even when no tasks */}
          {grouped.length === 0 && (
            <PrioritySection
              group={PRIORITY_GROUPS[3]}
              items={[]}
              onToggleComplete={toggleComplete}
              onDelete={deleteItem}
              onUpdate={updateItem}
              onAddSubTask={addSubTask}
              onOpenDetail={setDetailItem}
              onAddTask={addTask}
              projects={projects}
              inboxProject={inboxBoard}
              viewDate={viewDate}
            />
          )}

          {/* Completed section */}
          {completedItems.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setCompletedOpen(!completedOpen)}
                className="flex items-center gap-2 mb-2 px-1 text-[10px] text-white/25 hover:text-white/40 w-full"
              >
                <ChevronDown
                  size={10}
                  className={`transition-transform ${completedOpen ? "" : "-rotate-90"}`}
                />
                <span className="uppercase tracking-widest font-semibold">
                  Completed today ({completedItems.length})
                </span>
                <div className="flex-1 h-px bg-white/[0.04] mx-2" />
                {completedOpen && (
                  <span
                    onClick={(e) => { e.stopPropagation(); clearCompleted(); }}
                    className="text-white/20 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Clear all
                  </span>
                )}
              </button>
              {completedOpen && (
                <div className="rounded-xl overflow-hidden opacity-60" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-card)" }}>
                  {completedItems.map((item) => (
                    <TaskRow
                      key={item.id}
                      item={item}
                      onToggleComplete={toggleComplete}
                      onDelete={deleteItem}
                      onUpdate={updateItem}
                      onAddSubTask={addSubTask}
                      onOpenDetail={setDetailItem}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {detailItem && (
        <TaskDetailModal
          item={{ ...detailItem, group: detailItem.group }}
          onClose={() => setDetailItem(null)}
          onUpdate={async (id, patch) => { await updateItem(id, patch); }}
          onDelete={async (id) => { await deleteItem(id); setDetailItem(null); }}

          onAddSubTask={addSubTask}
        />
      )}
    </div>
  );
}
