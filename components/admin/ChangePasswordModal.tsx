"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Eye, EyeOff } from "lucide-react";

interface Props {
  user: { id: string; name: string | null; email: string };
  onClose: () => void;
}

export function ChangePasswordModal({ user, onClose }: Props) {
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [done, setDone]         = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to change password");
      return data;
    },
    onSuccess: () => setDone(true),
    onError: (err: Error) => setError(err.message),
  });

  function submit() {
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters");
    mutate();
  }

  const strength =
    password.length === 0  ? null
    : password.length < 8  ? "weak"
    : password.length < 12 ? "ok"
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? "strong"
    : "ok";

  const strengthColor = { weak: "#ef4444", ok: "#f97316", strong: "#22c55e" } as const;
  const strengthLabel = { weak: "Too short", ok: "Good",     strong: "Strong"   } as const;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px",
    background: "var(--bg-input)", border: "1px solid var(--border)",
    borderRadius: 8, fontSize: 13, color: "var(--text-1)",
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9990,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)",
        }}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)", zIndex: 9991,
          width: "100%", maxWidth: 400,
          background: "var(--bg-card)",
          border: "1px solid var(--border-strong)",
          borderRadius: 16,
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid var(--border)",
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)" }}>
              Change password
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
              {user.name ?? user.email}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 7,
              background: "var(--bg-active)", border: "1px solid var(--border)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-2)",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)", marginBottom: 4 }}>
                Password updated
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 20 }}>
                {user.email} can now log in with the new password.
              </div>
              <button
                onClick={onClose}
                style={{
                  width: "100%", padding: 10, borderRadius: 8,
                  background: "var(--text-1)", border: "none",
                  fontSize: 13, fontWeight: 500, color: "var(--bg-card)",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 500,
                  color: "var(--text-2)", marginBottom: 5,
                }}>
                  New password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    autoFocus
                    type={showPass ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    style={{ ...inputStyle, padding: "9px 36px 9px 12px" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                    onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--border)"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    style={{
                      position: "absolute", right: 10, top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent", border: "none",
                      cursor: "pointer", color: "var(--text-3)", padding: 2,
                    }}
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {strength && (
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{
                      flex: 1, height: 3, background: "var(--bg-active)",
                      borderRadius: 100, overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%", borderRadius: 100,
                        background: strengthColor[strength],
                        width: strength === "weak" ? "33%" : strength === "ok" ? "66%" : "100%",
                        transition: "width 0.2s, background 0.2s",
                      }} />
                    </div>
                    <span style={{ fontSize: 10, color: strengthColor[strength], fontWeight: 500 }}>
                      {strengthLabel[strength]}
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div style={{
                  marginBottom: 14, padding: "9px 12px", borderRadius: 8,
                  background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                  fontSize: 12, color: "#ef4444",
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1, padding: 10, borderRadius: 8,
                    background: "transparent", border: "1px solid var(--border)",
                    fontSize: 13, color: "var(--text-2)", cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={isPending}
                  style={{
                    flex: 2, padding: 10, borderRadius: 8,
                    background: isPending ? "var(--bg-active)" : "var(--text-1)",
                    border: "none",
                    fontSize: 13, fontWeight: 500,
                    color: isPending ? "var(--text-3)" : "var(--bg-card)",
                    cursor: isPending ? "not-allowed" : "pointer",
                    fontFamily: "inherit", transition: "all 0.15s",
                  }}
                >
                  {isPending ? "Saving…" : "Set password"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
