"use client";

import { useRouter } from "next/navigation";

interface Seg { done: number; total: number }
interface Props {
  data: {
    total: number;
    done: number;
    byPriority: { high: Seg; medium: Seg; low: Seg };
  };
}

function pctOf(seg: Seg) {
  return seg.total > 0 ? Math.round((seg.done / seg.total) * 100) : 0;
}

export function DayProgress({ data }: Props) {
  const router = useRouter();
  const { total, done, byPriority } = data;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const remaining = total - done;

  const r = 24;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  const ringColor =
    pct === 100 ? "#22c55e" :
    pct >= 50   ? "#5b9cf6" :
    pct >= 20   ? "#f97316" :
    "rgba(255,255,255,0.15)";

  const segments = [
    { label: "High priority", color: "#ef4444", seg: byPriority.high   },
    { label: "Medium",        color: "#f97316", seg: byPriority.medium },
    { label: "Low / none",    color: "#5b9cf6", seg: byPriority.low    },
  ];

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      height: "100%",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>
          Day progress
        </span>
        <span style={{
          fontSize: 10, color: "var(--text-3)",
          background: "var(--bg-active)", padding: "1px 7px",
          borderRadius: 100, border: "1px solid var(--border)",
        }}>
          {pct}% complete
        </span>
      </div>

      {/* Ring + stat rows */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Ring */}
        <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
          <svg width="80" height="80" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={r} fill="none"
              stroke="var(--bg-active)" strokeWidth="7" />
            <circle cx="32" cy="32" r={r} fill="none"
              stroke={ringColor} strokeWidth="7"
              strokeDasharray={circ}
              strokeDashoffset={total === 0 ? circ : offset}
              strokeLinecap="round"
              transform="rotate(-90 32 32)"
              style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 17, fontWeight: 600, color: "var(--text-1)", lineHeight: 1 }}>
              {done}/{total}
            </span>
            <span style={{ fontSize: 9, color: "var(--text-3)", marginTop: 2 }}>tasks</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ flex: 1 }}>
          {[
            { label: "Done today", value: done,      color: "#22c55e"        },
            { label: "Remaining",  value: remaining, color: "var(--text-1)" },
          ].map((row) => (
            <div key={row.label} style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", padding: "5px 0",
              borderBottom: "1px solid var(--border)", fontSize: 12,
            }}>
              <span style={{ color: "var(--text-2)" }}>{row.label}</span>
              <span style={{ fontWeight: 500, color: row.color }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Priority bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {segments.map(({ label, color, seg }) => (
          <div key={label}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: 11, marginBottom: 4,
            }}>
              <span style={{ color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: color, display: "inline-block",
                }} />
                {label}
              </span>
              <span style={{ color: "var(--text-3)" }}>
                {seg.done}/{seg.total}
              </span>
            </div>
            <div style={{
              height: 5, background: "var(--bg-active)",
              borderRadius: 100, overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${pctOf(seg)}%`,
                background: color,
                borderRadius: 100,
                opacity: seg.total === 0 ? 0.2 : 1,
                transition: "width 0.5s ease",
                minWidth: seg.done > 0 ? 4 : 0,
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {total === 0 ? (
        <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center" }}>
          Nothing planned —{" "}
          <span
            onClick={() => router.push("/today")}
            style={{ color: "var(--chart-primary)", cursor: "pointer" }}
          >
            open My Day
          </span>
        </div>
      ) : (
        <button
          onClick={() => router.push("/today")}
          style={{
            fontSize: 11, color: "var(--text-3)", background: "transparent",
            border: "none", cursor: "pointer", fontFamily: "inherit",
            textAlign: "left", padding: 0, marginTop: "auto",
          }}
        >
          → Open My Day
        </button>
      )}
    </div>
  );
}
