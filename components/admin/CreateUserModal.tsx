"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Eye, EyeOff } from "lucide-react";

interface Props {
  onClose: () => void;
}

export function CreateUserModal({ onClose }: Props) {
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const queryClient           = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create user");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  function submit() {
    setError(null);
    if (!form.name.trim())         return setError("Name is required");
    if (!form.email.trim())        return setError("Email is required");
    if (!form.email.includes("@")) return setError("Enter a valid email");
    if (form.password.length < 8)  return setError("Password must be at least 8 characters");
    mutate();
  }

  const strength =
    form.password.length === 0  ? null
    : form.password.length < 8  ? "weak"
    : form.password.length < 12 ? "ok"
    : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? "strong"
    : "ok";

  const strengthColor = { weak: "#ef4444", ok: "#f97316", strong: "#22c55e" } as const;
  const strengthLabel = { weak: "Too short", ok: "Good",     strong: "Strong"   } as const;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px",
    background: "var(--bg-input)", border: "1px solid var(--border)",
    borderRadius: 8, fontSize: 13, color: "var(--text-1)",
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 500,
    color: "var(--text-2)", marginBottom: 5,
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
          width: "100%", maxWidth: 420,
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
              Create user
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
              Creates an Auth0 account + local profile
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
          {/* Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Full name</label>
            <input
              autoFocus
              type="text"
              placeholder="Jane Smith"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email address</label>
            <input
              type="email"
              placeholder="user@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
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

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 14, padding: "9px 12px", borderRadius: 8,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
              fontSize: 12, color: "#ef4444",
            }}>
              {error}
            </div>
          )}

          {/* Actions */}
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
              {isPending ? "Creating…" : "Create user"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
