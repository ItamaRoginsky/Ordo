"use client";

import { useState, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import { useTheme } from "@/lib/theme";

const STATUSES = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "done",        label: "Done"        },
  { value: "stuck",       label: "Stuck"       },
  { value: "review",      label: "In review"   },
];

const COLORS_DARK: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  not_started: { bg: "transparent",              border: "rgba(107,114,128,0.3)", text: "#6b7280", dot: "#6b7280" },
  in_progress: { bg: "rgba(91,156,246,0.15)",    border: "rgba(91,156,246,0.3)",  text: "#5b9cf6", dot: "#5b9cf6" },
  done:        { bg: "rgba(34,197,94,0.15)",     border: "rgba(34,197,94,0.3)",   text: "#22c55e", dot: "#22c55e" },
  stuck:       { bg: "rgba(239,68,68,0.15)",     border: "rgba(239,68,68,0.3)",   text: "#ef4444", dot: "#ef4444" },
  review:      { bg: "rgba(245,158,11,0.15)",    border: "rgba(245,158,11,0.3)",  text: "#f59e0b", dot: "#f59e0b" },
};

const COLORS_LIGHT: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  not_started: { bg: "#F5F5F5",                       border: "#E0E0E0",                text: "#8A8A8E", dot: "#8A8A8E" },
  in_progress: { bg: "rgba(37,99,235,0.08)",          border: "rgba(37,99,235,0.2)",    text: "#2563EB", dot: "#2563EB" },
  done:        { bg: "rgba(52,199,89,0.08)",          border: "rgba(52,199,89,0.2)",    text: "#25a244", dot: "#34C759" },
  stuck:       { bg: "rgba(255,59,48,0.08)",          border: "rgba(255,59,48,0.2)",    text: "#FF3B30", dot: "#FF3B30" },
  review:      { bg: "rgba(255,149,0,0.08)",          border: "rgba(255,149,0,0.2)",    text: "#FF9500", dot: "#FF9500" },
};

interface StatusCellProps {
  value: string | null;
  itemId: string;
  columnId: string;
  onSuccess: () => void;
}

export function StatusCell({ value, itemId, columnId, onSuccess }: StatusCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();
  const COLORS = theme === "light" ? COLORS_LIGHT : COLORS_DARK;

  useEffect(() => { setLocalValue(value); }, [value]);

  const current = STATUSES.find((s) => s.value === localValue);
  const currentColors = localValue ? COLORS[localValue] : null;

  async function handleSelect(status: typeof STATUSES[0]) {
    const prev = localValue;
    setLocalValue(status.value);
    setOpen(false);

    try {
      await fetch("/api/column-values", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, columnId, value: status.value }),
      });

      if (status.value === "done") {
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
      setLocalValue(prev);
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="w-full px-2.5 py-1 rounded-md text-[11px] font-medium text-center transition-opacity hover:opacity-80"
          style={{
            backgroundColor: currentColors ? currentColors.bg : "transparent",
            color: currentColors ? currentColors.text : "var(--text-4)",
            border: currentColors ? `1px solid ${currentColors.border}` : "1px solid transparent",
          }}
        >
          {current?.label ?? <span style={{ color: "var(--text-4)" }}>—</span>}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="center"
          sideOffset={4}
          className="rounded-xl shadow-2xl p-1.5 z-50 min-w-[160px]"
          style={{ background: "var(--bg-popover)", border: "1px solid var(--border-strong)" }}
        >
          {STATUSES.map((s) => {
            const col = COLORS[s.value];
            return (
              <button
                key={s.value}
                onClick={() => handleSelect(s)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors text-left"
                style={{ color: "var(--text-2)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col.dot }} />
                <span>{s.label}</span>
                {localValue === s.value && (
                  <span className="ml-auto text-xs" style={{ color: "var(--text-3)" }}>✓</span>
                )}
              </button>
            );
          })}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
