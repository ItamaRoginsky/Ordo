"use client";

import { useState, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import { useTheme } from "@/lib/theme";

const PRIORITIES = [
  { value: "p1", label: "P1 — High"        },
  { value: "p2", label: "P2 — Medium"      },
  { value: "p3", label: "P3 — Low"         },
  { value: "p4", label: "P4 — No priority" },
];

const COLORS_DARK: Record<string, { dot: string; text: string; bg: string; border: string }> = {
  p1: { dot: "#ef4444", text: "#ef4444", bg: "rgba(239,68,68,0.15)",    border: "rgba(239,68,68,0.3)"    },
  p2: { dot: "#f97316", text: "#f97316", bg: "rgba(249,115,22,0.15)",   border: "rgba(249,115,22,0.3)"   },
  p3: { dot: "#5b9cf6", text: "#5b9cf6", bg: "rgba(91,156,246,0.15)",   border: "rgba(91,156,246,0.3)"   },
  p4: { dot: "#6b7280", text: "#6b7280", bg: "transparent",             border: "rgba(107,114,128,0.2)"  },
};

const COLORS_LIGHT: Record<string, { dot: string; text: string; bg: string; border: string }> = {
  p1: { dot: "#FF3B30", text: "#FF3B30", bg: "rgba(255,59,48,0.08)",    border: "rgba(255,59,48,0.2)"    },
  p2: { dot: "#FF9500", text: "#FF9500", bg: "rgba(255,149,0,0.08)",    border: "rgba(255,149,0,0.2)"    },
  p3: { dot: "#2563EB", text: "#2563EB", bg: "rgba(37,99,235,0.08)",    border: "rgba(37,99,235,0.2)"    },
  p4: { dot: "#C7C7CC", text: "#8A8A8E", bg: "rgba(0,0,0,0.04)",       border: "rgba(0,0,0,0.08)"       },
};

interface PriorityCellProps {
  value: string | null;
  itemId: string;
  columnId: string;
  onSuccess: () => void;
}

export function PriorityCell({ value, itemId, columnId, onSuccess }: PriorityCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();
  const COLORS = theme === "light" ? COLORS_LIGHT : COLORS_DARK;

  useEffect(() => { setLocalValue(value); }, [value]);

  const current = PRIORITIES.find((p) => p.value === localValue);
  const currentColors = localValue ? COLORS[localValue] : null;

  async function handleSelect(priority: typeof PRIORITIES[0]) {
    const prev = localValue;
    setLocalValue(priority.value);
    setOpen(false);
    try {
      await fetch("/api/column-values", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, columnId, value: priority.value }),
      });
      onSuccess();
    } catch {
      setLocalValue(prev);
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors w-full justify-center"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
          {current && currentColors ? (
            <>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: currentColors.dot }} />
              <span className="text-[11px] font-medium" style={{ color: currentColors.text }}>{current.label}</span>
            </>
          ) : (
            <span className="text-[11px]" style={{ color: "var(--text-4)" }}>—</span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="center"
          sideOffset={4}
          className="rounded-xl shadow-2xl p-1.5 z-50 min-w-[160px]"
          style={{ background: "var(--bg-popover)", border: "1px solid var(--border-strong)" }}
        >
          {PRIORITIES.map((p) => {
            const col = COLORS[p.value];
            return (
              <button
                key={p.value}
                onClick={() => handleSelect(p)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors text-left"
                style={{ color: "var(--text-2)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col.dot }} />
                <span>{p.label}</span>
                {localValue === p.value && (
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
