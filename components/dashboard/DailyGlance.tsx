"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { t } from "@/lib/toast";

const PRIORITY_BORDER: Record<string, string> = {
  p1: "#ef4444",
  p2: "#f97316",
  p3: "#5b9cf6",
  p4: "var(--border-strong)",
};

const PRIORITIES = [
  { key: "p1", label: "High",   dot: "#ef4444" },
  { key: "p2", label: "Medium", dot: "#f97316" },
  { key: "p3", label: "Low",    dot: "#5b9cf6" },
  { key: "p4", label: "None",   dot: "var(--border-strong)" },
] as const;

type PriKey = "p1" | "p2" | "p3" | "p4";

type GlanceItem = {
  id: string;
  name: string;
  priority: string;
  group: { board: { name: string; color: string | null } };
};

type GlanceData = { p1: GlanceItem[]; p2: GlanceItem[]; p3: GlanceItem[]; p4: GlanceItem[] };

export function DailyGlance({ data }: { data: GlanceData | undefined }) {
  const [activePri, setActivePri] = useState<PriKey>("p1");
  const [showAll, setShowAll] = useState(false);
  const queryClient = useQueryClient();

  const { mutate: completeTask } = useMutation({
    mutationFn: (itemId: string) =>
      fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedAt: new Date().toISOString() }),
      }),
    onSuccess: (_data, itemId) => {
      const item = allItems.find((i) => i.id === itemId);
      t.success("Task completed", item?.name);
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["today"] });
    },
  });

  // Auto-select the first priority that has tasks
  useEffect(() => {
    if (!data) return;
    const first = (["p1", "p2", "p3", "p4"] as const).find((p) => data[p]?.length > 0);
    if (first) setActivePri(first);
  }, [data]);

  const allItems: GlanceItem[] = data?.[activePri] ?? [];
  const shown = showAll ? allItems : allItems.slice(0, 3);
  const remaining = allItems.length - 3;

  function switchPri(pri: PriKey) {
    setActivePri(pri);
    setShowAll(false);
  }

  const priLabel = PRIORITIES.find((p) => p.key === activePri)?.label.toLowerCase() ?? "";

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px 10px",
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>
          Daily Glance
        </span>
        <span style={{
          fontSize: 10,
          color: "var(--text-3)",
          background: "var(--bg-active)",
          padding: "1px 7px",
          borderRadius: 100,
          border: "1px solid var(--border)",
        }}>
          {allItems.length === 0
            ? "0 tasks"
            : showAll
              ? `${allItems.length} tasks`
              : `${Math.min(3, allItems.length)} of ${allItems.length}`}
        </span>
      </div>

      {/* Task list */}
      <div key={activePri} style={{ padding: "0 14px", flex: 1 }}>
        {allItems.length === 0 ? (
          <div className="animate-fade-in-up" style={{
            padding: "18px 0",
            textAlign: "center",
            fontSize: 11,
            color: "var(--text-3)",
          }}>
            No {priLabel} priority tasks today 🎉
          </div>
        ) : (
          shown.map((item, i) => (
            <div
              key={item.id}
              className="animate-fade-in-up"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "8px 0",
                borderBottom: i < shown.length - 1 ? "1px solid var(--border)" : "none",
                animationDelay: `${i * 50}ms`,
              }}
            >
              <button
                onClick={() => completeTask(item.id)}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  flexShrink: 0,
                  border: `2px solid ${PRIORITY_BORDER[item.priority ?? "p4"]}`,
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#22c55e";
                  e.currentTarget.style.background = "rgba(34,197,94,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = PRIORITY_BORDER[item.priority ?? "p4"];
                  e.currentTarget.style.background = "transparent";
                }}
              />
              <span style={{
                flex: 1,
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-1)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {item.name}
              </span>
              <span style={{
                fontSize: 9,
                padding: "1px 5px",
                borderRadius: 3,
                background: "var(--bg-active)",
                color: "var(--text-3)",
                border: "1px solid var(--border)",
                flexShrink: 0,
                whiteSpace: "nowrap",
                maxWidth: 80,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {item.group?.board?.name ?? "Inbox"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* View more / less */}
      {allItems.length > 3 && (
        <button
          onClick={() => setShowAll((s) => !s)}
          style={{
            padding: "7px 14px",
            background: "var(--bg-sidebar)",
            border: "none",
            borderTop: "1px solid var(--border)",
            cursor: "pointer",
            fontSize: 11,
            color: "var(--text-2)",
            fontFamily: "inherit",
            width: "100%",
            textAlign: "center",
            transition: "background 0.1s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-sidebar)"; }}
        >
          {showAll ? "↑ Show less" : `↓ View ${remaining} more`}
        </button>
      )}

      {/* Priority picker */}
      <div style={{
        display: "flex",
        gap: 5,
        padding: "10px 14px",
        borderTop: "1px solid var(--border)",
        background: "var(--bg-card)",
      }}>
        {PRIORITIES.map((pri) => (
          <button
            key={pri.key}
            onClick={() => switchPri(pri.key as PriKey)}
            style={{
              flex: 1,
              padding: "6px 4px",
              borderRadius: 7,
              border: `1px solid ${activePri === pri.key ? "var(--border-strong)" : "var(--border)"}`,
              background: activePri === pri.key ? "var(--bg-active)" : "transparent",
              fontSize: 10,
              fontWeight: activePri === pri.key ? 600 : 400,
              cursor: "pointer",
              fontFamily: "inherit",
              color: activePri === pri.key ? "var(--text-1)" : "var(--text-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              transition: "all 0.1s",
            }}
          >
            <div style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: pri.dot,
              flexShrink: 0,
            }} />
            {pri.label}
          </button>
        ))}
      </div>
    </div>
  );
}
