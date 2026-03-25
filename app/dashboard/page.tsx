"use client";

import { useQuery } from "@tanstack/react-query";
import { format, getWeek } from "date-fns";
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
import { DailyGlance } from "@/components/dashboard/DailyGlance";
import { DayProgress } from "@/components/dashboard/DayProgress";

interface StatsData {
  userName: string | null;
  doneThisWeek: number;
  openTasks: number;
  overdueTasks: number;
  completionRate: number;
  streak: number;
  todayCount: number;
  todayDoneCount: number;
  tasksByProject: { name: string; color: string; count: number }[];
  upcomingDeadlines: {
    id: string;
    name: string;
    deadline: string;
    boardName: string;
    boardColor: string | null;
    priority: string | null;
  }[];

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
  dailyGlance: {
    p1: { id: string; name: string; priority: string; group: { board: { name: string; color: string | null } } }[];
    p2: { id: string; name: string; priority: string; group: { board: { name: string; color: string | null } } }[];
    p3: { id: string; name: string; priority: string; group: { board: { name: string; color: string | null } } }[];
    p4: { id: string; name: string; priority: string; group: { board: { name: string; color: string | null } } }[];
  };
  dayProgress: {
    total: number;
    done: number;
    byPriority: {
      high:   { done: number; total: number };
      medium: { done: number; total: number };
      low:    { done: number; total: number };
    };
  };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}


export default function DashboardPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { data, isLoading } = useQuery<StatsData>({
    queryKey: ["stats"],
    queryFn: () => fetch("/api/stats").then((r) => r.json()),
    refetchInterval: 60_000,
  });

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
            {getGreeting()}{data.userName ? `, ${data.userName}` : ""} —{" "}
            {todayCount > 0
              ? `${todayCount} task${todayCount !== 1 ? "s" : ""} planned for today`
              : "nothing planned for today"}
            {overdueTasks > 0 && (
              <span style={{ color: "var(--sys-red)" }}>, {overdueTasks} overdue</span>
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
              {streak} day streak
            </p>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard value={doneThisWeek} label="Done this week" barColor="#22c55e"
          barWidth={doneThisWeek > 0 ? Math.min(100, (doneThisWeek / Math.max(openTasks, 1)) * 100) : 0}
          href="/done" />
        <KpiCard value={openTasks} label="Open tasks" barColor="var(--chart-primary)"
          barWidth={openTasks > 0 ? Math.min(100, (openTasks / Math.max(openTasks + doneThisWeek, 1)) * 100) : 0}
          href="/today" />
        <KpiCard value={overdueTasks}
          label={overdueTasks === 0 ? "No overdue tasks" : "Overdue"}
          barColor={overdueTasks === 0 ? "#22c55e" : "var(--sys-red)"}
          barWidth={overdueTasks === 0 ? 100 : Math.min(100, (overdueTasks / Math.max(openTasks, 1)) * 100)}
          valueColor={overdueTasks > 0 ? "var(--sys-red)" : undefined}
          href={overdueTasks > 0 ? "/overdue" : undefined}
        />
        <KpiCard value={`${completionRate}%`} label="Completion rate" barColor="#a855f7"
          barWidth={completionRate} sub={`${todayDoneCount} done today`} />
      </div>

      {/* Day Progress + Open Projects */}
      <div className="grid grid-cols-2 gap-4">
        <DayProgress data={data.dayProgress} />

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

        <DailyGlance data={data.dailyGlance} />
      </div>
    </div>
  );
}

function KpiCard({
  value, label, sub, barColor, barWidth, valueColor, href,
}: {
  value: string | number;
  label: string;
  sub?: string;
  barColor: string;
  barWidth: number;
  valueColor?: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-3xl font-semibold tracking-tight mt-1"
        style={{ color: valueColor ?? "var(--text-1)" }}>
        {value}
      </p>
      <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{label}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-4)" }}>{sub}</p>}
      <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: "var(--border)" }}>
        <div className="h-full transition-all" style={{ width: `${barWidth}%`, backgroundColor: barColor }} />
      </div>
    </>
  );

  const cardStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-card)", boxShadow: "var(--card-shadow)" };

  if (href) {
    return (
      <Link href={href} className="p-4 relative overflow-hidden flex flex-col transition-opacity hover:opacity-80" style={cardStyle}>
        {inner}
      </Link>
    );
  }

  return (
    <div className="p-4 relative overflow-hidden flex flex-col" style={cardStyle}>
      {inner}
    </div>
  );
}
