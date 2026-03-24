"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO, getWeek } from "date-fns";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/lib/theme";

interface StatsData {
  doneThisWeek: number;
  openTasks: number;
  overdueTasks: number;
  completionRate: number;
  streak: number;
  todayCount: number;
  todayDoneCount: number;
  tasksByProject: { name: string; color: string; count: number }[];
  projectProgress: {
    id: string;
    name: string;
    color: string;
    icon: string;
    totalSteps: number;
    doneSteps: number;
    overdueSteps: number;
    lastActivityAt: string | null;
  }[];
  weeklyVelocity: { day: string; date: string; completed: number }[];
  todayAgenda: {
    id: string;
    name: string;
    boardName: string;
    boardColor: string | null;
    priority: string | null;
    status: string | null;
  }[];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const PRIORITY_COLORS_DARK: Record<string, string> = {
  p1: "#ef4444", p2: "#f97316", p3: "#5b9cf6", p4: "#6b7280",
  critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#6b7280",
};
const PRIORITY_COLORS_LIGHT: Record<string, string> = {
  p1: "#FF3B30", p2: "#FF9500", p3: "#2563EB", p4: "#C7C7CC",
  critical: "#FF3B30", high: "#FF9500", medium: "#FF9500", low: "#C7C7CC",
};

const STATUS_COLORS_DARK: Record<string, string> = {
  done: "#22c55e", in_progress: "#5b9cf6", stuck: "#ef4444", review: "#a855f7", not_started: "#6b7280",
};
const STATUS_COLORS_LIGHT: Record<string, string> = {
  done: "#34C759", in_progress: "#2563EB", stuck: "#FF3B30", review: "#AF52DE", not_started: "#8A8A8E",
};

export default function DashboardPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { data, isLoading } = useQuery<StatsData>({
    queryKey: ["stats"],
    queryFn: () => fetch("/api/stats").then((r) => r.json()),
    refetchInterval: 60_000,
  });

  const PRIORITY_COLORS = isLight ? PRIORITY_COLORS_LIGHT : PRIORITY_COLORS_DARK;
  const STATUS_COLORS = isLight ? STATUS_COLORS_LIGHT : STATUS_COLORS_DARK;

