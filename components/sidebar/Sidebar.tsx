"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Shield, LogOut, Plus } from "lucide-react";
import type { Board, User } from "@prisma/client";

interface SidebarProps {
  boards: Board[];
  user: User | null;
}

export function Sidebar({ boards, user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="w-60 h-screen bg-[#1e2a3a] flex flex-col text-white shrink-0 overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <span className="font-bold text-xl tracking-tight">Ordo</span>
      </div>

      {/* Top nav */}
      <nav className="p-2 space-y-0.5">
        <NavItem href="/boards" icon={<LayoutDashboard size={15} />} label="Home" active={pathname === "/boards"} />
        {user?.isAdmin && (
          <NavItem href="/admin/users" icon={<Shield size={15} />} label="Admin" active={pathname.startsWith("/admin")} />
        )}
      </nav>

      <div className="mx-3 border-t border-white/10 my-1" />

      {/* Board list */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-[11px] text-white/40 uppercase tracking-widest font-medium">Boards</span>
        <Link href="/boards" className="text-white/40 hover:text-white transition-colors">
          <Plus size={14} />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2">
        {boards.map((board) => (
          <Link
            key={board.id}
            href={`/boards/${board.id}`}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              pathname === `/boards/${board.id}`
                ? "bg-white/15 text-white"
                : "text-white/65 hover:bg-white/8 hover:text-white"
            }`}
          >
            <span className="text-base leading-none">{board.icon ?? "📋"}</span>
            <span className="truncate">{board.name}</span>
          </Link>
        ))}
      </div>

      {/* User */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <div className="flex items-center gap-2.5 px-2 py-1">
          {user?.picture ? (
            <img src={user.picture} alt="" className="w-7 h-7 rounded-full shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name?.[0] ?? "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate leading-tight">{user?.name}</p>
            <p className="text-[11px] text-white/40 truncate">{user?.email}</p>
          </div>
        </div>
        <a
          href="/auth/logout"
          className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-white/40 hover:text-white hover:bg-white/8 transition-colors"
        >
          <LogOut size={14} />
          <span>Log out</span>
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
      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
        active ? "bg-white/15 text-white" : "text-white/65 hover:bg-white/8 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
