"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sun, Moon, LogOut, MoreHorizontal, Trash2, Plus, X, Search, Shield } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Board, User } from "@prisma/client";
import { useTheme } from "@/lib/theme";
import { CommandPalette } from "@/components/search/CommandPalette";


const DOT_COLORS = [
  "#5b9cf6", "#34d399", "#f59e0b", "#f87171", "#a78bfa",
  "#38bdf8", "#fb923c", "#e879f9",
];

interface SidebarProps {
  boards: Board[];
  user: User | null;
}

export function Sidebar({ boards, user }: SidebarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
    <div
      style={{
        width: 224,
        height: "100vh",
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontWeight: 700, color: "var(--text-1)", fontSize: 17, letterSpacing: "-0.01em", fontFamily: "'Gelasio', serif" }}>
          Ordo
        </span>
      </div>

      {/* Search button */}
      <div style={{ padding: "8px 14px 4px" }}>
        <button
          onClick={() => setSearchOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            width: "100%", padding: "6px 10px", borderRadius: 7,
            background: "var(--bg-active)", border: "1px solid var(--border)",
            fontSize: 12, color: "var(--text-3)", cursor: "pointer",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}
        >
          <Search size={13} />
          Search
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingTop: 8, paddingBottom: 8 }}>
        {/* My Space section */}
        <div style={{ padding: "10px 16px 4px" }}>
          <span style={{ color: "var(--text-4)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
            My Space
          </span>
        </div>
        <nav style={{ padding: "0 8px", marginBottom: 12 }}>
          <NavItem href="/dashboard" label="Home"    active={pathname === "/dashboard" || pathname === "/"}
            prefetchKey={["stats"]} prefetchUrl="/api/stats" />
          <NavItem href="/today"     label="My Day"  active={pathname === "/today"}
            prefetchKey={["today", new Date().toISOString().split("T")[0]]}
            prefetchUrl={`/api/today?date=${new Date().toISOString().split("T")[0]}`} />
          <NavItem href="/week"      label="My Week" active={pathname === "/week"}
            prefetchKey={["week"]} prefetchUrl="/api/week" />
        </nav>

        <div style={{ margin: "0 12px 8px", borderTop: "1px solid var(--border)" }} />

        {/* Projects section */}
        <div style={{ padding: "10px 16px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-4)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
            Projects
          </span>
          <NewProjectButton />
        </div>
        <div style={{ padding: "0 8px" }}>
          {boards.map((board, i) => (
            <BoardItem
              key={board.id}
              board={board}
              index={i}
              active={pathname.startsWith(`/boards/${board.id}`)}
            />
          ))}
          {boards.length === 0 && (
            <p style={{ padding: "8px 12px", fontSize: 12, color: "var(--text-4)" }}>No projects yet</p>
          )}
        </div>
      </div>

      {/* Admin link */}
      {user?.isAdmin && (
        <div style={{ padding: "4px 8px 8px" }}>
          <Link
            href="/admin/users"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 12px", borderRadius: 8, fontSize: 13,
              color: pathname.startsWith("/admin") ? "var(--text-1)" : "var(--text-3)",
              background: pathname.startsWith("/admin") ? "var(--bg-active)" : "transparent",
              textDecoration: "none", transition: "color 0.12s, background 0.12s",
            }}
            onMouseEnter={(e) => {
              if (!pathname.startsWith("/admin")) {
                (e.currentTarget as HTMLElement).style.color = "var(--text-1)";
                (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (!pathname.startsWith("/admin")) {
                (e.currentTarget as HTMLElement).style.color = "var(--text-3)";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }
            }}
          >
            <Shield size={13} />
            Admin
          </Link>
        </div>
      )}

      {/* User footer */}
      <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px" }}>
          {user?.picture ? (
            <img src={user.picture} alt="" style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(91,156,246,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {user?.name?.[0] ?? "?"}
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>
              {user?.name}
            </p>
            <p style={{ fontSize: 10, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email}
            </p>
          </div>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              width: 28, height: 28, borderRadius: 7,
              background: "var(--bg-active)",
              border: "1px solid var(--border)",
              cursor: "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-3)",
            }}
          >
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
        <a
          href="/auth/logout"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, fontSize: 12, color: "var(--text-3)", textDecoration: "none" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <LogOut size={13} />
          <span>Sign out</span>
        </a>
      </div>
    </div>

    {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} />}
    </>
  );
}

function NavItem({ href, label, active, prefetchKey, prefetchUrl }: {
  href: string;
  label: string;
  active: boolean;
  prefetchKey?: unknown[];
  prefetchUrl?: string;
}) {
  const queryClient = useQueryClient();

  function handleMouseEnter(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!active) {
      (e.currentTarget as HTMLElement).style.color = "var(--text-1)";
      (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
    }
    // Prefetch data so it's ready when user clicks
    if (prefetchKey && prefetchUrl) {
      queryClient.prefetchQuery({
        queryKey: prefetchKey,
        queryFn: () => fetch(prefetchUrl).then((r) => r.json()),
        staleTime: 60_000,
      });
    }
  }

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "6px 12px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        color: active ? "var(--text-1)" : "var(--text-3)",
        background: active ? "var(--bg-active)" : "transparent",
        borderRight: active ? "2px solid var(--nav-active-border)" : "2px solid transparent",
        textDecoration: "none",
        marginBottom: 2,
        transition: "color 0.12s, background 0.12s",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = "var(--text-3)";
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }
      }}
    >
      {label}
    </Link>
  );
}

