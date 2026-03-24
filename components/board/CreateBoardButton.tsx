"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

const ICONS = ["📋", "🚀", "💡", "🎯", "📊", "🛠️", "📅", "⭐", "🔥", "💼"];
const COLORS = ["#0073ea", "#e2445c", "#00c875", "#fdab3d", "#a25ddc", "#037f4c", "#ff642e", "#579bfc"];

export function CreateBoardButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📋");
  const [color, setColor] = useState("#0073ea");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), icon, color }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }
      const board = await res.json();
      setOpen(false);
      setName("");
      router.push(`/boards/${board.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3.5 py-2 text-sm rounded-lg transition-colors"
        style={{ color: "var(--chart-primary)", border: "1px solid var(--border)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--accent-subtle)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <Plus size={14} />
        New project
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setOpen(false)}>
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-1)" }}>New project</h2>
              <button onClick={() => setOpen(false)} style={{ color: "var(--text-4)" }} className="transition-colors"
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-4)"; }}>
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: "var(--text-3)" }}>Name</label>
                <input
                  type="text"
                  placeholder="e.g. Product Roadmap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: "var(--text-3)" }}>Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {ICONS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className="w-9 h-9 text-lg rounded-lg flex items-center justify-center transition-colors"
                      style={{
                        border: icon === i ? "1px solid var(--chart-primary)" : "1px solid var(--border)",
                        background: icon === i ? "var(--accent-subtle)" : "transparent",
                      }}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: "var(--text-3)" }}>Color</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        color === c ? "border-white/70 scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2 text-sm rounded-lg transition-colors"
                  style={{ color: "var(--text-3)", border: "1px solid var(--border)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-40"
                  style={{ background: "var(--chart-primary)" }}
                >
                  {loading ? "Creating…" : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
