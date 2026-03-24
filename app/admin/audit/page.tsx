"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  targetId: string | null;
  targetType: string | null;
  meta: string | null;
  createdAt: string;
  actor: { name: string | null; email: string };
}

const ACTION_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  USER_INVITED:    { label: "Invited",     bg: "rgba(91,156,246,0.15)",  color: "#5b9cf6" },
  USER_SUSPENDED:  { label: "Suspended",   bg: "rgba(255,59,48,0.12)",   color: "var(--sys-red)" },
  USER_REACTIVATED:{ label: "Reactivated", bg: "rgba(52,199,89,0.15)",   color: "var(--sys-green)" },
  USER_DELETED:    { label: "Deleted",     bg: "rgba(255,59,48,0.12)",   color: "var(--sys-red)" },
  ADMIN_GRANTED:   { label: "Admin granted", bg: "rgba(168,85,247,0.15)", color: "#a855f7" },
  ADMIN_REVOKED:   { label: "Admin revoked", bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
};

function ActionBadge({ action }: { action: string }) {
  const style = ACTION_STYLES[action] ?? { label: action, bg: "var(--bg-active)", color: "var(--text-3)" };
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: style.bg, color: style.color }}>
      {style.label}
    </span>
  );
}

export default function AdminAuditPage() {
  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["admin-audit"],
    queryFn: () => fetch("/api/users/audit").then((r) => r.json()),
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Activity size={20} style={{ color: "var(--chart-primary)" }} />
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>Audit log</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-sm" style={{ color: "var(--text-4)" }}>Loading…</div>
      ) : logs.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-sm" style={{ color: "var(--text-4)" }}>No audit events yet</div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-card)", boxShadow: "var(--card-shadow)" }}>
          {/* Header */}
          <div className="grid grid-cols-[140px_1fr_120px_1fr] gap-4 px-4 py-2.5"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-sidebar)" }}>
            {["When", "Who", "Action", "Target"].map((h) => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-4)" }}>{h}</span>
            ))}
          </div>

          {logs.map((log, idx) => {
            let targetEmail = "";
            try { targetEmail = log.meta ? JSON.parse(log.meta).email ?? "" : ""; } catch {}

            return (
              <div key={log.id}
                className="grid grid-cols-[140px_1fr_120px_1fr] items-center gap-4 px-4 py-3"
                style={{ borderTop: idx > 0 ? "1px solid var(--border)" : "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <span className="text-xs" style={{ color: "var(--text-3)" }}>
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                </span>
                <div className="min-w-0">
                  <span className="text-sm truncate block" style={{ color: "var(--text-1)" }}>
                    {log.actor.name ?? log.actor.email}
                  </span>
                </div>
                <ActionBadge action={log.action} />
                <span className="text-xs truncate" style={{ color: "var(--text-3)" }}>
                  {targetEmail || log.targetId || "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
