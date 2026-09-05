"use client";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // h-dvh (e não h-screen/100vh): no celular a barra de endereço aparece e some
  // ao rolar, mudando o 100vh e fazendo o layout inteiro tremer.
  // min-w-0 no main: sem isso o item flex não encolhe abaixo da largura do
  // conteúdo, e qualquer elemento largo empurra a página para os lados.
  return (
    <div className="flex h-dvh overflow-hidden bg-[#faf8f3]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 min-w-0 overflow-y-auto">
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
