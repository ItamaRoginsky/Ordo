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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), icon, color }),
    });
    const board = await res.json();
    setLoading(false);
    setOpen(false);
    setName("");
    router.push(`/boards/${board.id}`);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3.5 py-2 text-sm text-[#5b9cf6] border border-[#5b9cf6]/25 rounded-lg hover:bg-[#5b9cf6]/10 transition-colors"
      >
        <Plus size={14} />
        New Board
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
          <div className="bg-[#1e1e1e] border border-white/[0.09] rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white/90">New Board</h2>
              <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/70 transition-colors">
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/40 uppercase tracking-widest mb-1.5">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Product Roadmap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#252525] border border-white/[0.1] text-white/90 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5b9cf6]/60 focus:ring-2 focus:ring-[#5b9cf6]/10 placeholder:text-white/20 transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/40 uppercase tracking-widest mb-1.5">Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {ICONS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className={`w-9 h-9 text-lg rounded-lg flex items-center justify-center border transition-colors ${
                        icon === i
                          ? "border-[#5b9cf6]/60 bg-[#5b9cf6]/15"
                          : "border-white/[0.08] hover:border-white/20 bg-white/[0.03]"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/40 uppercase tracking-widest mb-1.5">Color</label>
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
                  className="flex-1 px-4 py-2 text-sm text-white/40 border border-white/[0.1] rounded-lg hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-[#5b9cf6] text-white rounded-lg hover:bg-[#4a8de8] disabled:opacity-40 transition-colors"
                >
                  {loading ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
