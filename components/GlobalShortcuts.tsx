"use client";

import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CommandPalette } from "@/components/search/CommandPalette";
import { t } from "@/lib/toast";
import { X } from "lucide-react";

// ─── Quick-add modal (add task to today from anywhere) ────────────────────────

const PRIORITY_OPTS = [
  { key: "p1", label: "High",   color: "#ef4444" },
  { key: "p2", label: "Medium", color: "#f97316" },
  { key: "p3", label: "Low",    color: "#5b9cf6" },
  { key: "p4", label: "None",   color: "#6b7280" },
] as const;

function QuickAddModal({ onClose }: { onClose: () => void }) {
  const [name, setName]         = useState("");
  const [priority, setPriority] = useState<string>("p2");
  const [loading, setLoading]   = useState(false);
  const inputRef                = useRef<HTMLInputElement>(null);
  const queryClient             = useQueryClient();

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function submit() {
    const n = name.trim();
    if (!n) return;
    setLoading(true);
    try {
      const { groupId } = await fetch("/api/inbox").then((r) => r.json());
      if (!groupId) { t.error("Couldn't find inbox"); return; }
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          name: n,
          priority: priority !== "p4" ? priority : null,
          isToday: true,
        }),
      });
      if (res.ok) {
        t.success("Added to today", n);
        queryClient.invalidateQueries({ queryKey: ["today"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        queryClient.invalidateQueries({ queryKey: ["daily-glance"] });
        onClose();
      } else {
        t.error("Failed to add task");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 9990, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed", top: "22%", left: "50%", transform: "translateX(-50%)",
          zIndex: 9991, width: "100%", maxWidth: 440,
          background: "var(--bg-card)", border: "1px solid var(--border-strong)",
          borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.4)", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 12px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Add to today</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <kbd style={{ fontSize: 9, padding: "2px 5px", borderRadius: 4, background: "var(--bg-active)", border: "1px solid var(--border)", color: "var(--text-3)" }}>
              Ctrl A
            </kbd>
            <button
              onClick={onClose}
              style={{ width: 24, height: 24, borderRadius: 5, background: "var(--bg-active)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 16 }}>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") onClose();
            }}
            placeholder="Task name…"
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 14,
              background: "var(--bg-input)", border: "1px solid var(--border)",
              color: "var(--text-1)", fontFamily: "inherit", outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--border)"; }}
          />

          {/* Priority picker */}
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            {PRIORITY_OPTS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPriority(p.key)}
                style={{
                  flex: 1, padding: "6px 4px", borderRadius: 7, cursor: "pointer",
                  border: `1px solid ${priority === p.key ? p.color : "var(--border)"}`,
                  background: priority === p.key ? `${p.color}18` : "transparent",
                  fontSize: 10, fontWeight: priority === p.key ? 600 : 400,
                  color: priority === p.key ? p.color : "var(--text-3)",
                  fontFamily: "inherit", transition: "all 0.1s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                {p.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button
              onClick={onClose}
              style={{ flex: 1, padding: "9px", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", fontSize: 12, color: "var(--text-2)", cursor: "pointer", fontFamily: "inherit" }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={loading || !name.trim()}
              style={{
                flex: 2, padding: "9px", borderRadius: 8, border: "none",
                background: loading || !name.trim() ? "var(--bg-active)" : "var(--text-1)",
                fontSize: 12, fontWeight: 500,
                color: loading || !name.trim() ? "var(--text-3)" : "var(--bg-card)",
                cursor: loading || !name.trim() ? "not-allowed" : "pointer",
                fontFamily: "inherit", transition: "all 0.15s",
              }}
            >
              {loading ? "Adding…" : "Add to today"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Global shortcut listener ─────────────────────────────────────────────────

export function GlobalShortcuts() {
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setQuickAddOpen(false);
        setSearchOpen((s) => !s);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "a" && !isInput) {
        e.preventDefault();
        setSearchOpen(false);
        setQuickAddOpen((s) => !s);
        return;
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {searchOpen   && <CommandPalette onClose={() => setSearchOpen(false)} />}
      {quickAddOpen && <QuickAddModal  onClose={() => setQuickAddOpen(false)} />}
    </>
  );
}
