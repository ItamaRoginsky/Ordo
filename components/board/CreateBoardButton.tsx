"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

const ICONS   = ["📋", "🚀", "💡", "🎯", "📊", "🛠️", "📅", "⭐", "🔥", "💼"];
const COLORS  = ["#0073ea", "#e2445c", "#00c875", "#fdab3d", "#a25ddc", "#037f4c", "#ff642e", "#579bfc"];

const FORMAT_EXAMPLE = {
  name: "Product Roadmap",
  icon: "🚀",
  color: "#0073ea",
  groups: [
    {
      name: "Backlog",
      color: "#579bfc",
      items: [
        {
          name: "Design new landing page",
          notes: "Optional description",
          priority: "high",
          scheduledDate: "2026-04-01",
          deadline: "2026-06-30",
        },
      ],
    },
    {
      name: "In Progress",
      color: "#fdab3d",
      items: [],
    },
    {
      name: "Done",
      color: "#00c875",
      items: [],
    },
  ],
};

const FORMAT_STR = JSON.stringify(FORMAT_EXAMPLE, null, 2);

type Mode = "manual" | "json";

export function CreateBoardButton() {
  const [open, setOpen]       = useState(false);
  const [mode, setMode]       = useState<Mode>("manual");

  // manual form
  const [name, setName]       = useState("");
  const [icon, setIcon]       = useState("📋");
  const [color, setColor]     = useState("#0073ea");

  // json form
  const [jsonText, setJsonText] = useState("");
  const [showFormat, setShowFormat] = useState(false);
  const [copied, setCopied]   = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const router = useRouter();

  // parse + validate as user types
  const jsonError = useMemo(() => {
    if (!jsonText.trim()) return null;
    try {
      const parsed = JSON.parse(jsonText);
      if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null)
        return "Must be a JSON object { … }";
      if (!parsed.name || typeof parsed.name !== "string")
        return 'Missing required field: "name"';
      return null;
    } catch {
      return "Invalid JSON — check for missing quotes or commas";
    }
  }, [jsonText]);

  function resetAndClose() {
    setOpen(false);
    setError("");
    setJsonText("");
    setShowFormat(false);
    setName("");
    setMode("manual");
  }

  async function handleManual(e: React.FormEvent) {
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
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to create project");
      const board = await res.json();
      resetAndClose();
      router.push(`/boards/${board.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (jsonError || !jsonText.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/boards/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonText,
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Import failed");
      const board = await res.json();
      resetAndClose();
      router.push(`/boards/${board.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function copyFormat() {
    await navigator.clipboard.writeText(FORMAT_STR);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const canSubmitJson = !!jsonText.trim() && !jsonError;

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
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={resetAndClose}
        >
          <div
            className="rounded-2xl p-6 w-full shadow-2xl"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-strong)",
              maxWidth: 440,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-1)" }}>
                New project
              </h2>
              <button
                onClick={resetAndClose}
                style={{ color: "var(--text-4)" }}
                className="transition-colors"
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-4)"; }}
              >
                <X size={17} />
              </button>
            </div>

            {/* Tab switcher */}
            <div
              className="flex rounded-lg p-0.5 mb-5 text-sm"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
            >
              {(["manual", "json"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(""); }}
                  className="flex-1 py-1.5 rounded-md font-medium transition-all"
                  style={{
                    background:  mode === m ? "var(--bg-card)"    : "transparent",
                    color:       mode === m ? "var(--text-1)"     : "var(--text-3)",
                    boxShadow:   mode === m ? "var(--card-shadow)" : "none",
                  }}
                >
                  {m === "manual" ? "Manual" : "From JSON"}
                </button>
              ))}
            </div>

            {/* ── MANUAL TAB ── */}
            {mode === "manual" && (
              <form onSubmit={handleManual} className="space-y-4">
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
                          border:     icon === i ? "1px solid var(--chart-primary)" : "1px solid var(--border)",
                          background: icon === i ? "var(--accent-subtle)"           : "transparent",
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

                {error && <p className="text-xs" style={{ color: "#e2445c" }}>{error}</p>}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={resetAndClose}
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
            )}

            {/* ── FROM JSON TAB ── */}
            {mode === "json" && (
              <form onSubmit={handleImport} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                      Paste JSON
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowFormat((v) => !v)}
                      className="flex items-center gap-1 text-xs transition-colors"
                      style={{ color: "var(--chart-primary)" }}
                    >
                      View format
                      {showFormat ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>

                  <textarea
                    rows={9}
                    placeholder={'{\n  "name": "My Project",\n  "groups": [...]\n}'}
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    spellCheck={false}
                    className="w-full rounded-lg px-3 py-2.5 text-xs outline-none transition-all font-mono resize-none"
                    style={{
                      background:  "var(--bg-input)",
                      border:      `1px solid ${jsonText && jsonError ? "#e2445c" : "var(--border)"}`,
                      color:       "var(--text-1)",
                      lineHeight:  1.6,
                    }}
                    autoFocus
                  />

                  {/* inline parse error */}
                  {jsonText && jsonError && (
                    <p className="mt-1 text-xs" style={{ color: "#e2445c" }}>{jsonError}</p>
                  )}
                </div>

                {/* format reference (collapsible) */}
                {showFormat && (
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    <div
                      className="flex items-center justify-between px-3 py-2"
                      style={{ background: "var(--bg-popover)", borderBottom: "1px solid var(--border)" }}
                    >
                      <span className="text-xs font-medium" style={{ color: "var(--text-2)" }}>
                        Format reference
                      </span>
                      <button
                        type="button"
                        onClick={copyFormat}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors"
                        style={{
                          background: copied ? "var(--accent-subtle)" : "var(--bg-hover)",
                          color:      copied ? "var(--chart-primary)" : "var(--text-2)",
                          border:     "1px solid var(--border)",
                        }}
                      >
                        {copied ? <Check size={11} /> : <Copy size={11} />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <pre
                      className="text-xs overflow-x-auto px-3 py-3 font-mono"
                      style={{
                        background:  "var(--bg-input)",
                        color:       "var(--text-2)",
                        lineHeight:  1.65,
                        maxHeight:   220,
                        overflowY:   "auto",
                      }}
                    >
                      {FORMAT_STR}
                    </pre>
                    <div
                      className="px-3 py-2 space-y-0.5"
                      style={{ background: "var(--bg-popover)", borderTop: "1px solid var(--border)" }}
                    >
                      {[
                        ["name", "string — required"],
                        ["icon", "emoji string — optional"],
                        ["color", "hex color — optional"],
                        ["groups[].name", "string — optional"],
                        ["groups[].color", "hex color — optional"],
                        ["items[].priority", '"high" | "medium" | "low"'],
                        ["items[].scheduledDate", '"YYYY-MM-DD" — optional'],
                        ["items[].deadline", '"YYYY-MM-DD" — optional'],
                      ].map(([field, desc]) => (
                        <div key={field} className="flex items-baseline gap-2 text-xs">
                          <code style={{ color: "var(--chart-primary)", minWidth: 160 }}>{field}</code>
                          <span style={{ color: "var(--text-3)" }}>{desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {error && <p className="text-xs" style={{ color: "#e2445c" }}>{error}</p>}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="flex-1 px-4 py-2 text-sm rounded-lg transition-colors"
                    style={{ color: "var(--text-3)", border: "1px solid var(--border)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !canSubmitJson}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-40"
                    style={{ background: "var(--chart-primary)" }}
                  >
                    {loading ? "Importing…" : "Create from JSON"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
