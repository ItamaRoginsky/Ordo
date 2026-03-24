"use client";

import {
  format,
  parseISO,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
  nextSaturday,
  nextMonday,
} from "date-fns";
import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";

function MiniCalendar({
  selected,
  onSelect,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  const [viewMonth, setViewMonth] = useState(selected ?? new Date());
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 }),
  });

  return (
    <div className="w-56">
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          className="p-1 rounded transition-colors"
          style={{ color: "var(--text-4)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-4)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <ChevronLeft size={13} />
        </button>
        <span className="text-xs font-medium" style={{ color: "var(--text-2)" }}>
          {format(viewMonth, "MMMM yyyy")}
        </span>
        <button
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="p-1 rounded transition-colors"
          style={{ color: "var(--text-4)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-4)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <ChevronRight size={13} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="text-center text-[10px] py-0.5" style={{ color: "var(--text-4)" }}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const sel = selected && isSameDay(day, selected);
          const tod = isToday(day);
          const otherMonth = !isSameMonth(day, viewMonth);
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelect(day)}
              className="h-7 w-full rounded text-[11px] transition-colors"
              style={{
                background: sel ? "var(--chart-primary)" : "transparent",
                color: sel ? "#fff" : tod ? "var(--chart-primary)" : otherMonth ? "var(--text-4)" : "var(--text-2)",
                fontWeight: sel || tod ? 500 : 400,
              }}
              onMouseEnter={(e) => { if (!sel) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { if (!sel) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface DatePickerProps {
  value: string | null;
  onChange: (iso: string | null) => void;
  placeholder?: string;
  /** Render a compact icon-only trigger */
  compact?: boolean;
}

export function DatePicker({ value, onChange, placeholder = "Set date", compact = false }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : null;

  const today = new Date();
  const quickOpts = [
    { label: "Today",        sub: format(today, "EEE"),            icon: "☀️", date: today },
    { label: "Tomorrow",     sub: format(addDays(today, 1), "EEE"), icon: "🌅", date: addDays(today, 1) },
    { label: "This weekend", sub: format(nextSaturday(today), "EEE"), icon: "📅", date: nextSaturday(today) },
    { label: "Next week",    sub: format(nextMonday(today), "EEE d"), icon: "➡️", date: nextMonday(today) },
  ];

  function pick(date: Date | null) {
    onChange(date ? date.toISOString() : null);
    setOpen(false);
  }

  const label = selected
    ? (isToday(selected) ? "Today" : format(selected, "MMM d, yyyy"))
    : placeholder;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        {compact ? (
          <button
            className="flex items-center gap-1.5 text-[11px] w-full text-left px-1.5 py-1 rounded-md -mx-1.5 transition-colors"
            style={{ color: selected ? "var(--text-2)" : "var(--text-4)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            {label}
          </button>
        ) : (
          <button
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: selected ? "var(--text-2)" : "var(--text-4)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = selected ? "var(--text-1)" : "var(--text-2)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = selected ? "var(--text-2)" : "var(--text-4)"; }}
          >
            <Calendar size={12} style={{ flexShrink: 0 }} />
            {label}
          </button>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="rounded-xl shadow-2xl z-[60] w-64"
          style={{ background: "var(--bg-popover)", border: "1px solid var(--border-strong)" }}
          sideOffset={6}
          align="start"
        >
          <div className="p-3 space-y-3">
            <div className="space-y-0.5">
              {quickOpts.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => pick(opt.date)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{opt.icon}</span>
                    <span className="text-sm" style={{ color: "var(--text-2)" }}>{opt.label}</span>
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-4)" }}>{opt.sub}</span>
                </button>
              ))}
              <button
                onClick={() => pick(null)}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ color: "var(--text-3)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <X size={13} />
                <span className="text-sm">Clear date</span>
              </button>
            </div>
            <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              <MiniCalendar selected={selected} onSelect={(d) => pick(d)} />
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
