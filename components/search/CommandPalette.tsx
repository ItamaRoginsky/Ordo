"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface BoardResult {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  _type: "board";
}

interface ItemResult {
  id: string;
  name: string;
  priority: string | null;
  deadline: string | null;
  group: { name: string; board: { name: string; color: string | null; id: string } };
  _type: "item";
}

type Result = BoardResult | ItemResult;

const PRI_COLORS: Record<string, string> = {
  p1: "#ef4444", p2: "#f97316", p3: "#5b9cf6", p4: "#6b7280",
};

function highlight(text: string, q: string) {
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "rgba(91,156,246,0.3)", color: "inherit", borderRadius: 2, padding: 0 }}>
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["search", query],
    queryFn: () =>
      fetch(`/api/search?q=${encodeURIComponent(query)}`).then((r) => r.json()),
    enabled: query.length >= 1,
    staleTime: 10_000,
  });

  const boards: BoardResult[] = (data?.boards ?? []).map((b: any) => ({ ...b, _type: "board" as const }));
  const items: ItemResult[] = (data?.items ?? []).map((i: any) => ({ ...i, _type: "item" as const }));
  const allResults: Result[] = [...boards, ...items];

  function select(result: Result) {
    if (result._type === "board") {
      router.push(`/boards/${result.id}`);
    } else {
      router.push(`/boards/${result.group.board.id}?item=${result.id}`);
    }
    onClose();
  }

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setSelected(0); }, [query]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, allResults.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && allResults[selected]) select(allResults[selected]);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allResults, selected]);

  return (
    <div
      className="animate-backdrop-in"
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "15vh",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="animate-fade-in-up" style={{
        width: "100%", maxWidth: 520,
        background: "var(--bg-popover)",
        border: "1px solid var(--border-strong)",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      }}>
        {/* Input */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
        }}>
          <Search size={16} style={{ color: "var(--text-3)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tasks…"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 14, color: "var(--text-1)", fontFamily: "inherit",
            }}
          />
          <kbd style={{
            fontSize: 9, padding: "2px 5px", borderRadius: 4,
            background: "var(--bg-active)", border: "1px solid var(--border)",
            color: "var(--text-3)",
          }}>Esc</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 380, overflowY: "auto" }}>
          {!query && (
            <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>
              Type to search across all projects and tasks
            </div>
          )}

          {query && allResults.length === 0 && (
            <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {query && boards.length > 0 && (
            <>
              <div style={{ padding: "8px 16px 4px", fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)" }}>
                Projects
              </div>
              {boards.map((board, i) => (
                <div
                  key={board.id}
                  onClick={() => select(board)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 16px", cursor: "pointer",
                    background: selected === i ? "var(--bg-hover)" : "transparent",
                  }}
                  onMouseEnter={() => setSelected(i)}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: "var(--bg-active)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <div style={{ width: 9, height: 9, borderRadius: 2, background: board.color ?? "#9EC5F7" }} />
                  </div>
                  <span style={{ flex: 1, fontSize: 13, color: "var(--text-1)" }}>
                    {highlight(board.name, query)}
                  </span>
                  <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "var(--bg-active)", color: "var(--text-3)" }}>
                    project
                  </span>
                </div>
              ))}
            </>
          )}

          {query && items.length > 0 && (
            <>
              <div style={{ padding: "8px 16px 4px", fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)" }}>
                Tasks
              </div>
              {items.map((item, i) => {
                const idx = i + boards.length;
                const priColor = PRI_COLORS[item.priority ?? "p4"] ?? "#6b7280";
                return (
                  <div
                    key={item.id}
                    onClick={() => select(item)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 16px", cursor: "pointer",
                      background: selected === idx ? "var(--bg-hover)" : "transparent",
                    }}
                    onMouseEnter={() => setSelected(idx)}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: item.priority && item.priority !== "p4" ? `${priColor}1a` : "var(--bg-active)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, fontSize: 9, fontWeight: 700,
                      color: priColor,
                    }}>
                      {(item.priority ?? "p4").toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {highlight(item.name, query)}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 1 }}>
                        {item.group.board.name} / {item.group.name}
                      </div>
                    </div>
                    <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "var(--bg-active)", color: "var(--text-3)", flexShrink: 0 }}>
                      task
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "8px 16px", borderTop: "1px solid var(--border)",
          display: "flex", gap: 14, fontSize: 10, color: "var(--text-3)",
        }}>
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
