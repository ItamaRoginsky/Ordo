"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { Search, Trash2, CheckCircle2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

interface DoneItem {
  id: string;
  name: string;
  completedAt: string;
  priority: string | null;
  group: { board: { id: string; name: string; color: string | null; icon: string | null } };
}

const PRIORITY_COLORS: Record<string, string> = {
  p1: "#ef4444", p2: "#f97316", p3: "#5b9cf6", p4: "#6b7280",
};

function groupByDate(items: DoneItem[]) {
  const groups: { label: string; date: string; items: DoneItem[] }[] = [];
  const map = new Map<string, DoneItem[]>();

  for (const item of items) {
    const date = item.completedAt.slice(0, 10);
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(item);
  }

  for (const [date, dateItems] of map) {
    const parsed = parseISO(date);
    let label: string;
    if (isToday(parsed)) label = "Today";
    else if (isYesterday(parsed)) label = "Yesterday";
    else label = format(parsed, "EEEE, MMMM d");
    groups.push({ label, date, items: dateItems });
  }

  return groups;
}

export default function DonePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading } = useQuery<{ items: DoneItem[] }>({
    queryKey: ["done"],
    queryFn: () => fetch("/api/done").then((r) => r.json()),
  });

  const items = data?.items ?? [];

  const filtered = useMemo(() => {
    let result = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (sortAsc) result = [...result].reverse();
    return result;
  }, [items, search, sortAsc]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  async function deleteItem(id: string) {
    await fetch("/api/done", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    queryClient.invalidateQueries({ queryKey: ["done"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
  }

  async function clearAll() {
    setDeleting(true);
    await fetch("/api/done", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    queryClient.invalidateQueries({ queryKey: ["done"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
    setClearOpen(false);
    setDeleting(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={20} style={{ color: "var(--sys-green)" }} />
          <div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>Done</h1>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              {items.length} completed task{items.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {items.length > 0 && (
          <Dialog.Root open={clearOpen} onOpenChange={setClearOpen}>
            <Dialog.Trigger asChild>
              <button
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: "var(--sys-red)", border: "1px solid var(--border)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                Clear all
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay
                className="fixed inset-0 z-50"
                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
              />
              <Dialog.Content
                className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm p-6 rounded-2xl"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
              >
                <Dialog.Title className="text-base font-semibold mb-2" style={{ color: "var(--text-1)" }}>
                  Clear all completed tasks?
                </Dialog.Title>
                <Dialog.Description className="text-sm mb-5" style={{ color: "var(--text-3)" }}>
                  This will permanently delete all {items.length} completed tasks. This action cannot be undone.
                </Dialog.Description>
                <div className="flex gap-3 justify-end">
                  <Dialog.Close asChild>
                    <button
                      className="px-4 py-2 text-sm rounded-xl"
                      style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    onClick={clearAll}
                    disabled={deleting}
                    className="px-4 py-2 text-sm rounded-xl font-medium"
                    style={{ background: "var(--sys-red)", color: "#fff", opacity: deleting ? 0.6 : 1 }}
                  >
                    {deleting ? "Clearing…" : "Clear all"}
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <Search size={13} style={{ color: "var(--text-4)" }} />
          <input
            type="text"
            placeholder="Search completed tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-1)" }}
          />
        </div>
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="px-3 py-2 text-xs rounded-xl transition-colors"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-3)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}
        >
          {sortAsc ? "Oldest first" : "Newest first"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-sm" style={{ color: "var(--text-4)" }}>
          Loading…
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-2">
          <CheckCircle2 size={32} style={{ color: "var(--text-4)" }} />
          <p className="text-sm" style={{ color: "var(--text-4)" }}>
            {search ? "No matching tasks" : "No completed tasks yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.date}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-4)" }}>
                {group.label}
              </p>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-card)", boxShadow: "var(--card-shadow)" }}>
                {group.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3 group/row"
                    style={{
                      borderTop: idx > 0 ? "1px solid var(--border)" : "none",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <div className="w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center"
                      style={{ borderColor: "#22c55e", background: "#22c55e" }}>
                      <span className="text-white text-[7px] font-bold">✓</span>
                    </div>
                    {item.priority && item.priority !== "p4" && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: PRIORITY_COLORS[item.priority] ?? "#6b7280" }} />
                    )}
                    <span className="flex-1 text-sm truncate"
                      style={{ color: "var(--text-3)", textDecoration: "line-through", opacity: 0.7 }}>
                      {item.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: `${item.group.board.color ?? "#6b7280"}20`, color: "var(--text-3)" }}>
                      {item.group.board.name}
                    </span>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="opacity-0 group-hover/row:opacity-100 transition-opacity p-1 rounded"
                      style={{ color: "var(--text-4)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--sys-red)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-4)"; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
