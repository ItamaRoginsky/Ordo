"use client";

import { useState } from "react";
import { format, isToday, isPast, parseISO } from "date-fns";
import { AlertTriangle } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";

import { useTheme } from "@/lib/theme";

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
  const { theme } = useTheme();
  const isLight = theme === "light";

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
        <button className="flex items-center justify-center gap-1 px-2 py-1 rounded-md transition-colors w-full"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          {date ? (
            <>
              {isOverdue && <AlertTriangle size={11} style={{ color: "var(--sys-red)" }} className="shrink-0" />}
              <span
                className="text-xs"
                style={{ color: isOverdue ? "var(--sys-red)" : isTodayDate ? "var(--chart-primary)" : "var(--text-3)" }}
              >
                {format(date, "MMM d")}
              </span>
              {isTodayDate && (
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--chart-primary)" }} />
              )}
            </>
          ) : (
            <span className="text-xs" style={{ color: "var(--text-4)" }}>—</span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="center"
          sideOffset={4}
          className="rounded-xl shadow-2xl p-3 z-50"
          style={{ background: "var(--bg-popover)", border: "1px solid var(--border-strong)" }}
        >
          <p className="text-[10px] uppercase tracking-widest font-medium mb-2" style={{ color: "var(--text-4)" }}>
            Due date
          </p>
          <input
            type="date"
            defaultValue={localValue ? localValue.slice(0, 10) : ""}
            onChange={(e) => handleChange(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg outline-none w-full"
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              color: "var(--text-1)",
              colorScheme: isLight ? "light" : "dark",
            }}
          />
          {localValue && (
            <button
              onClick={() => handleChange("")}
              className="mt-2 w-full text-xs transition-colors text-center py-1"
              style={{ color: "var(--text-4)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--sys-red)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-4)"; }}
            >
              Clear date
            </button>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
