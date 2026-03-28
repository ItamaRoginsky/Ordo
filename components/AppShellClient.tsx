"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Sun, CalendarDays, FolderOpen, Menu, X, Shield } from "lucide-react";
import { Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Sidebar } from "./sidebar/Sidebar";
import type { Board, User } from "@prisma/client";

interface AppShellClientProps {
  children: React.ReactNode;
  boards: Board[];
  user: User | null;
}

export function AppShellClient({ children, boards, user }: AppShellClientProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        background: "var(--bg-page)",
        overflow: "hidden",
      }}
    >
      {/* DESKTOP SIDEBAR — hidden on mobile */}
      {!isMobile && <Sidebar boards={boards} user={user} />}

      {/* MOBILE HEADER */}
      {isMobile && (
        <div
          className="top-bar"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            height: 52,
            background: "var(--bg-sidebar)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--text-1)",
              fontFamily: "'Gelasio', serif",
            }}
          >
            Ordo
          </span>
          <button
            onClick={() => setMobileMenuOpen(true)}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-2)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Menu size={22} />
          </button>
        </div>
      )}

      {/* MOBILE SLIDE-IN MENU */}
      {isMobile && mobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(2px)",
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "75vw",
              maxWidth: 280,
              zIndex: 201,
              background: "var(--bg-sidebar)",
              borderLeft: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              paddingTop: "env(safe-area-inset-top)",
              animation: "slideInRight 0.2s ease-out",
            }}
          >
            {/* Menu header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>
                Menu
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-2)",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Projects list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
              <div
                style={{
                  padding: "6px 16px 3px",
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                  color: "var(--text-4)",
                  fontWeight: 600,
                }}
              >
                Projects
              </div>
              {boards.map((board) => (
                <Link
                  key={board.id}
                  href={`/boards/${board.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "10px 16px",
                    color: pathname.startsWith(`/boards/${board.id}`)
                      ? "var(--text-1)"
                      : "var(--text-2)",
                    textDecoration: "none",
                    fontSize: 13,
                    background: pathname.startsWith(`/boards/${board.id}`)
                      ? "var(--bg-active)"
                      : "transparent",
                  }}
                >
                  <div
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 2,
                      background: board.color ?? "#9EC5F7",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {board.name}
                  </span>
                </Link>
              ))}
              {boards.length === 0 && (
                <p
                  style={{
                    padding: "8px 16px",
                    fontSize: 12,
                    color: "var(--text-4)",
                  }}
                >
                  No projects yet
                </p>
              )}
              {/* Admin link */}
              {user?.isAdmin && (
                <Link
                  href="/admin/users"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "10px 16px",
                    color: "var(--text-2)",
                    textDecoration: "none",
                    fontSize: 13,
                    marginTop: 8,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <Shield size={13} />
                  Admin
                </Link>
              )}
            </div>

            {/* User footer */}
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 9,
                paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
              }}
            >
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt=""
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#5b9cf6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {user?.name?.[0] ?? "U"}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--text-1)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.name}
                </div>
              </div>
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: "var(--bg-active)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-3)",
                }}
              >
                {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
              </button>
            </div>
          </div>
        </>
      )}

      {/* MAIN CONTENT */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: "auto",
          paddingTop: isMobile ? 52 : 0,
          paddingBottom: isMobile ? 64 : 0,
        }}
      >
        {children}
      </main>

      {/* MOBILE BOTTOM NAV */}
      {isMobile && (
        <nav
          className="bottom-nav"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: "var(--bg-sidebar)",
            borderTop: "1px solid var(--border)",
            display: "flex",
            height: "calc(56px + env(safe-area-inset-bottom))",
          }}
        >
          {[
            { icon: Home,         label: "Home",     href: "/dashboard" },
            { icon: Sun,          label: "My Day",   href: "/today" },
            { icon: CalendarDays, label: "Month",    href: "/month" },
            { icon: FolderOpen,   label: "Projects", href: "/boards" },
          ].map((tab) => {
            const isActive =
              tab.href === "/dashboard"
                ? pathname === "/dashboard" || pathname === "/"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  textDecoration: "none",
                  color: isActive ? "var(--accent)" : "var(--text-3)",
                  paddingBottom: 4,
                }}
              >
                <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span style={{ fontSize: 9, fontWeight: isActive ? 600 : 400 }}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
