"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addWeeks, subWeeks, addDays, isToday, parseISO, isSameDay } from "date-fns";
import { Target, ChevronLeft, ChevronRight, Settings, Plus, Check, X, Trash2 } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { AddTaskModal, NewTask } from "@/components/tasks/AddTaskModal";
import { useIsMobile } from "@/hooks/useIsMobile";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface GoalTask {
  id: string;
  name: string;
  completedAt: string | null;
  priority: string | null;
  scheduledDate: string | null;
  groupId: string;
}

interface WeeklyGoal {
  id: string;
  title: string;
  isComplete: boolean;
  position: number;
  items: GoalTask[];
}

// ─── Pastel palette ────────────────────────────────────────────────────────────

const GOAL_COLORS = [
  { accent: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)" },
  { accent: "#60a5fa", bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.25)" },
  { accent: "#34d399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.25)" },
  { accent: "#f472b6", bg: "rgba(244,114,182,0.08)", border: "rgba(244,114,182,0.25)" },
  { accent: "#fb923c", bg: "rgba(251,146,60,0.08)",  border: "rgba(251,146,60,0.25)" },
  { accent: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.25)" },
  { accent: "#38bdf8", bg: "rgba(56,189,248,0.08)",  border: "rgba(56,189,248,0.25)" },
  { accent: "#a3e635", bg: "rgba(163,230,53,0.08)",  border: "rgba(163,230,53,0.25)" },
];

const PRIORITY_DOTS: Record<string, string> = {
  p1: "#ef4444",
  p2: "#f97316",
  p3: "#5b9cf6",
  p4: "#6b7280",
};

