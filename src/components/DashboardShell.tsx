"use client";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#faf8f3]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-y-auto">
        {/* Barra superior mobile com botão hambúrguer */}
        <div className="lg:hidden sticky top-0 z-20 bg-[#faf8f3] border-b border-[#ede7dc] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-[#6b5d47] hover:bg-[#ede7dc] transition-colors"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
          <span className="text-sm font-semibold text-[#2a2419]">Colly Eventos</span>
        </div>

        <div className="min-h-full p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
