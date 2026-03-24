"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInDays, parseISO } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";

interface OverdueItem {
  id: string;
  name: string;
  scheduledDate: string | null;
  deadline: string | null;
  completedAt: string | null;
  priority: string | null;
  description: string | null;
  category: string | null;
  group: { board: { id: string; name: string; color: string | null; icon: string | null } };
}

const PRIORITY_COLORS: Record<string, string> = {
  p1: "#ef4444", p2: "#f97316", p3: "#5b9cf6", p4: "#6b7280",
};

const PRIORITY_LABELS: Record<string, string> = {
  p1: "P1", p2: "P2", p3: "P3", p4: "—",
};

function daysAgoLabel(dateStr: string | null): string {
  if (!dateStr) return "";
  const days = differenceInDays(new Date(), parseISO(dateStr));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function OverduePage() {
  const queryClient = useQueryClient();
  const [detailItem, setDetailItem] = useState<OverdueItem | null>(null);

  const { data, isLoading } = useQuery<{ items: OverdueItem[] }>({
    queryKey: ["overdue"],
    queryFn: () => fetch("/api/overdue").then((r) => r.json()),
  });

  const items = data?.items ?? [];

  const overdueDate = (item: OverdueItem) => item.scheduledDate ?? item.deadline;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle size={20} style={{ color: "var(--sys-red)" }} />
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>Overdue</h1>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            {items.length} overdue task{items.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-sm" style={{ color: "var(--text-4)" }}>
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-2">
          <AlertTriangle size={32} style={{ color: "var(--text-4)" }} />
          <p className="text-sm" style={{ color: "var(--text-4)" }}>No overdue tasks</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-card)", boxShadow: "var(--card-shadow)" }}>
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderTop: idx > 0 ? "1px solid var(--border)" : "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {/* Priority dot */}
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: PRIORITY_COLORS[item.priority ?? "p4"] ?? "#6b7280" }}
                title={PRIORITY_LABELS[item.priority ?? "p4"]}
              />

              {/* Name */}
              <span className="flex-1 text-sm truncate" style={{ color: "var(--text-1)" }}>
                {item.name}
              </span>

              {/* Days ago */}
              <span className="text-xs shrink-0 font-medium" style={{ color: "var(--sys-red)" }}>
                {daysAgoLabel(overdueDate(item))}
              </span>

              {/* Project badge */}
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                style={{ backgroundColor: `${item.group.board.color ?? "#6b7280"}20`, color: "var(--text-3)" }}
              >
                {item.group.board.name}
              </span>

              {/* View button */}
              <button
                onClick={() => setDetailItem(item)}
                className="text-xs px-2.5 py-1 rounded-lg transition-colors shrink-0"
                style={{ color: "var(--chart-primary)", border: "1px solid var(--border)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                View
              </button>
            </div>
          ))}
        </div>
      )}

      {detailItem && (
        <TaskDetailModal
          item={{
            ...detailItem,
            groupId: detailItem.group.board.id,
            columnValues: [],
            subItems: [],
          }}
          onClose={() => setDetailItem(null)}
          onUpdate={async (id, patch) => {
            await fetch(`/api/items/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(patch),
            });
            queryClient.invalidateQueries({ queryKey: ["overdue"] });
            queryClient.invalidateQueries({ queryKey: ["stats"] });
          }}
          onDelete={async (id) => {
            await fetch(`/api/items/${id}`, { method: "DELETE" });
            queryClient.invalidateQueries({ queryKey: ["overdue"] });
            queryClient.invalidateQueries({ queryKey: ["stats"] });
            setDetailItem(null);
          }}
        />
      )}
    </div>
  );
}
