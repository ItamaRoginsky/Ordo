"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Sun, CalendarDays, BarChart2, Shield, LogOut } from "lucide-react";
import type { Board, User } from "@prisma/client";

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

  return (
    <div className="w-56 h-screen bg-[#141414] flex flex-col shrink-0 overflow-hidden border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <span className="font-semibold text-white/90 text-lg tracking-tight">Ordo</span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* My Space section */}
        <div className="px-4 py-1.5">
          <span className="text-[10px] text-white/25 uppercase tracking-widest font-semibold">
            My Space
          </span>
        </div>
        <nav className="px-2 space-y-0.5 mb-3">
          <NavItem href="/boards"    icon={<LayoutDashboard size={14} />} label="Home"      active={pathname === "/boards"} />
          <NavItem href="/today"     icon={<Sun size={14} />}             label="My Day"     active={pathname === "/today"} />
          <NavItem href="/week"      icon={<CalendarDays size={14} />}    label="My Week"    active={pathname === "/week"} />
          <NavItem href="/dashboard" icon={<BarChart2 size={14} />}       label="Dashboard"  active={pathname === "/dashboard"} />
          {user?.isAdmin && (
            <NavItem href="/admin/users" icon={<Shield size={14} />} label="Admin" active={pathname.startsWith("/admin")} />
          )}
        </nav>

        <div className="mx-3 border-t border-white/[0.06] mb-2" />

        {/* Projects section */}
        <div className="px-4 py-1.5">
          <span className="text-[10px] text-white/25 uppercase tracking-widest font-semibold">
            Projects
          </span>
        </div>
        <div className="px-2 space-y-0.5">
          {boards.map((board, i) => {
            const active = pathname.startsWith(`/boards/${board.id}`);
            return (
              <Link
                key={board.id}
                href={`/boards/${board.id}`}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-white/[0.07] text-white/90 border-r-2 border-[#5b9cf6]"
                    : "text-white/45 hover:bg-white/[0.04] hover:text-white/80"
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: board.color ?? DOT_COLORS[i % DOT_COLORS.length] }}
                />
                <span className="truncate">{board.name}</span>
              </Link>
            );
          })}
          {boards.length === 0 && (
            <p className="px-3 py-2 text-xs text-white/20">No projects yet</p>
          )}
        </div>
      </div>

      {/* User */}
      <div className="p-3 border-t border-white/[0.06] space-y-0.5">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          {user?.picture ? (
            <img src={user.picture} alt="" className="w-6 h-6 rounded-full shrink-0" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#5b9cf6]/50 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
              {user?.name?.[0] ?? "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white/80 truncate leading-tight">{user?.name}</p>
            <p className="text-[10px] text-white/30 truncate">{user?.email}</p>
          </div>
        </div>
        <a
          href="/auth/logout"
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
        >
          <LogOut size={13} />
          <span>Sign out</span>
        </a>
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
        active
          ? "bg-white/[0.07] text-white/90 border-r-2 border-[#5b9cf6]"
          : "text-white/45 hover:bg-white/[0.04] hover:text-white/80"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
