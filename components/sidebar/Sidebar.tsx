"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sun, Moon, LogOut, MoreHorizontal, Trash2 } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Board, User } from "@prisma/client";
import { useTheme } from "@/lib/theme";


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

  return (
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

      <div style={{ flex: 1, overflowY: "auto", paddingTop: 8, paddingBottom: 8 }}>
        {/* My Space section */}
        <div style={{ padding: "10px 16px 4px" }}>
          <span style={{ color: "var(--text-4)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
            My Space
          </span>
        </div>
        <nav style={{ padding: "0 8px", marginBottom: 12 }}>
          <NavItem href="/dashboard" label="Home"    active={pathname === "/dashboard" || pathname === "/"} />
          <NavItem href="/today"     label="My Day"  active={pathname === "/today"} />
          <NavItem href="/week"      label="My Week" active={pathname === "/week"} />
          {user?.isAdmin && (
            <NavItem href="/admin/users" label="Admin" active={pathname.startsWith("/admin")} />
          )}
        </nav>

        <div style={{ margin: "0 12px 8px", borderTop: "1px solid var(--border)" }} />

        {/* Projects section */}
        <div style={{ padding: "10px 16px 4px" }}>
          <span style={{ color: "var(--text-4)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
            Projects
          </span>
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
  );
}

function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
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
      {label}
    </Link>
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
