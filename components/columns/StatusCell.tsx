"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";

const STATUSES = [
  { value: "not_started", label: "Not started", color: "#6b7280" },
  { value: "in_progress", label: "In progress", color: "#5b9cf6" },
  { value: "done",        label: "Done",        color: "#22c55e" },
  { value: "stuck",       label: "Stuck",       color: "#ef4444" },
  { value: "review",      label: "In review",   color: "#f59e0b" },
];

interface StatusCellProps {
  value: string | null;
  itemId: string;
  columnId: string;
  onSuccess: () => void;
}

export function StatusCell({ value, itemId, columnId, onSuccess }: StatusCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const [open, setOpen] = useState(false);

  const current = STATUSES.find((s) => s.value === localValue);

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

      // If done, set completedAt
      if (status.value === "done") {
        await fetch(`/api/items/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completedAt: new Date().toISOString() }),
        });
      } else if (prev === "done") {
        // Undoing done
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
            backgroundColor: current ? `${current.color}22` : "transparent",
            color: current?.color ?? "#ffffff30",
          }}
        >
          {current?.label ?? <span className="text-white/15">—</span>}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="center"
          sideOffset={4}
          className="bg-[#252525] border border-white/[0.09] rounded-xl shadow-2xl p-1.5 z-50 min-w-[160px]"
        >
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => handleSelect(s)}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm hover:bg-[#2e2e2e] transition-colors text-left"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-white/80">{s.label}</span>
              {localValue === s.value && (
                <span className="ml-auto text-white/40 text-xs">✓</span>
              )}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
