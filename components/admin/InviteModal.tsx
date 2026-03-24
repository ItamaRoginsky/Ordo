"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, UserPlus, CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InviteModal({ open, onOpenChange, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create user");
        return;
      }
      setSuccess(true);
      onSuccess();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleClose(open: boolean) {
    if (!open) {
      setEmail("");
      setName("");
      setError(null);
      setSuccess(false);
    }
    onOpenChange(open);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
        <Dialog.Content
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm p-6 rounded-2xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-base font-semibold" style={{ color: "var(--text-1)" }}>
              Add user
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded-lg" style={{ color: "var(--text-3)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {success ? (
            <div className="flex flex-col items-center py-4 gap-3">
              <CheckCircle2 size={32} style={{ color: "var(--sys-green)" }} />
              <p className="text-sm text-center" style={{ color: "var(--text-1)" }}>
                <strong>{name.trim() || email}</strong> has been added
              </p>
              <p className="text-xs text-center" style={{ color: "var(--text-3)" }}>
                They can now log in via Auth0 with their email.
              </p>
              <button
                onClick={() => handleClose(false)}
                className="mt-2 px-4 py-2 text-sm rounded-xl"
                style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-3)" }}>Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 text-sm rounded-xl outline-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-3)" }}>Name (optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3 py-2 text-sm rounded-xl outline-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                />
              </div>

              {error && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(255,59,48,0.1)", color: "var(--sys-red)" }}>
                  {error}
                </p>
              )}

              <div className="flex gap-3 justify-end pt-1">
                <Dialog.Close asChild>
                  <button type="button" className="px-4 py-2 text-sm rounded-xl"
                    style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}>
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium"
                  style={{ background: "var(--chart-primary)", color: "#fff", opacity: loading ? 0.7 : 1 }}
                >
                  <UserPlus size={13} />
                  {loading ? "Adding…" : "Add user"}
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
