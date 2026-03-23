"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";

const PRIORITIES = [
  { value: "low",      label: "Low",      color: "#6b7280" },
  { value: "medium",   label: "Medium",   color: "#f59e0b" },
  { value: "high",     label: "High",     color: "#f97316" },
  { value: "critical", label: "Critical", color: "#ef4444" },
];

interface PriorityCellProps {
  value: string | null;
  itemId: string;
  columnId: string;
  onSuccess: () => void;
}

export function PriorityCell({ value, itemId, columnId, onSuccess }: PriorityCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const [open, setOpen] = useState(false);

  const current = PRIORITIES.find((p) => p.value === localValue);

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
        <button className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/[0.05] transition-colors w-full justify-center">
          {current ? (
            <>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: current.color }}
              />
              <span className="text-[11px] font-medium" style={{ color: current.color }}>
                {current.label}
              </span>
            </>
          ) : (
            <span className="text-white/15 text-[11px]">—</span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="center"
          sideOffset={4}
          className="bg-[#252525] border border-white/[0.09] rounded-xl shadow-2xl p-1.5 z-50 min-w-[150px]"
        >
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              onClick={() => handleSelect(p)}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm hover:bg-[#2e2e2e] transition-colors text-left"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-white/80">{p.label}</span>
              {localValue === p.value && (
                <span className="ml-auto text-white/40 text-xs">✓</span>
              )}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
