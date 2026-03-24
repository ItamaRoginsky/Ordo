"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check } from "lucide-react";

export const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  not_started: { label: "Not started", bg: "rgba(107,114,128,0.12)", text: "#9ca3af", border: "rgba(107,114,128,0.2)" },
  in_progress:  { label: "In progress", bg: "rgba(91,156,246,0.12)",  text: "#5b9cf6", border: "rgba(91,156,246,0.2)"  },
  done:         { label: "Done",        bg: "rgba(34,197,94,0.12)",   text: "#22c55e", border: "rgba(34,197,94,0.2)"   },
  stuck:        { label: "Stuck",       bg: "rgba(239,68,68,0.12)",   text: "#ef4444", border: "rgba(239,68,68,0.2)"   },
  review:       { label: "In review",   bg: "rgba(245,158,11,0.12)",  text: "#f59e0b", border: "rgba(245,158,11,0.2)"  },
};

const STATUS_ORDER = ["not_started", "in_progress", "review", "stuck", "done"];

interface StatusPillProps {
  value: string | null;
  itemId: string;
  columnId: string;
  onSuccess: () => void;
}

export function StatusPill({ value, itemId, columnId, onSuccess }: StatusPillProps) {
  const [local, setLocal] = useState(value);
  const [open, setOpen] = useState(false);
  const cfg = local ? STATUS_CONFIG[local] : null;

  async function pick(next: string) {
    const prev = local;
    setLocal(next);
    setOpen(false);
    try {
      await fetch("/api/column-values", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, columnId, value: next }),
      });
      // sync completedAt with "done" status
      if (next === "done") {
        await fetch(`/api/items/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completedAt: new Date().toISOString() }),
        });
      } else if (prev === "done") {
        await fetch(`/api/items/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completedAt: null }),
        });
      }
      onSuccess();
    } catch {
      setLocal(prev);
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          style={{
            // FIXED dimensions — identical on every row
            height: 22,
            padding: "0 10px",
            borderRadius: 100,
            fontSize: 11,
            fontWeight: 500,
            fontFamily: "inherit",
            whiteSpace: "nowrap",
            cursor: "pointer",
            background: cfg ? cfg.bg : "transparent",
            color: cfg ? cfg.text : "var(--text-4)",
            border: `1px solid ${cfg ? cfg.border : "var(--border)"}`,
            transition: "opacity 0.12s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        >
          {cfg ? cfg.label : "—"}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          align="center"
          style={{
            background: "var(--bg-popover)",
            border: "1px solid var(--border-strong)",
            borderRadius: 10,
            padding: 5,
            minWidth: 152,
            boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
            zIndex: 9999,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {STATUS_ORDER.map((val) => {
            const c = STATUS_CONFIG[val];
            return (
              <button
                key={val}
                onClick={() => pick(val)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: val === local ? "var(--bg-active)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  color: "var(--text-1)",
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => { if (val !== local) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { if (val !== local) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.text, flexShrink: 0 }} />
                {c.label}
                {val === local && <Check size={11} style={{ marginLeft: "auto", color: "var(--text-3)" }} />}
              </button>
            );
          })}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
