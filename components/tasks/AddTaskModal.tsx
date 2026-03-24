"use client";

import { useState, useEffect, useRef } from "react";
import {
  format,
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
import * as Popover from "@radix-ui/react-popover";
import { X, Flag, Tag, ChevronLeft, ChevronRight, Calendar, Send } from "lucide-react";

export interface NewTask {
  name: string;
  description?: string;
  scheduledDate?: Date;
  deadline?: Date;
  priority: "p1" | "p2" | "p3" | "p4";
  category?: string;
  projectId: string;
  isToday: boolean;
}

interface AddTaskModalProps {
  defaultDate?: Date;
  defaultProjectId?: string;
  defaultPriority?: string;
  projects: { id: string; name: string; color: string | null; icon: string | null }[];
  inboxProject: { id: string; name: string } | null;
  onClose: () => void;
  onSave: (task: NewTask) => Promise<void>;
  compact?: boolean;
}

const PRIORITY_CONFIG = {
  p1: { label: "P1", color: "#ef4444", bg: "bg-red-500/20 text-red-400 border-red-500/30" },
  p2: { label: "P2", color: "#f97316", bg: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  p3: { label: "P3", color: "#5b9cf6", bg: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  p4: { label: "P4", color: "#6b7280", bg: "bg-white/[0.06] text-white/30 border-white/10" },
};

const SUBMIT_BG: Record<string, string> = {
  p1: "bg-red-500 hover:bg-red-600",
  p2: "bg-orange-500 hover:bg-orange-600",
  p3: "bg-[#5b9cf6] hover:bg-[#4a8de8]",
  p4: "bg-[#5b9cf6] hover:bg-[#4a8de8]",
};

function MiniCalendar({
  selected,
  onSelect,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  const [viewMonth, setViewMonth] = useState(selected ?? new Date());
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div className="w-56">
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          className="p-1 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/80 transition-colors"
        >
          <ChevronLeft size={13} />
        </button>
        <span className="text-xs font-medium" style={{ color: "var(--text-2)" }}>
          {format(viewMonth, "MMMM yyyy")}
        </span>
        <button
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="p-1 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/80 transition-colors"
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
              className={`h-7 w-full rounded text-[11px] transition-colors ${
                sel
                  ? "bg-[#5b9cf6] text-white font-medium"
                  : tod
                  ? "text-[#5b9cf6] font-medium hover:bg-white/[0.06]"
                  : otherMonth
                  ? "text-white/15 hover:bg-white/[0.04]"
                  : "text-white/65 hover:bg-white/[0.06]"
              }`}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DatePickerPopover({
  value,
  onChange,
}: {
  value: Date | null;
  onChange: (d: Date | null) => void;
}) {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const thisWeekend = nextSaturday(today);
  const nextWeek = nextMonday(today);

  const quickOpts = [
    { label: "Today", sub: format(today, "EEE"), icon: "☀️", date: today },
    { label: "Tomorrow", sub: format(tomorrow, "EEE"), icon: "🌅", date: tomorrow },
    { label: "This weekend", sub: format(thisWeekend, "EEE"), icon: "📅", date: thisWeekend },
    { label: "Next week", sub: format(nextWeek, "EEE d"), icon: "➡️", date: nextWeek },
  ];

  return (
    <div className="p-3 space-y-3">
      <div className="space-y-0.5">
        {quickOpts.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onChange(opt.date)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-sm">{opt.icon}</span>
              <span className="text-sm text-white/75">{opt.label}</span>
            </div>
            <span className="text-xs text-white/30">{opt.sub}</span>
          </button>
        ))}
        <button
          onClick={() => onChange(null)}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 transition-colors"
        >
          <span className="text-sm">⊘</span>
          <span className="text-sm">No date</span>
        </button>
      </div>
      <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <MiniCalendar selected={value} onSelect={onChange} />
      </div>
    </div>
  );
}

function PriorityPickerPopover({
  value,
  onChange,
}: {
  value: "p1" | "p2" | "p3" | "p4";
  onChange: (p: "p1" | "p2" | "p3" | "p4") => void;
}) {
  const opts: { key: "p1" | "p2" | "p3" | "p4"; label: string; color: string }[] = [
    { key: "p1", label: "Priority 1", color: "#ef4444" },
    { key: "p2", label: "Priority 2", color: "#f97316" },
    { key: "p3", label: "Priority 3", color: "#5b9cf6" },
    { key: "p4", label: "Priority 4", color: "#6b7280" },
  ];

  return (
    <div className="p-1.5 w-44">
      {opts.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.06] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Flag size={13} style={{ color: opt.color }} />
            <span className="text-sm text-white/75">{opt.label}</span>
          </div>
          {value === opt.key && <span className="text-[#5b9cf6] text-xs">✓</span>}
        </button>
      ))}
    </div>
  );
}