// ─── GoalCard ──────────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  colorIndex,
  animDelay,
  onToggleGoal,
  onRenameGoal,
  onDeleteGoal,
  onOpenAddTask,
  onToggleTask,
  onDeleteTask,
}: {
  goal: WeeklyGoal;
  colorIndex: number;
  animDelay?: number;
  onToggleGoal: (goal: WeeklyGoal) => void;
  onRenameGoal: (id: string, title: string) => void;
  onDeleteGoal: (id: string) => void;
  onOpenAddTask: (goalId: string) => void;
  onToggleTask: (task: GoalTask) => void;
  onDeleteTask: (id: string) => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(goal.title);
  const [hovered, setHovered] = useState(false);

  const color = GOAL_COLORS[colorIndex % GOAL_COLORS.length];
  const allDone = goal.items.length > 0 && goal.items.every((t) => !!t.completedAt);
  const isDone = goal.isComplete || allDone;
  const completedCount = goal.items.filter((t) => !!t.completedAt).length;
  const progressPct = goal.items.length > 0 ? (completedCount / goal.items.length) * 100 : 0;

  function commitTitle() {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== goal.title) onRenameGoal(goal.id, trimmed);
    else setTitleDraft(goal.title);
    setEditingTitle(false);
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isDone
          ? "var(--bg-card)"
          : `linear-gradient(145deg, ${color.bg}, var(--bg-card))`,
        border: `1px solid ${isDone ? "rgba(34,197,94,0.2)" : color.border}`,
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease",
        transform: hovered && !isDone ? "translateY(-3px)" : "none",
        animation: `fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${animDelay ?? 0}ms both`,
        boxShadow: hovered && !isDone
          ? `0 8px 32px ${color.bg}, 0 2px 8px rgba(0,0,0,0.12)`
          : "0 1px 4px rgba(0,0,0,0.06)",
        opacity: isDone ? 0.7 : 1,
        position: "relative",
      }}
    >
      {/* Color accent bar */}
      <div style={{
        height: 3,
        background: isDone
          ? "linear-gradient(90deg, #22c55e, #16a34a)"
          : `linear-gradient(90deg, ${color.accent}, ${color.accent}88)`,
        borderRadius: "16px 16px 0 0",
        transition: "background 0.3s",
      }} />

      {/* Header */}
      <div style={{ padding: "12px 12px 8px", display: "flex", alignItems: "flex-start", gap: 8 }}>
        {/* Completion circle */}
        <button
          onClick={() => onToggleGoal(goal)}
          title={isDone ? "Mark incomplete" : "Mark complete"}
          style={{
            width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
            border: `2px solid ${isDone ? "#22c55e" : color.accent}`,
            background: isDone ? "#22c55e" : "transparent",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
            boxShadow: isDone ? "0 0 0 3px rgba(34,197,94,0.15)" : `0 0 0 0px ${color.accent}33`,
          }}
          onMouseEnter={(e) => {
            if (!isDone) (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px ${color.accent}33`;
          }}
          onMouseLeave={(e) => {
            if (!isDone) (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          {isDone && <Check size={11} color="#fff" strokeWidth={3} />}
        </button>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle();
                if (e.key === "Escape") { setTitleDraft(goal.title); setEditingTitle(false); }
              }}
              style={{
                width: "100%", background: "transparent", border: "none",
                borderBottom: `1.5px solid ${color.accent}`,
                outline: "none", fontSize: 13, fontWeight: 700,
                color: "var(--text-1)", fontFamily: "inherit", paddingBottom: 2,
              }}
            />
          ) : (
            <div
              onClick={() => !isDone && setEditingTitle(true)}
              style={{
                fontSize: 13, fontWeight: 700, lineHeight: 1.35,
                color: isDone ? "var(--text-4)" : "var(--text-1)",
                cursor: isDone ? "default" : "text",
                textDecoration: isDone ? "line-through" : "none",
                wordBreak: "break-word",
              }}
            >
              {goal.title}
            </div>
          )}
          {goal.items.length > 0 && (
            <div style={{ marginTop: 4 }}>
              {/* Segmented progress */}
              <div style={{ display: "flex", gap: 2, marginBottom: 3 }}>
                {goal.items.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: t.completedAt ? color.accent : "var(--border)",
                      transition: "background 0.2s",
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 10, color: "var(--text-4)", letterSpacing: "0.01em" }}>
                {completedCount}/{goal.items.length} tasks
              </span>
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={() => onDeleteGoal(goal.id)}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: "var(--text-4)", padding: 3, flexShrink: 0, borderRadius: 6,
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#ef4444";
            (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-4)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 8px" }}>
        {goal.items.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            accentColor={color.accent}
            onToggle={() => onToggleTask(task)}
            onDelete={() => onDeleteTask(task.id)}
          />
        ))}
      </div>

      {/* Add task button */}
      <div style={{ padding: "0 12px 12px" }}>
        <button
          onClick={() => onOpenAddTask(goal.id)}
          style={{
            width: "100%", textAlign: "left",
            padding: "7px 10px", borderRadius: 8,
            fontSize: 12, color: "var(--text-4)",
            background: "transparent",
            border: `1px dashed ${color.border}`,
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 5,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = color.accent;
            el.style.borderColor = color.accent;
            el.style.background = color.bg;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = "var(--text-4)";
            el.style.borderColor = color.border;
            el.style.background = "transparent";
          }}
        >
          <Plus size={12} strokeWidth={2.5} /> Add task
        </button>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  accentColor,
  onToggle,
  onDelete,
}: {
  task: GoalTask;
  accentColor: string;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [rowHovered, setRowHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setRowHovered(true)}
      onMouseLeave={() => setRowHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "5px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
          border: `1.5px solid ${task.completedAt ? accentColor : "var(--border-strong)"}`,
          background: task.completedAt ? accentColor : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s",
        }}
      >
        {task.completedAt && <Check size={8} color="#fff" strokeWidth={3} />}
      </button>

      {task.priority && PRIORITY_DOTS[task.priority] && (
        <div style={{
          width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
          background: PRIORITY_DOTS[task.priority],
        }} />
      )}

      <span style={{
        flex: 1, fontSize: 12, lineHeight: 1.4,
        color: task.completedAt ? "var(--text-4)" : "var(--text-2)",
        textDecoration: task.completedAt ? "line-through" : "none",
        wordBreak: "break-word",
      }}>
        {task.name}
      </span>

      {task.scheduledDate && (
        <span style={{
          fontSize: 9, flexShrink: 0,
          color: isToday(parseISO(task.scheduledDate)) ? accentColor : "var(--text-4)",
          fontWeight: isToday(parseISO(task.scheduledDate)) ? 600 : 400,
        }}>
          {format(parseISO(task.scheduledDate), "MMM d")}
        </span>
      )}

      <button
        onClick={onDelete}
        style={{
          background: "transparent", border: "none", cursor: "pointer",
          color: rowHovered ? "var(--sys-red)" : "var(--text-4)",
          padding: 0, flexShrink: 0,
          transition: "color 0.1s",
        }}
      >
        <X size={11} />
      </button>
    </div>
  );
}

function EmptySlot({ onAdd, colorIndex }: { onAdd: () => void; colorIndex: number }) {
  const [hov, setHov] = useState(false);
  const color = GOAL_COLORS[colorIndex % GOAL_COLORS.length];
  return (
    <div
      onClick={onAdd}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border: `1.5px dashed ${hov ? color.accent : "var(--border)"}`,
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: hov ? color.accent : "var(--text-4)",
        fontSize: 12,
        gap: 6,
        transition: "all 0.15s",
        background: hov ? color.bg : "transparent",
      }}
    >
      <Plus size={14} strokeWidth={2} /> Add a goal
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function WeekPage() {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(today);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [targetDraft, setTargetDraft] = useState<number | null>(null);
  const [addingTaskForGoalId, setAddingTaskForGoalId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const weekStr = format(weekStart, "yyyy-MM-dd");
  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = isSameDay(
    weekStart,
    (() => {
      const d = new Date(today);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    })()
  );

  const { data, isLoading } = useQuery<{
    goals: WeeklyGoal[];
    weeklyGoalsTarget: number;
    inboxGroupId: string | null;
    inboxBoard: { id: string; name: string; color: string | null } | null;
    projects: { id: string; name: string; color: string | null; icon: string | null }[];
  }>({
    queryKey: ["weekly", weekStr],
    queryFn: () => fetch(`/api/weekly?weekStart=${weekStr}`).then((r) => r.json()),
  });

  const goals        = data?.goals            ?? [];
  const target       = data?.weeklyGoalsTarget ?? 5;
  const inboxGroupId = data?.inboxGroupId      ?? null;
  const inboxBoard   = data?.inboxBoard        ?? null;
  const projects     = data?.projects          ?? [];

  const completedGoals = goals.filter(
    (g) => g.isComplete || (g.items.length > 0 && g.items.every((t) => !!t.completedAt))
  ).length;

  // Grid layout math
  const totalSlots = Math.max(target, goals.length);
  const cols = Math.max(1, Math.ceil(Math.sqrt(totalSlots)));
  const rows = Math.max(1, Math.ceil(totalSlots / cols));

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["weekly", weekStr] });
  }

  // ── Goal mutations ──────────────────────────────────────────────────────────

  async function addGoal() {
    await fetch("/api/weekly", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart: weekStr, title: "New goal" }),
    });
    invalidate();
  }

  async function toggleGoal(goal: WeeklyGoal) {
    const isComplete = !(goal.isComplete || (goal.items.length > 0 && goal.items.every((t) => !!t.completedAt)));
    queryClient.setQueryData(["weekly", weekStr], (old: any) =>
      old && ({ ...old, goals: old.goals.map((g: WeeklyGoal) => g.id === goal.id ? { ...g, isComplete } : g) })
    );
    await fetch(`/api/weekly/${goal.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isComplete }),
    });
    invalidate();
  }

  async function renameGoal(id: string, title: string) {
    queryClient.setQueryData(["weekly", weekStr], (old: any) =>
      old && ({ ...old, goals: old.goals.map((g: WeeklyGoal) => g.id === id ? { ...g, title } : g) })
    );
    await fetch(`/api/weekly/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  }

  async function deleteGoal(id: string) {
    queryClient.setQueryData(["weekly", weekStr], (old: any) =>
      old && ({ ...old, goals: old.goals.filter((g: WeeklyGoal) => g.id !== id) })
    );
    await fetch(`/api/weekly/${id}`, { method: "DELETE" });
    invalidate();
  }

  // ── Task mutations ──────────────────────────────────────────────────────────

  async function handleAddTask(goalId: string, task: NewTask) {
    if (!inboxGroupId) return;
    const body: Record<string, unknown> = {
      groupId: inboxGroupId,
      name: task.name,
      weeklyGoalId: goalId,
      priority: task.priority,
      isToday: task.isToday,
    };
    if (task.description)   body.description   = task.description;
    if (task.scheduledDate) {
      body.scheduledDate = task.scheduledDate.toISOString();
      body.isToday       = isToday(task.scheduledDate);
    }
    if (task.deadline)      body.deadline      = task.deadline.toISOString();
    if (task.category)      body.category      = task.category;
    await fetch("/api/items", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    invalidate();
  }

  async function toggleTask(task: GoalTask) {
    const completedAt = task.completedAt ? null : new Date().toISOString();
    queryClient.setQueryData(["weekly", weekStr], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        goals: old.goals.map((g: WeeklyGoal) => ({
          ...g,
          items: g.items.map((t: GoalTask) => t.id === task.id ? { ...t, completedAt } : t),
        })),
      };
    });
    await fetch(`/api/items/${task.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedAt }),
    });
    invalidate();
  }

  async function deleteTask(id: string) {
    queryClient.setQueryData(["weekly", weekStr], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        goals: old.goals.map((g: WeeklyGoal) => ({
          ...g,
          items: g.items.filter((t: GoalTask) => t.id !== id),
        })),
      };
    });
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    invalidate();
  }

  async function saveTarget(val: number) {
    await fetch("/api/me", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weeklyGoalsTarget: val }),
    });
    queryClient.setQueryData(["weekly", weekStr], (old: any) =>
      old && ({ ...old, weeklyGoalsTarget: val })
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const allGoalsDone = target > 0 && completedGoals >= target;
  const isMobile = useIsMobile();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "clamp(12px, 3vw, 24px)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, var(--accent), #a78bfa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
          }}>
            <Target size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.03em", margin: 0 }}>
              Weekly Goals
            </h1>
            <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0, letterSpacing: "0.01em" }}>
              {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Settings */}
          <Popover.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
            <Popover.Trigger asChild>
              <button
                title="Settings"
                style={{
                  padding: 7, borderRadius: 8, background: "transparent",
                  border: "none", cursor: "pointer", color: "var(--text-3)",
                  display: "flex", alignItems: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "var(--text-1)"; el.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "var(--text-3)"; el.style.background = "transparent"; }}
              >
                <Settings size={16} />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                sideOffset={8} align="end"
                style={{
                  zIndex: 300, background: "var(--bg-card)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: 14, padding: 18, width: 230,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 14, margin: "0 0 14px" }}>Weekly Settings</p>
                <label style={{ fontSize: 12, color: "var(--text-3)", display: "block", marginBottom: 10 }}>
                  Goals per week target
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="range" min={1} max={10}
                    value={targetDraft ?? target}
                    onChange={(e) => setTargetDraft(Number(e.target.value))}
                    onMouseUp={() => { if (targetDraft !== null && targetDraft !== target) saveTarget(targetDraft); }}
                    onTouchEnd={() => { if (targetDraft !== null && targetDraft !== target) saveTarget(targetDraft); }}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)", minWidth: 24, textAlign: "center" }}>
                    {targetDraft ?? target}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "var(--text-4)", marginTop: 8, margin: "8px 0 0" }}>
                  {targetDraft ?? target} goal{(targetDraft ?? target) !== 1 ? "s" : ""} per week
                </p>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          {!isCurrentWeek && (
            <button
              onClick={() => {
                const d = new Date(today);
                const day = d.getDay();
                const diff = day === 0 ? -6 : 1 - day;
                d.setDate(d.getDate() + diff);
                d.setHours(0, 0, 0, 0);
                setWeekStart(d);
              }}
              style={{
                fontSize: 11, padding: "5px 11px", borderRadius: 7,
                background: "transparent", border: "none", cursor: "pointer",
                color: "var(--text-3)", fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "var(--text-1)"; el.style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "var(--text-3)"; el.style.background = "transparent"; }}
            >
              This week
            </button>
          )}

          <button
            onClick={() => setWeekStart(subWeeks(weekStart, 1))}
            style={{ padding: 6, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex", alignItems: "center", transition: "all 0.15s" }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--bg-hover)"; el.style.color = "var(--text-1)"; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "var(--text-3)"; }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            style={{ padding: 6, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex", alignItems: "center", transition: "all 0.15s" }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--bg-hover)"; el.style.color = "var(--text-1)"; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "var(--text-3)"; }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.01em" }}>
            <span style={{ fontWeight: 700, color: allGoalsDone ? "#22c55e" : "var(--text-1)" }}>{completedGoals}</span>
            <span style={{ color: "var(--text-4)" }}> / {target} goals</span>
          </span>
          {allGoalsDone && (
            <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 700, letterSpacing: "0.02em" }}>
              All done!
            </span>
          )}
        </div>
        {/* Segmented bar */}
        <div style={{ display: "flex", gap: 3, height: 5 }}>
          {Array.from({ length: target }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1, borderRadius: 3,
                background: i < completedGoals
                  ? `linear-gradient(90deg, ${GOAL_COLORS[i % GOAL_COLORS.length].accent}, ${GOAL_COLORS[(i + 1) % GOAL_COLORS.length].accent})`
                  : "var(--bg-hover)",
                transition: "background 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* Goal grid */}
      {isLoading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-4)", fontSize: 13 }}>
          Loading…
        </div>
      ) : (
        <div
          style={{
            flex: isMobile ? "none" : 1,
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : `repeat(${cols}, 1fr)`,
            gridTemplateRows: isMobile ? "auto" : `repeat(${rows}, 1fr)`,
            gap: 12,
            minHeight: 0,
            overflowY: isMobile ? "auto" : undefined,
          }}
        >
          {goals.map((goal, idx) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              colorIndex={idx}
              animDelay={idx * 60}
              onToggleGoal={toggleGoal}
              onRenameGoal={renameGoal}
              onDeleteGoal={deleteGoal}
              onOpenAddTask={(id) => setAddingTaskForGoalId(id)}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
            />
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, totalSlots - goals.length) }).map((_, i) => (
            <EmptySlot key={`empty-${i}`} onAdd={addGoal} colorIndex={goals.length + i} />
          ))}
        </div>
      )}

      {/* Add task modal (page-level, full version) */}
      {addingTaskForGoalId && (
        <AddTaskModal
          projects={projects}
          inboxProject={inboxBoard}
          onClose={() => setAddingTaskForGoalId(null)}
          onSave={async (task) => {
            await handleAddTask(addingTaskForGoalId, task);
            setAddingTaskForGoalId(null);
          }}
        />
      )}
    </div>
  );
}
