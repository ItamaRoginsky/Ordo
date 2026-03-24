"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { UserPlus } from "lucide-react";
import { InviteModal } from "@/components/admin/InviteModal";
import * as Dialog from "@radix-ui/react-dialog";

interface OrdoUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  isAdmin: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

function Avatar({ user }: { user: OrdoUser }) {
  if (user.picture) {
    return <img src={user.picture} alt="" className="w-8 h-8 rounded-full object-cover" />;
  }
  const initials = (user.name ?? user.email).slice(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
      style={{ background: "var(--bg-active)", color: "var(--text-2)" }}>
      {initials}
    </div>
  );
}

function RoleBadge({ isAdmin }: { isAdmin: boolean }) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
      style={isAdmin
        ? { background: "rgba(168,85,247,0.15)", color: "#a855f7" }
        : { background: "var(--bg-active)", color: "var(--text-3)" }}>
      {isAdmin ? "admin" : "user"}
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
      style={isActive
        ? { background: "rgba(52,199,89,0.15)", color: "var(--sys-green)" }
        : { background: "rgba(255,59,48,0.1)", color: "var(--sys-red)" }}>
      {isActive ? "active" : "suspended"}
    </span>
  );
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OrdoUser | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: users = [] } = useQuery<OrdoUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Use separate call to get current user id
  const { data: currentUser } = useQuery<{ id: string }>({
    queryKey: ["admin-me"],
    queryFn: () => fetch("/api/me").then((r) => r.json()),
  });

  async function patchUser(id: string, patch: Partial<OrdoUser>) {
    setActionError(null);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error ?? "Action failed");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch {
      setActionError("Network error");
    }
  }

  async function deleteUser(id: string) {
    setActionError(null);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error ?? "Delete failed");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch {
      setActionError("Network error");
    }
    setDeleteTarget(null);
  }

  const total = users.length;
  const active = users.filter((u) => u.isActive).length;
  const suspended = users.filter((u) => !u.isActive).length;
  const admins = users.filter((u) => u.isAdmin).length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>User management</h1>
          <div className="flex items-center gap-3 mt-2">
            {[
              { label: `${total} total`, color: "var(--text-3)" },
              { label: `${active} active`, color: "var(--sys-green)" },
              { label: `${suspended} suspended`, color: "var(--sys-red)" },
              { label: `${admins} admins`, color: "#a855f7" },
            ].map((chip) => (
              <span key={chip.label} className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--bg-active)", color: chip.color }}>
                {chip.label}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl font-medium"
          style={{ background: "var(--chart-primary)", color: "#fff" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        >
          <UserPlus size={14} />
          Add user
        </button>
      </div>

      {/* Error banner */}
      {actionError && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl mb-4"
          style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.2)" }}>
          <span className="text-xs" style={{ color: "var(--sys-red)" }}>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-xs px-2 py-0.5 rounded-lg"
            style={{ color: "var(--sys-red)" }}>✕</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-card)", boxShadow: "var(--card-shadow)" }}>
        {/* Header row */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-2.5"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-sidebar)" }}>
          {["", "User", "Role", "Status", "Actions"].map((h) => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-4)" }}>{h}</span>
          ))}
        </div>

        {users.map((user, idx) => {
          const isMe = user.id === currentUser?.id;
          return (
            <div key={user.id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-3"
              style={{ borderTop: idx > 0 ? "1px solid var(--border)" : "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Avatar user={user} />

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>
                    {user.name ?? "(no name)"}
                  </span>
                  {isMe && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ background: "var(--bg-active)", color: "var(--text-4)" }}>you</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs truncate" style={{ color: "var(--text-3)" }}>{user.email}</span>
                  {user.lastLoginAt && (
                    <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
                      · last login {formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>

              <RoleBadge isAdmin={user.isAdmin} />
              <StatusBadge isActive={user.isActive} />

              <div className="flex items-center gap-1.5">
                {!isMe ? (
                  <>
                    <button
                      onClick={() => patchUser(user.id, { isAdmin: !user.isAdmin })}
                      className="text-[10px] px-2 py-1 rounded-lg transition-colors"
                      style={{ border: "1px solid var(--border)", color: "var(--text-3)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      {user.isAdmin ? "Demote" : "Promote"}
                    </button>
                    <button
                      onClick={() => patchUser(user.id, { isActive: !user.isActive })}
                      className="text-[10px] px-2 py-1 rounded-lg transition-colors"
                      style={{ border: "1px solid var(--border)", color: user.isActive ? "var(--sys-red)" : "var(--sys-green)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      {user.isActive ? "Suspend" : "Reactivate"}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(user)}
                      className="text-[10px] px-2 py-1 rounded-lg transition-colors"
                      style={{ border: "1px solid var(--border)", color: "var(--sys-red)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,59,48,0.08)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <span className="text-[10px]" style={{ color: "var(--text-4)" }}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <InviteModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        }}
      />

      {/* Delete confirm dialog */}
      <Dialog.Root open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
          <Dialog.Content
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm p-6 rounded-2xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
          >
            <Dialog.Title className="text-base font-semibold mb-2" style={{ color: "var(--text-1)" }}>
              Delete user?
            </Dialog.Title>
            <Dialog.Description className="text-sm mb-5" style={{ color: "var(--text-3)" }}>
              This will permanently delete <strong>{deleteTarget?.name ?? deleteTarget?.email}</strong> and all their data. This cannot be undone.
            </Dialog.Description>
            <div className="flex gap-3 justify-end">
              <Dialog.Close asChild>
                <button className="px-4 py-2 text-sm rounded-xl" style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}>
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={() => deleteTarget && deleteUser(deleteTarget.id)}
                className="px-4 py-2 text-sm rounded-xl font-medium"
                style={{ background: "var(--sys-red)", color: "#fff" }}
              >
                Delete
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
