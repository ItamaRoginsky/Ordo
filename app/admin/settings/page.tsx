"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings } from "lucide-react";

const SETTINGS = [
  {
    key: "allow_registrations",
    label: "Allow new registrations",
    desc: "Anyone with the login link can create an account",
  },
  {
    key: "require_invite",
    label: "Require invite to join",
    desc: "New users must be invited by an admin first",
  },
  {
    key: "maintenance_mode",
    label: "Maintenance mode",
    desc: "Redirects all non-admin users to a maintenance page",
    danger: true,
  },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 w-10 h-6 rounded-full transition-colors"
      style={{
        background: checked ? "var(--chart-primary)" : "var(--border-strong)",
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  );
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["admin-settings"],
    queryFn: () => fetch("/api/admin/settings").then((r) => r.json()),
  });

  async function toggle(key: string, newValue: boolean) {
    // Optimistic update
    queryClient.setQueryData(["admin-settings"], (old: Record<string, string> | undefined) => ({
      ...(old ?? {}),
      [key]: String(newValue),
    }));

    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: String(newValue) }),
    });

    queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={20} style={{ color: "var(--chart-primary)" }} />
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>App settings</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-sm" style={{ color: "var(--text-4)" }}>Loading…</div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-card)", boxShadow: "var(--card-shadow)" }}>
          {SETTINGS.map((s, idx) => (
            <div
              key={s.key}
              className="flex items-center justify-between gap-4 px-5 py-4"
              style={{ borderTop: idx > 0 ? "1px solid var(--border)" : "none" }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: s.danger ? "var(--sys-red)" : "var(--text-1)" }}>
                  {s.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{s.desc}</p>
              </div>
              <Toggle
                checked={settings?.[s.key] === "true"}
                onChange={(v) => toggle(s.key, v)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
