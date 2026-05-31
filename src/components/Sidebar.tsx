"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  CalendarDays,
  FileText,
  FileSignature,
  Package,
  Users,
  LayoutDashboard,
  LogOut,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/orcamentos", label: "Orçamentos", icon: FileText },
  { href: "/contratos", label: "Contratos", icon: FileSignature },
  { href: "/catalogo", label: "Catálogo", icon: Package },
  { href: "/financeiro", label: "Financeiro", icon: TrendingUp },
  { href: "/admin", label: "Administração", icon: Users, adminOnly: true },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  return (
    <>
      {/* Overlay escuro no mobile quando menu está aberto */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "flex-shrink-0 bg-white border-r border-[#ede7dc] flex flex-col",
          // Desktop: sempre visível, fixo na largura
          "lg:relative lg:w-64 lg:h-full lg:translate-x-0",
          // Mobile: posição fixa, desliza da esquerda
          "fixed inset-y-0 left-0 z-40 w-64 h-full transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo + botão fechar (mobile) */}
        <div className="px-5 py-4 border-b border-[#ede7dc] flex items-center justify-between">
          <Logo size={72} variant="light" />
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-[#9b8b73] hover:text-[#2a2419] hover:bg-[#faf8f3] transition-colors"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-semibold text-[#9b8b73] uppercase tracking-wider">
            Menu Principal
          </p>
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative",
                  active
                    ? "bg-[#fef9ec] text-[#946708]"
                    : "text-[#6b5d47] hover:text-[#2a2419] hover:bg-[#faf8f3]"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#d4a017] rounded-r-full" />
                )}
                <Icon size={17} className={cn("flex-shrink-0", active && "text-[#d4a017]")} />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="px-3 py-3 border-t border-[#ede7dc]">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4a017] to-[#b8860b] flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {session?.user?.name?.charAt(0).toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#2a2419] truncate">{session?.user?.name}</p>
              <p className="text-[10px] text-[#9b8b73] truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#9b8b73] hover:text-red-600 hover:bg-red-50 transition-all duration-150"
          >
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
