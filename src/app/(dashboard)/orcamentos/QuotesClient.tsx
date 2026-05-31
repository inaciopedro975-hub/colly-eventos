"use client";
import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, FileText, Search, Eye, Trash2, ChevronRight, FileDown, Check, X } from "lucide-react";

interface Quote {
  id: number;
  clientName: string;
  clientPhone?: string | null;
  clientEmail?: string | null;
  eventDate?: string | null;
  eventType?: string | null;
  status: string;
  total: number;
  createdAt: string;
}

interface Props {
  initialQuotes: Quote[];
}

const statusLabels: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

export function QuotesClient({ initialQuotes }: Props) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filtered = quotes.filter((q) => {
    const matchSearch =
      q.clientName.toLowerCase().includes(search.toLowerCase()) ||
      String(q.id).includes(search);
    const matchStatus = statusFilter === "todos" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function handleDelete(id: number) {
    if (!confirm("Excluir este orçamento?")) return;
    const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    if (res.ok) setQuotes((prev) => prev.filter((q) => q.id !== id));
  }

  async function changeStatus(id: number, status: string) {
    const labels: Record<string, string> = {
      aprovado: "aprovar",
      rejeitado: "rejeitar",
    };
    if (!confirm(`Tem certeza que deseja ${labels[status] ?? "alterar"} este orçamento?`)) return;
    const res = await fetch(`/api/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2a2419]">Orçamentos</h1>
          <p className="text-sm text-[#9b8b73] mt-1">{quotes.length} orçamento{quotes.length !== 1 ? "s" : ""} no total</p>
        </div>
        <Link href="/orcamentos/novo">
          <Button>
            <Plus size={16} />
            Novo orçamento
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9b8b73]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente ou número..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#ffffff] border border-[#ede7dc] text-[#2a2419] placeholder-[#9b8b73] text-sm focus:outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#d4a017]/15"
          />
        </div>
        <div className="flex gap-2">
          {["todos", "rascunho", "enviado", "aprovado", "rejeitado"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-[#d4a017] text-white"
                  : "bg-[#ffffff] border border-[#ede7dc] text-[#9b8b73] hover:border-[#d4cdbe] hover:text-[#2a2419]"
              }`}
            >
              {s === "todos" ? "Todos" : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText size={40} className="text-[#d4cdbe] mb-3" />
          <p className="text-[#9b8b73]">Nenhum orçamento encontrado</p>
          <Link href="/orcamentos/novo" className="mt-4">
            <Button size="sm">Criar primeiro orçamento</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((quote) => (
            <div
              key={quote.id}
              className="card-hover bg-[#ffffff] border border-[#ede7dc] rounded-xl px-5 py-4 flex items-center gap-4 group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#f5f1ea] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-[#d4a017]">#{quote.id}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#2a2419] truncate">{quote.clientName}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <Badge variant={quote.status as never}>{statusLabels[quote.status]}</Badge>
                  {quote.eventDate && (
                    <span className="text-xs text-[#9b8b73]">{formatDate(quote.eventDate)}</span>
                  )}
                  {quote.eventType && (
                    <span className="text-xs text-[#9b8b73]">{quote.eventType}</span>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-bold text-[#d4a017] text-lg tabular">{formatCurrency(quote.total)}</p>
                <p className="text-xs text-[#9b8b73] tabular">{formatDate(quote.createdAt)}</p>
              </div>

              {/* Botões de ação rápida — sempre visíveis para rascunho/enviado */}
              {(quote.status === "rascunho" || quote.status === "enviado") && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => changeStatus(quote.id, "aprovado")}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                    title="Marcar como aprovado"
                  >
                    <Check size={13} /> Aprovar
                  </button>
                  <button
                    onClick={() => changeStatus(quote.id, "rejeitado")}
                    className="p-1.5 rounded-lg text-[#9b8b73] hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Rejeitar"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={`/api/quotes/${quote.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Baixar PDF"
                >
                  <button className="p-2 rounded-lg text-[#9b8b73] hover:text-[#d4a017] hover:bg-[#fef9ec] transition-colors">
                    <FileDown size={15} />
                  </button>
                </a>
                <Link href={`/orcamentos/${quote.id}`} title="Ver">
                  <button className="p-2 rounded-lg text-[#9b8b73] hover:text-[#2a2419] hover:bg-[#f5f1ea] transition-colors">
                    <Eye size={15} />
                  </button>
                </Link>
                <button
                  onClick={() => handleDelete(quote.id)}
                  className="p-2 rounded-lg text-[#9b8b73] hover:text-red-700 hover:bg-red-50 transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={15} />
                </button>
                <Link href={`/orcamentos/${quote.id}`}>
                  <button className="p-2 rounded-lg text-[#9b8b73] hover:text-[#2a2419] hover:bg-[#f5f1ea] transition-colors">
                    <ChevronRight size={15} />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