const NEW_PROJECT_ICONS = ["📋", "🚀", "💡", "🎯", "📊", "🛠️", "📅", "⭐", "🔥", "💼"];
const NEW_PROJECT_COLORS = ["#0073ea", "#e2445c", "#00c875", "#fdab3d", "#a25ddc", "#037f4c", "#ff642e", "#579bfc"];

function NewProjectButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📋");
  const [color, setColor] = useState("#0073ea");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

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
        style={{
          width: 18, height: 18, borderRadius: 5,
          background: "transparent", border: "none",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--text-4)", transition: "color 0.12s, background 0.12s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-4)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        title="New project"
      >
        <Plus size={12} />
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
                  type="text" placeholder="e.g. Product Roadmap" value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: "var(--text-3)" }}>Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {NEW_PROJECT_ICONS.map((i) => (
                    <button key={i} type="button" onClick={() => setIcon(i)}
                      className="w-9 h-9 text-lg rounded-lg flex items-center justify-center"
                      style={{ border: icon === i ? "1px solid var(--chart-primary)" : "1px solid var(--border)", background: icon === i ? "var(--accent-subtle)" : "transparent" }}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: "var(--text-3)" }}>Color</label>
                <div className="flex gap-2">
                  {NEW_PROJECT_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className="w-7 h-7 rounded-full" style={{ background: c, border: color === c ? "2px solid var(--text-1)" : "2px solid transparent" }} />
                  ))}
                </div>
              </div>
              {error && <p style={{ color: "#e2445c", fontSize: 12 }}>{error}</p>}
              <button type="submit" disabled={loading || !name.trim()}
                className="w-full py-2 rounded-lg text-sm font-medium transition-opacity"
                style={{ background: "var(--chart-primary)", color: "#fff", opacity: loading || !name.trim() ? 0.5 : 1 }}>
                {loading ? "Creating…" : "Create project"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function BoardItem({ board, index, active }: { board: Board; index: number; active: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const color = board.color ?? DOT_COLORS[index % DOT_COLORS.length];

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/boards/${board.id}`, { method: "DELETE" });
    setDeleting(false);
    setConfirmOpen(false);
    queryClient.invalidateQueries({ queryKey: ["boards"] });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }} className="group/board">
      <Link
        href={`/boards/${board.id}`}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 12px",
          borderRadius: 8,
          fontSize: 13,
          color: active ? "var(--text-1)" : "var(--text-3)",
          background: active ? "var(--bg-active)" : "transparent",
          borderRight: active ? "2px solid var(--nav-active-border)" : "2px solid transparent",
          textDecoration: "none",
          marginBottom: 2,
          transition: "color 0.12s, background 0.12s",
        }}
        onMouseEnter={(e) => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.color = "var(--text-1)";
            (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.color = "var(--text-3)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }
        }}
      >
        {/* Colored dot — user-chosen color, always visible */}
        <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {board.name}
        </span>
      </Link>

      {/* Kebab */}
      {!board.isSystem && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="absolute right-1 opacity-0 group-hover/board:opacity-100 p-1 rounded transition-all"
              style={{ color: "var(--text-3)", background: "transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}
            >
              <MoreHorizontal size={13} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              style={{ minWidth: 160, background: "var(--bg-popover)", border: "1px solid var(--border-strong)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.24)", padding: 4, zIndex: 50 }}
              sideOffset={4}
              align="end"
            >
              <DropdownMenu.Item
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/10 cursor-pointer outline-none transition-colors"
                onSelect={() => setConfirmOpen(true)}
              >
                <Trash2 size={13} />
                Delete board
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}

      {/* Confirm dialog */}
      <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] rounded-2xl p-6 shadow-2xl z-50"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)" }}
          >
            <Dialog.Title style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>
              Delete &ldquo;{board.name}&rdquo;?
            </Dialog.Title>
            <Dialog.Description style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 24 }}>
              This will permanently delete all groups and items in this board. This cannot be undone.
            </Dialog.Description>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                style={{ padding: "8px 16px", fontSize: 13, color: "var(--text-2)", background: "var(--bg-active)", border: "none", borderRadius: 8, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm text-white font-medium bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