  const chartColors = {
    axis:    isLight ? "#C7C7CC" : "rgba(255,255,255,0.3)",
    grid:    isLight ? "#F2F2F7" : "rgba(255,255,255,0.04)",
    bar:     isLight ? "#2563EB" : "#5b9cf6",
    tooltip: {
      bg:     isLight ? "#FFFFFF" : "#252525",
      border: isLight ? "#E8E8E8" : "rgba(255,255,255,0.1)",
      text:   isLight ? "#000000" : "rgba(255,255,255,0.9)",
    },
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--text-4)" }}>
        Loading…
      </div>
    );
  }

  const today = new Date();
  const weekNum = getWeek(today);
  const { doneThisWeek, openTasks, overdueTasks, completionRate, streak, todayCount, todayDoneCount } = data;

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg px-3 py-2 text-xs shadow-xl"
        style={{ background: chartColors.tooltip.bg, border: `1px solid ${chartColors.tooltip.border}` }}>
        <p className="mb-0.5" style={{ color: chartColors.axis }}>{label}</p>
        <p className="font-medium" style={{ color: chartColors.tooltip.text }}>{payload[0].value} completed</p>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-5">
      {/* Greeting banner */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-card)", boxShadow: "var(--card-shadow)" }}>
        <div>
          <p className="text-base font-medium" style={{ color: "var(--text-1)" }}>
            {getGreeting()},{" "}
            {data.todayAgenda.length > 0
              ? `you have ${todayCount} task${todayCount !== 1 ? "s" : ""} planned for today`
              : "nothing planned for today — add tasks in My Day ☀️"}
            {overdueTasks > 0 && (
              <span style={{ color: "var(--sys-red)" }}> and {overdueTasks} overdue</span>
            )}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-3)" }}>
            {format(today, "EEEE, MMMM d")}
          </p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className="text-xs" style={{ color: "var(--text-4)" }}>Week {weekNum}</p>
          {streak > 0 && (
            <p className="text-sm font-medium mt-0.5 text-[#f59e0b]">
              🔥 {streak} day streak
            </p>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard emoji="✅" value={doneThisWeek} label="Done this week" barColor="#22c55e"
          barWidth={doneThisWeek > 0 ? Math.min(100, (doneThisWeek / Math.max(openTasks, 1)) * 100) : 0} />
        <KpiCard emoji="📋" value={openTasks} label="Open tasks" barColor="var(--chart-primary)"
          barWidth={openTasks > 0 ? Math.min(100, (openTasks / Math.max(openTasks + doneThisWeek, 1)) * 100) : 0} />
        <KpiCard emoji="⚠️" value={overdueTasks}
          label={overdueTasks === 0 ? "No overdue tasks 🎉" : "Overdue"}
          barColor={overdueTasks === 0 ? "#22c55e" : "var(--sys-red)"}
          barWidth={overdueTasks === 0 ? 100 : Math.min(100, (overdueTasks / Math.max(openTasks, 1)) * 100)}
          valueColor={overdueTasks > 0 ? "var(--sys-red)" : undefined}
          extra={overdueTasks > 0 ? (
            <Link href="/today" className="text-[10px] transition-colors mt-0.5 block" style={{ color: "var(--sys-red)", opacity: 0.7 }}>
              → Review now
            </Link>
          ) : null}
        />
        <KpiCard emoji="📈" value={`${completionRate}%`} label="Completion rate" barColor="#a855f7"
          barWidth={completionRate} sub={`${todayDoneCount} done today`} />
      </div>

      {/* Today agenda + Open Projects */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-card)", boxShadow: "var(--card-shadow)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium" style={{ color: "var(--text-2)" }}>Today&apos;s agenda</h2>
            <Link href="/today" className="text-[11px] transition-colors" style={{ color: "var(--chart-primary)", opacity: 0.7 }}>
              View all →
            </Link>
          </div>
          {data.todayAgenda.length === 0 ? (
            <p className="text-sm py-4" style={{ color: "var(--text-4)" }}>Nothing planned for today — add tasks in My Day ☀️</p>
          ) : (
            <div className="space-y-1">
              {data.todayAgenda.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5 py-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: PRIORITY_COLORS[item.priority ?? ""] ?? "var(--text-4)" }} />
                  <span className="text-sm flex-1 truncate" style={{ color: "var(--text-2)" }}>{item.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: `${STATUS_COLORS[item.status ?? ""] ?? "var(--text-4)"}20`,
                      color: STATUS_COLORS[item.status ?? ""] ?? "var(--text-3)",
                    }}>
                    {item.status?.replace("_", " ") ?? "—"}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: `${item.boardColor ?? "var(--text-4)"}20`, color: "var(--text-3)" }}>
                    {item.boardName}
                  </span>
                </div>
              ))}
              {todayCount > 6 && (
                <Link href="/today" className="text-xs transition-colors block pt-1" style={{ color: "var(--text-3)" }}>
                  + {todayCount - 6} more
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-card)", boxShadow: "var(--card-shadow)" }}>
          <h2 className="text-sm font-medium mb-4" style={{ color: "var(--text-2)" }}>Open projects</h2>
          {data.projectProgress.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm" style={{ color: "var(--text-4)" }}>No projects yet</p>
              <Link href="/boards" className="text-xs transition-colors mt-1 block" style={{ color: "var(--chart-primary)", opacity: 0.7 }}>
                Create your first project →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {[...data.projectProgress]
                .sort((a, b) => {
                  const aComplete = a.totalSteps > 0 && a.doneSteps === a.totalSteps;
                  const bComplete = b.totalSteps > 0 && b.doneSteps === b.totalSteps;
                  if (aComplete && !bComplete) return 1;
                  if (!aComplete && bComplete) return -1;
                  return 0;
                })
                .map((p) => {
                  const pct = p.totalSteps > 0 ? Math.round((p.doneSteps / p.totalSteps) * 100) : 0;
                  const complete = p.totalSteps > 0 && pct === 100;
                  return (
                    <Link key={p.id} href={`/boards/${p.id}`} className="block group/proj">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{p.icon}</span>
                          <span className="text-sm font-medium" style={{ color: complete ? "var(--text-4)" : "var(--text-2)" }}>
                            {p.name}
                          </span>
                          {complete && <span className="text-[10px]" style={{ color: "var(--sys-green)" }}>✓ Complete</span>}
                        </div>
                        <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
                          {p.doneSteps}/{p.totalSteps} steps
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "var(--border)" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: complete ? "var(--sys-green)" : p.color }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: complete ? "var(--sys-green)" : "var(--text-4)" }}>
                          {pct}% complete
                        </span>
                        {p.overdueSteps > 0 && (
                          <span className="text-[10px]" style={{ color: "var(--sys-red)" }}>{p.overdueSteps} overdue</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-card)", boxShadow: "var(--card-shadow)" }}>
          <h2 className="text-sm font-medium mb-4" style={{ color: "var(--text-2)" }}>Weekly velocity</h2>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={data.weeklyVelocity} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <XAxis dataKey="day" tick={{ fill: chartColors.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: chartColors.axis, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--bg-hover)" }} />
              <Bar dataKey="completed" fill={chartColors.bar} radius={[4, 4, 0, 0]} maxBarSize={32} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-card)", boxShadow: "var(--card-shadow)" }}>
          <h2 className="text-sm font-medium mb-4" style={{ color: "var(--text-2)" }}>Open tasks by project</h2>
          {data.tasksByProject.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: "var(--text-4)" }}>No open tasks</p>
          ) : (
            <div className="space-y-2.5 mt-2">
              {data.tasksByProject.map((p) => {
                const max = Math.max(...data.tasksByProject.map((x) => x.count));
                return (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-xs w-24 truncate shrink-0 text-right" style={{ color: "var(--text-3)" }}>{p.name}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${(p.count / max) * 100}%`, backgroundColor: p.color, opacity: 0.8 }} />
                    </div>
                    <span className="text-xs w-6 shrink-0" style={{ color: "var(--text-3)" }}>{p.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  emoji, value, label, sub, barColor, barWidth, valueColor, extra,
}: {
  emoji: string;
  value: string | number;
  label: string;
  sub?: string;
  barColor: string;
  barWidth: number;
  valueColor?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="p-4 relative overflow-hidden flex flex-col"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-card)", boxShadow: "var(--card-shadow)" }}>
      <div className="text-lg absolute top-3 right-3 opacity-50">{emoji}</div>
      <p className="text-3xl font-semibold tracking-tight mt-1"
        style={{ color: valueColor ?? "var(--text-1)" }}>
        {value}
      </p>
      <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{label}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-4)" }}>{sub}</p>}
      {extra}
      <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: "var(--border)" }}>
        <div className="h-full transition-all" style={{ width: `${barWidth}%`, backgroundColor: barColor }} />
      </div>
    </div>
  );
}
