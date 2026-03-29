"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addWeeks, subWeeks, startOfWeek, addDays, isToday, parseISO, isSameDay } from "date-fns";
import { Target, ChevronLeft, ChevronRight, Settings, Plus, Check, X, Trash2, Calendar } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Small components ─────────────────────────────────────────────────────────

function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{ padding: "6px", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex", alignItems: "center" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}
    >
      {children}
    </button>
  );
}

function GoalCard({
  goal,
  onToggleGoal,
  onRenameGoal,
  onDeleteGoal,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  inboxGroupId,
}: {
  goal: WeeklyGoal;
  onToggleGoal: (goal: WeeklyGoal) => void;
  onRenameGoal: (id: string, title: string) => void;
  onDeleteGoal: (id: string) => void;
  onAddTask: (goalId: string, name: string, scheduledDate?: string) => void;
  onToggleTask: (task: GoalTask) => void;
  onDeleteTask: (id: string) => void;
  inboxGroupId: string | null;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft]   = useState(goal.title);
  const [addingTask, setAddingTask]   = useState(false);
  const [taskName, setTaskName]       = useState("");
  const [taskDate, setTaskDate]       = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const taskRef  = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editingTitle) titleRef.current?.select(); }, [editingTitle]);
  useEffect(() => { if (addingTask)   taskRef.current?.focus(); },  [addingTask]);

  const allDone = goal.items.length > 0 && goal.items.every((t) => !!t.completedAt);
  const isDone  = goal.isComplete || allDone;

  function commitTitle() {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== goal.title) onRenameGoal(goal.id, trimmed);
    else setTitleDraft(goal.title);
    setEditingTitle(false);
  }

  function submitTask() {
    const trimmed = taskName.trim();
    if (!trimmed) { setAddingTask(false); setTaskName(""); setTaskDate(""); return; }
    onAddTask(goal.id, trimmed, taskDate || undefined);
    setTaskName("");
    setTaskDate("");
    setAddingTask(false);
  }

  const completedCount = goal.items.filter((t) => !!t.completedAt).length;

  return (
    <div
      style={{
        background:    "var(--bg-card)",
        border:        `1px solid ${isDone ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
        borderRadius:  12,
        display:       "flex",
        flexDirection: "column",
        minWidth:      220,
        maxWidth:      360,
        flex:          "1 1 260px",
        overflow:      "hidden",
        transition:    "border-color 0.2s",
        opacity:       isDone ? 0.75 : 1,
      }}
    >
      {/* Goal header */}
      <div style={{ padding: "12px 12px 8px", display: "flex", alignItems: "flex-start", gap: 8 }}>
        {/* Completion toggle */}
        <button
          onClick={() => onToggleGoal(goal)}
          style={{
            width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 2,
            border: `2px solid ${isDone ? "#22c55e" : "var(--border-strong)"}`,
            background: isDone ? "#22c55e" : "transparent",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}
        >
          {isDone && <Check size={10} color="#fff" strokeWidth={3} />}
        </button>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingTitle ? (
            <input
              ref={titleRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => { if (e.key === "Enter") commitTitle(); if (e.key === "Escape") { setTitleDraft(goal.title); setEditingTitle(false); } }}
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 14, fontWeight: 600, color: "var(--text-1)", fontFamily: "inherit" }}
            />
          ) : (
            <span
              onClick={() => setEditingTitle(true)}
              style={{ fontSize: 14, fontWeight: 600, color: isDone ? "var(--text-3)" : "var(--text-1)", cursor: "text", textDecoration: isDone ? "line-through" : "none", display: "block", wordBreak: "break-word" }}
            >
              {goal.title}
            </span>
          )}
          {goal.items.length > 0 && (
            <span style={{ fontSize: 10, color: "var(--text-4)" }}>{completedCount}/{goal.items.length} tasks</span>
          )}
        </div>

        {/* Delete goal */}
        <button
          onClick={() => onDeleteGoal(goal.id)}
          style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-4)", padding: 2, flexShrink: 0 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--sys-red)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-4)"; }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 12px" }}>
        {goal.items.map((task) => (
          <div
            key={task.id}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 0", borderBottom: "1px solid var(--border)" }}
          >
            {/* Task completion */}
            <button
              onClick={() => onToggleTask(task)}
              style={{
                width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                border: `1.5px solid ${task.completedAt ? "#22c55e" : "var(--border-strong)"}`,
                background: task.completedAt ? "#22c55e" : "transparent",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {task.completedAt && <Check size={8} color="#fff" strokeWidth={3} />}
            </button>

            <span style={{ flex: 1, fontSize: 12, color: task.completedAt ? "var(--text-4)" : "var(--text-2)", textDecoration: task.completedAt ? "line-through" : "none", wordBreak: "break-word" }}>
              {task.name}
            </span>

            {task.scheduledDate && (
              <span style={{ fontSize: 9, color: isToday(parseISO(task.scheduledDate)) ? "var(--accent)" : "var(--text-4)", flexShrink: 0 }}>
                {format(parseISO(task.scheduledDate), "MMM d")}
              </span>
            )}

            <button
              onClick={() => onDeleteTask(task.id)}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "transparent", padding: 0, flexShrink: 0 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--sys-red)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "transparent"; }}
            >
              <X size={11} />
            </button>
          </div>
        ))}

        {/* Add task row */}
        {addingTask ? (
          <div style={{ padding: "6px 0", display: "flex", flexDirection: "column", gap: 4 }}>
            <input
              ref={taskRef}
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitTask(); if (e.key === "Escape") { setAddingTask(false); setTaskName(""); setTaskDate(""); } }}
              placeholder="Task name…"
              style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid var(--border)", outline: "none", fontSize: 12, color: "var(--text-1)", fontFamily: "inherit", paddingBottom: 2 }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={11} style={{ color: "var(--text-4)" }} />
              <input
                type="date"
                value={taskDate}
                onChange={(e) => setTaskDate(e.target.value)}
                style={{ fontSize: 11, background: "transparent", border: "none", outline: "none", color: "var(--text-3)", fontFamily: "inherit", cursor: "pointer" }}
              />
              <button onClick={submitTask} disabled={!taskName.trim()} style={{ marginLeft: "auto", padding: "2px 8px", fontSize: 11, background: "var(--accent)", border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontFamily: "inherit", opacity: taskName.trim() ? 1 : 0.4 }}>
                Add
              </button>
              <button onClick={() => { setAddingTask(false); setTaskName(""); setTaskDate(""); }} style={{ padding: "2px 6px", fontSize: 11, background: "transparent", border: "none", color: "var(--text-4)", cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingTask(true)}
            style={{ width: "100%", textAlign: "left", padding: "6px 0", fontSize: 11, color: "var(--text-4)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-4)"; }}
          >
            <Plus size={11} /> Add task
          </button>
        )}
      </div>
    </div>
  );
}

function EmptySlot({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      onClick={onAdd}
      style={{
        background:    "transparent",
        border:        "1.5px dashed var(--border)",
        borderRadius:  12,
        minWidth:      220,
        maxWidth:      360,
        flex:          "1 1 260px",
        minHeight:     120,
        display:       "flex",
        alignItems:    "center",
        justifyContent:"center",
        cursor:        "pointer",
        color:         "var(--text-4)",
        fontSize:      12,
        gap:           6,
        transition:    "all 0.15s",
      }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--accent)"; el.style.color = "var(--accent)"; }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border)"; el.style.color = "var(--text-4)"; }}
    >
      <Plus size={14} /> Add a goal
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

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
  const [targetDraft, setTargetDraft]   = useState<number | null>(null);
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
  }>({
    queryKey: ["weekly", weekStr],
    queryFn:  () => fetch(`/api/weekly?weekStart=${weekStr}`).then((r) => r.json()),
  });

  const goals           = data?.goals           ?? [];
  const target          = data?.weeklyGoalsTarget ?? 5;
  const inboxGroupId    = data?.inboxGroupId     ?? null;

  const completedGoals = goals.filter((g) => g.isComplete || (g.items.length > 0 && g.items.every((t) => !!t.completedAt))).length;
  const emptySlots     = Math.max(0, target - goals.length);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["weekly", weekStr] });
  }

  // ── Goal mutations ─────────────────────────────────────────────────────────

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

  // ── Task mutations ─────────────────────────────────────────────────────────

  async function addTask(goalId: string, name: string, scheduledDateStr?: string) {
    if (!inboxGroupId) return;
    const body: Record<string, unknown> = { groupId: inboxGroupId, name, weeklyGoalId: goalId };
    if (scheduledDateStr) {
      const d = new Date(scheduledDateStr);
      d.setHours(12, 0, 0, 0);
      body.scheduledDate = d.toISOString();
      body.isToday = isToday(d);
    }
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

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full" style={{ padding: "clamp(12px, 3vw, 24px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <Target size={20} style={{ color: "var(--accent)" }} />
          <div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>
              Weekly Goals
            </h1>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Settings */}
          <Popover.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
            <Popover.Trigger asChild>
              <button
                style={{ padding: 6, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", color: "var(--text-3)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                title="Settings"
              >
                <Settings size={16} />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                sideOffset={8}
                align="end"
                style={{ zIndex: 300, background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 12, padding: 16, width: 220, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
              >
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", marginBottom: 12 }}>Weekly Settings</p>
                <label style={{ fontSize: 12, color: "var(--text-2)", display: "block", marginBottom: 8 }}>
                  Goals per week target
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="range" min={1} max={10}
                    value={targetDraft ?? target}
                    onChange={(e) => setTargetDraft(Number(e.target.value))}
                    onMouseUp={() => { if (targetDraft !== null && targetDraft !== target) { saveTarget(targetDraft); } }}
                    onTouchEnd={() => { if (targetDraft !== null && targetDraft !== target) { saveTarget(targetDraft); } }}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)", minWidth: 20, textAlign: "center" }}>
                    {targetDraft ?? target}
                  </span>
                </div>
                <p style={{ fontSize: 10, color: "var(--text-4)", marginTop: 6 }}>
                  {targetDraft ?? target} goal{(targetDraft ?? target) !== 1 ? "s" : ""} per week
                </p>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          {/* Navigation */}
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
              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 7, background: "transparent", border: "none", cursor: "pointer", color: "var(--text-3)", fontFamily: "inherit" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              This week
            </button>
          )}
          <NavBtn onClick={() => setWeekStart(subWeeks(weekStart, 1))}><ChevronLeft size={16} /></NavBtn>
          <NavBtn onClick={() => setWeekStart(addWeeks(weekStart, 1))}><ChevronRight size={16} /></NavBtn>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>
            {completedGoals} of {target} goal{target !== 1 ? "s" : ""} completed
          </span>
          {completedGoals === target && target > 0 && (
            <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>🎉 All done!</span>
          )}
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "var(--bg-hover)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${target > 0 ? Math.min(100, (completedGoals / target) * 100) : 0}%`,
              background: completedGoals === target && target > 0 ? "#22c55e" : "var(--accent)",
              borderRadius: 3,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* Goal cards */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-sm" style={{ color: "var(--text-4)" }}>
          Loading…
        </div>
      ) : (
        <div
          style={{
            display:    "flex",
            flexWrap:   "wrap",
            gap:        12,
            flex:       1,
            alignContent: "flex-start",
            overflowY:  "auto",
          }}
        >
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onToggleGoal={toggleGoal}
              onRenameGoal={renameGoal}
              onDeleteGoal={deleteGoal}
              onAddTask={addTask}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              inboxGroupId={inboxGroupId}
            />
          ))}

          {/* Empty slots up to target */}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <EmptySlot key={`empty-${i}`} onAdd={addGoal} />
          ))}

          {/* Extra add button when at or above target */}
          {goals.length >= target && (
            <button
              onClick={addGoal}
              style={{
                minWidth: 120, flex: "0 0 auto",
                padding: "10px 16px", borderRadius: 10,
                background: "transparent", border: "1.5px dashed var(--border)",
                color: "var(--text-4)", fontSize: 12, cursor: "pointer",
                fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
              }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--accent)"; el.style.color = "var(--accent)"; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border)"; el.style.color = "var(--text-4)"; }}
            >
              <Plus size={13} /> Add goal
            </button>
          )}
        </div>
      )}
    </div>
  );
}
