"use client";

import { useState } from "react";
import { format, isToday, isPast, parseISO } from "date-fns";
import { AlertTriangle } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";

interface DateCellProps {
  value: string | null;       // ISO date string
  itemId: string;
  columnId: string;
  completedAt?: string | null;
  onSuccess: () => void;
}

export function DateCell({ value, itemId, columnId, completedAt, onSuccess }: DateCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const [open, setOpen] = useState(false);

  const date = localValue ? parseISO(localValue) : null;
  const isOverdue = date && !completedAt && isPast(date) && !isToday(date);
  const isTodayDate = date && isToday(date);

  async function handleChange(dateStr: string) {
    const prev = localValue;
    setLocalValue(dateStr || null);
    setOpen(false);

    try {
      await Promise.all([
        fetch("/api/column-values", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, columnId, value: dateStr || null }),
        }),
        fetch(`/api/items/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduledDate: dateStr ? new Date(dateStr).toISOString() : null }),
        }),
      ]);
      onSuccess();
    } catch {
      setLocalValue(prev);
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button className="flex items-center justify-center gap-1 px-2 py-1 rounded-md hover:bg-white/[0.05] transition-colors w-full">
          {date ? (
            <>
              {isOverdue && <AlertTriangle size={11} className="text-red-400 shrink-0" />}
              <span
                className={`text-xs ${
                  isOverdue ? "text-red-400" : isTodayDate ? "text-[#5b9cf6]" : "text-white/50"
                }`}
              >
                {format(date, "MMM d")}
              </span>
              {isTodayDate && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#5b9cf6] shrink-0" />
              )}
            </>
          ) : (
            <span className="text-white/15 text-xs">—</span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="center"
          sideOffset={4}
          className="bg-[#252525] border border-white/[0.09] rounded-xl shadow-2xl p-3 z-50"
        >
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium mb-2">
            Due date
          </p>
          <input
            type="date"
            defaultValue={localValue ? localValue.slice(0, 10) : ""}
            onChange={(e) => handleChange(e.target.value)}
            className="bg-[#1c1c1c] border border-white/[0.1] text-white/80 text-sm px-3 py-1.5 rounded-lg outline-none focus:border-[#5b9cf6]/50 w-full [color-scheme:dark]"
          />
          {localValue && (
            <button
              onClick={() => handleChange("")}
              className="mt-2 w-full text-xs text-white/30 hover:text-red-400 transition-colors text-center py-1"
            >
              Clear date
            </button>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
