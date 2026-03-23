"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { LayoutDashboard, CheckCircle2, CircleDot, AlertTriangle, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface StatsData {
  doneThisWeek: number;
  openTasks: number;
  overdueTasks: number;
  completionRate: number;
  tasksByProject: { name: string; count: number; color: string | null }[];
  upcomingDeadlines: { id: string; name: string; scheduledDate: string; boardName: string; boardColor: string | null }[];
  weeklyVelocity: { date: string; count: number }[];
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="bg-[#1c1c1c] rounded-xl border border-white/[0.07] p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${accent}18` }}>
          <div style={{ color: accent }}>{icon}</div>
        </div>
      </div>
      <p className="text-3xl font-semibold text-white/90 tracking-tight">{value}</p>
      <p className="text-sm text-white/40 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-white/25 mt-1">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#252525] border border-white/[0.08] rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-white/50 mb-0.5">{label}</p>
      <p className="text-white/90 font-medium">{payload[0].value} tasks</p>
    </div>
  );
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery<StatsData>({
    queryKey: ["stats"],
    queryFn: () => fetch("/api/stats").then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-white/25 text-sm">
        Loading…
      </div>
    );
  }

  const stats = data!;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <LayoutDashboard size={20} className="text-[#a855f7]" />
        <h1 className="text-xl font-semibold text-white/90 tracking-tight">Dashboard</h1>
      </div>
      <p className="text-sm text-white/30 mb-8 ml-8">
        {format(new Date(), "EEEE, MMMM d")}
      </p>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={<CheckCircle2 size={16} />}
          label="Done this week"
          value={stats.doneThisWeek}
          accent="#22c55e"
        />
        <KpiCard
          icon={<CircleDot size={16} />}
          label="Open tasks"
          value={stats.openTasks}
          accent="#5b9cf6"
        />
        <KpiCard
          icon={<AlertTriangle size={16} />}
          label="Overdue"
          value={stats.overdueTasks}
          accent="#ef4444"
        />
        <KpiCard
          icon={<TrendingUp size={16} />}
          label="Completion rate"
          value={`${stats.completionRate}%`}
          sub="this week"
          accent="#a855f7"
        />
      </div>

      <div className="grid grid-cols-5 gap-4 mb-4">
        {/* Tasks by project */}
        <div className="col-span-3 bg-[#1c1c1c] rounded-xl border border-white/[0.07] p-5">
          <h2 className="text-sm font-medium text-white/60 mb-4">Tasks by project</h2>
          {stats.tasksByProject.length === 0 ? (
            <p className="text-white/20 text-sm text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={stats.tasksByProject}
                layout="vertical"
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {stats.tasksByProject.map((entry, i) => (
                    <Cell key={i} fill={entry.color ?? "#5b9cf6"} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Upcoming deadlines */}
        <div className="col-span-2 bg-[#1c1c1c] rounded-xl border border-white/[0.07] p-5">
          <h2 className="text-sm font-medium text-white/60 mb-4">Upcoming deadlines</h2>
          {stats.upcomingDeadlines.length === 0 ? (
            <p className="text-white/20 text-sm text-center py-8">No upcoming deadlines</p>
          ) : (
            <div className="space-y-2">
              {stats.upcomingDeadlines.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5 py-1.5 border-b border-white/[0.04] last:border-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                    style={{ backgroundColor: item.boardColor ?? "#6b7280" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/70 truncate">{item.name}</p>
                    <p className="text-[10px] text-white/25">{item.boardName}</p>
                  </div>
                  <span className="text-[10px] text-white/35 shrink-0">
                    {format(parseISO(item.scheduledDate), "MMM d")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weekly velocity */}
      <div className="bg-[#1c1c1c] rounded-xl border border-white/[0.07] p-5">
        <h2 className="text-sm font-medium text-white/60 mb-4">Weekly velocity (last 7 days)</h2>
        {stats.weeklyVelocity.every((d) => d.count === 0) ? (
          <p className="text-white/20 text-sm text-center py-6">No completions yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={stats.weeklyVelocity} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => format(parseISO(v), "EEE")}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="count" fill="#5b9cf6" radius={[4, 4, 0, 0]} maxBarSize={32} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