export function AddTaskModal({
  defaultDate,
  defaultProjectId,
  defaultPriority,
  projects,
  inboxProject,
  onClose,
  onSave,
  compact = false,
}: AddTaskModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | null>(defaultDate ?? new Date());
  const [priority, setPriority] = useState<"p1" | "p2" | "p3" | "p4">(
    (defaultPriority as "p1" | "p2" | "p3" | "p4") ?? "p4"
  );
  const [category, setCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState(false);
  const [projectId, setProjectId] = useState(
    defaultProjectId ?? inboxProject?.id ?? projects[0]?.id ?? ""
  );
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const allProjects = [
    ...(inboxProject ? [{ id: inboxProject.id, name: inboxProject.name, color: "#6b7280", icon: "📥" }] : []),
    ...projects,
  ];

  const selectedProject = allProjects.find((p) => p.id === projectId);
  const isDateToday = scheduledDate ? isSameDay(scheduledDate, new Date()) : false;

  async function handleSubmit() {
    if (!name.trim() || saving) return;
    setSaving(true);
    await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      scheduledDate: scheduledDate ?? undefined,
      priority,
      category: category.trim() || undefined,
      projectId,
      isToday: isDateToday,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="rounded-xl shadow-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)" }}>
      {/* Name + description */}
      <div className={`${compact ? "px-3 pt-3 pb-1.5" : "px-4 pt-4 pb-2"}`}>
        <input
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
            if (e.key === "Escape") onClose();
          }}
          placeholder="Task name"
          className="w-full text-sm font-medium bg-transparent outline-none"
          style={{ color: "var(--text-1)" }}
        />
        {!compact && (
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
            placeholder="Description"
            className="w-full text-xs bg-transparent outline-none mt-1.5"
            style={{ color: "var(--text-3)" }}
          />
        )}
      </div>

      {/* Active chips */}
      {(scheduledDate || priority !== "p4" || category) && (
        <div className="px-4 py-2 flex items-center gap-1.5 flex-wrap" style={{ borderTop: "1px solid var(--border)" }}>
          {scheduledDate && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e]">
              <Calendar size={10} />
              {isDateToday ? "Today" : format(scheduledDate, "MMM d")}
              <button onClick={() => setScheduledDate(null)} className="hover:text-white ml-0.5">
                <X size={9} />
              </button>
            </span>
          )}
          {priority !== "p4" && (
            <span
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${PRIORITY_CONFIG[priority].bg}`}
            >
              <Flag size={10} style={{ color: PRIORITY_CONFIG[priority].color }} />
              {PRIORITY_CONFIG[priority].label}
              <button onClick={() => setPriority("p4")} className="hover:text-white ml-0.5">
                <X size={9} />
              </button>
            </span>
          )}
          {category && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-white/[0.1] bg-white/[0.05] text-white/50">
              <Tag size={10} />
              {category}
              <button onClick={() => setCategory("")} className="hover:text-white ml-0.5">
                <X size={9} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className={`${compact ? "px-3 py-1.5" : "px-4 py-2"} flex items-center gap-1`} style={{ borderTop: "1px solid var(--border)" }}>
        {/* Date picker */}
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              className={`${compact ? "p-1 w-6 h-6" : "p-1.5"} rounded-lg text-white/35 hover:text-white/70 hover:bg-white/[0.06] transition-colors flex items-center justify-center`}
              title="Set date"
            >
              <Calendar size={compact ? 12 : 14} />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="rounded-xl shadow-2xl z-[60] w-64"
              style={{ background: "var(--bg-popover)", border: "1px solid var(--border-strong)" }}
              sideOffset={6}
            >
              <DatePickerPopover value={scheduledDate} onChange={(d) => setScheduledDate(d)} />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {/* Priority picker */}
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              className={`${compact ? "p-1 w-6 h-6" : "p-1.5"} rounded-lg hover:bg-white/[0.06] transition-colors flex items-center justify-center`}
              title="Set priority"
              style={{ color: priority !== "p4" ? PRIORITY_CONFIG[priority].color : "rgba(255,255,255,0.35)" }}
            >
              <Flag size={compact ? 12 : 14} />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="rounded-xl shadow-2xl z-[60]"
              style={{ background: "var(--bg-popover)", border: "1px solid var(--border-strong)" }}
              sideOffset={6}
            >
              <PriorityPickerPopover value={priority} onChange={setPriority} />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {/* Category */}
        <button
          onClick={() => setEditingCategory(true)}
          className={`${compact ? "p-1 w-6 h-6" : "p-1.5"} rounded-lg text-white/35 hover:text-white/70 hover:bg-white/[0.06] transition-colors flex items-center justify-center`}
          title="Add category"
        >
          <Tag size={compact ? 12 : 14} />
        </button>
        {editingCategory && (
          <input
            autoFocus
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onBlur={() => setEditingCategory(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") setEditingCategory(false);
            }}
            placeholder="Category…"
            className="text-xs bg-white/[0.06] border border-white/[0.1] rounded-lg px-2 py-1 text-white/70 outline-none w-24 placeholder:text-white/25"
          />
        )}
      </div>

      {/* Footer */}
      <div className={`${compact ? "px-3 py-2" : "px-4 py-3"} flex items-center justify-between`} style={{ borderTop: "1px solid var(--border)", background: "var(--bg-sidebar)" }}>
        {/* Project selector */}
        <Popover.Root>
          <Popover.Trigger asChild>
            <button className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.06]">
              <span>{selectedProject?.icon ?? "📋"}</span>
              <span>{selectedProject?.name ?? "Inbox"}</span>
              <ChevronRight size={10} className="rotate-90 text-white/30" />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="rounded-xl shadow-2xl z-[60] p-1.5 w-48"
              style={{ background: "var(--bg-popover)", border: "1px solid var(--border-strong)" }}
              sideOffset={6}
              align="start"
            >
              {allProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProjectId(p.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/[0.06] transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: p.color ?? "#6b7280" }}
                  />
                  <span className="text-sm truncate" style={{ color: "var(--text-2)" }}>{p.name}</span>
                  {p.id === projectId && <span className="ml-auto text-[#5b9cf6] text-xs">✓</span>}
                </button>
              ))}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
          >
            <X size={15} />
          </button>
          {compact ? (
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || saving}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-white transition-colors disabled:opacity-40 ${SUBMIT_BG[priority]}`}
            >
              <Send size={13} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || saving}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-colors disabled:opacity-40 ${SUBMIT_BG[priority]}`}
            >
              <Send size={12} />
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
