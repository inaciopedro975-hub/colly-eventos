"use client";
import { useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Wallet, AlertCircle,
  Plus, Trash2, Edit, Search, Download, ArrowUpRight,
  Check, Clock, ChevronDown, Layers,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency, formatDate } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────────── */
interface Transaction {
  id: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: string; // "recebido" | "pendente"
  paymentMethod?: string | null;
  notes?: string | null;
  installmentGroup?: string | null;
  installmentNum?: number | null;
  totalInstallments?: number | null;
  quoteId?: number | null;
  eventId?: string | null;
}

interface QuoteOption {
  id: number;
  clientName: string;
  total: number;
  eventDate: string | null;
  createdAt: string;
}

interface Props {
  initialTransactions: Transaction[];
  quotesAprovados: QuoteOption[];
}

/* ─── Constants ──────────────────────────────────────────── */
const RECEITA_CATS = ["buffet", "bebidas", "decoração", "aluguel de espaço", "fotografia", "outros serviços", "outros"];
const DESPESA_CATS = ["fornecedor", "ingredientes", "decoração", "funcionários", "imposto", "aluguel", "energia/água", "equipamentos", "marketing", "outros"];
const PAYMENT_METHODS = [
  { value: "pix", label: "PIX" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
  { value: "transferencia", label: "Transferência" },
  { value: "boleto", label: "Boleto" },
];

const emptyForm = {
  type: "receita",
  category: "outros serviços",
  description: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  status: "recebido",
  paymentMethod: "pix",
  notes: "",
  quoteId: "",
  parcelado: false,
  installments: "2",
};

/* ─── Helpers ────────────────────────────────────────────── */
function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function isOverdue(t: Transaction) {
  return t.status === "pendente" && new Date(t.date) < new Date(new Date().toDateString());
}

/* ─── Component ──────────────────────────────────────────── */
export function FinanceiroClient({ initialTransactions, quotesAprovados }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("tudo"); // tudo | receber | atrasado | recebido | despesas
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  const f = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  /* ─── Derived ────────────────────────────────────────── */
  const months = useMemo(() => {
    const keys = new Set<string>([currentMonthKey()]);
    // A data é salva como ISO; o prefixo "YYYY-MM" já é o mês escolhido (à prova de fuso)
    transactions.forEach((t) => keys.add(t.date.slice(0, 7)));
    return Array.from(keys).sort().reverse();
  }, [transactions]);

  const monthTx = useMemo(() => {
    // Compara direto pela string da data — sem conversão de timezone que descartava
    // transações perto do início/fim do mês.
    return transactions.filter((t) => t.date.slice(0, 7) === selectedMonth);
  }, [transactions, selectedMonth]);

  // Stats: receitas só conta "recebido"
  const stats = useMemo(() => {
    const recebidas = monthTx.filter((t) => t.type === "receita" && t.status === "recebido");
    const despesas = monthTx.filter((t) => t.type === "despesa");
    const pendentes = monthTx.filter((t) => t.type === "receita" && t.status === "pendente");

    const totalReceita = recebidas.reduce((s, t) => s + t.amount, 0);
    const totalDespesa = despesas.reduce((s, t) => s + t.amount, 0);
    const totalPendente = pendentes.reduce((s, t) => s + t.amount, 0);

    // Em atraso: pendente em QUALQUER mês com data passada
    const totalAtrasado = transactions
      .filter((t) => t.type === "receita" && isOverdue(t))
      .reduce((s, t) => s + t.amount, 0);

    return { totalReceita, totalDespesa, saldo: totalReceita - totalDespesa, totalPendente, totalAtrasado };
  }, [monthTx, transactions]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthTx.filter((t) => t.type === "despesa").forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthTx]);

  // Atrasados aparecem mesmo fora do mês selecionado (são dívidas vencidas)
  const baseList = view === "atrasado"
    ? transactions.filter((t) => t.type === "receita" && isOverdue(t))
    : monthTx;

  const filtered = useMemo(() => {
    return baseList.filter((t) => {
      const matchSearch =
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());

      let matchView = true;
      switch (view) {
        case "receber":
          matchView = t.type === "receita" && t.status === "pendente" && !isOverdue(t);
          break;
        case "atrasado":
          matchView = true; // já filtrado em baseList
          break;
        case "recebido":
          matchView = t.type === "receita" && t.status === "recebido";
          break;
        case "despesas":
          matchView = t.type === "despesa";
          break;
        // "tudo": passa todos
      }
      return matchSearch && matchView;
    });
  }, [baseList, search, view]);

  const importedQuoteIds = new Set(transactions.map((t) => t.quoteId).filter(Boolean));

  /* ─── Actions ────────────────────────────────────────── */
  function openCreate(type = "receita") {
    setEditTarget(null);
    setForm({
      ...emptyForm,
      type,
      category: type === "receita" ? "outros serviços" : "outros",
      date: new Date().toISOString().split("T")[0],
    });
    setError("");
    setModalOpen(true);
  }

  function openEdit(t: Transaction) {
    setEditTarget(t);
    setForm({
      type: t.type,
      category: t.category,
      description: t.description.replace(/ \(\d+\/\d+\)$/, ""), // remove "(1/4)"
      amount: t.amount.toString(),
      date: t.date.split("T")[0],
      status: t.status,
      paymentMethod: t.paymentMethod ?? "pix",
      notes: t.notes ?? "",
      quoteId: t.quoteId?.toString() ?? "",
      parcelado: false,
      installments: "2",
    });
    setError("");
    setModalOpen(true);
  }

  async function markReceived(id: string) {
    const res = await fetch(`/api/transactions/${id}`, { method: "PATCH" });
    if (res.ok) {
      const updated = await res.json();
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, status: updated.status } : t)));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = {
        ...form,
        quoteId: form.quoteId || null,
        installments: form.parcelado ? form.installments : "1",
      };

      if (editTarget) {
        const res = await fetch(`/api/transactions/${editTarget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        // pode retornar array (parcelas) ou objeto único
        const newItems = Array.isArray(created) ? created : [created];
        setTransactions((prev) => [...newItems, ...prev]);
        // Garante que o usuário veja o que acabou de criar:
        // navega pro mês da transação, volta pra aba "Tudo" e limpa a busca.
        if (newItems[0]?.date) {
          setSelectedMonth(newItems[0].date.slice(0, 7));
          setView("tudo");
          setSearch("");
        }
      }
      setModalOpen(false);
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(t: Transaction) {
    const isGroup = !!t.installmentGroup;
    const msg = isGroup
      ? `Excluir TODAS as ${t.totalInstallments} parcelas deste parcelamento?`
      : "Excluir esta transação?";
    if (!confirm(msg)) return;

    const res = await fetch(`/api/transactions/${t.id}`, { method: "DELETE" });
    if (res.ok) {
      if (isGroup) {
        setTransactions((prev) => prev.filter((x) => x.installmentGroup !== t.installmentGroup));
      } else {
        setTransactions((prev) => prev.filter((x) => x.id !== t.id));
      }
    }
  }

  async function handleImportQuote(quote: QuoteOption) {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "receita",
          category: "buffet",
          description: `Orçamento #${String(quote.id).padStart(4, "0")} — ${quote.clientName}`,
          amount: quote.total,
          date: quote.eventDate ? quote.eventDate.split("T")[0] : quote.createdAt.split("T")[0],
          status: "recebido",
          paymentMethod: "pix",
          quoteId: quote.id,
          installments: "1",
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setTransactions((prev) => [created, ...prev]);
      if (created?.date) {
        setSelectedMonth(created.date.slice(0, 7));
        setView("tudo");
        setSearch("");
      }
      setImportOpen(false);
    } catch {
      alert("Erro ao importar orçamento.");
    } finally {
      setLoading(false);
    }
  }

  const categories = form.type === "receita" ? RECEITA_CATS : DESPESA_CATS;

  /* ─── Render ─────────────────────────────────────────── */
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2a2419]">Controle Financeiro</h1>
          <p className="text-sm text-[#9b8b73] mt-1 capitalize">{monthLabel(selectedMonth)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-white border border-[#ede7dc] text-sm text-[#2a2419] focus:outline-none focus:border-[#b8860b] cursor-pointer"
            >
              {months.map((m) => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9b8b73] pointer-events-none" />
          </div>
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <Download size={15} /> Importar orçamento
          </Button>
          <Button variant="secondary" onClick={() => openCreate("despesa")}>
            <Plus size={15} /> Despesa
          </Button>
          <Button onClick={() => openCreate("receita")}>
            <Plus size={15} /> Receita
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Recebido */}
        <div className="card-hover bg-white border border-[#ede7dc] rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
            <ArrowUpRight size={13} className="text-[#c9beac]" />
          </div>
          <p className="text-xl font-bold text-[#2a2419] tabular">{formatCurrency(stats.totalReceita)}</p>
          <p className="text-xs text-[#9b8b73] mt-0.5">Recebido no mês</p>
        </div>

        {/* A receber */}
        <div className="card-hover bg-white border border-[#ede7dc] rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#fef9ec] flex items-center justify-center">
              <Clock size={18} className="text-[#d4a017]" />
            </div>
          </div>
          <p className="text-xl font-bold text-[#2a2419] tabular">{formatCurrency(stats.totalPendente)}</p>
          <p className="text-xs text-[#9b8b73] mt-0.5">A receber no mês</p>
        </div>

        {/* Despesas */}
        <div className="card-hover bg-white border border-[#ede7dc] rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <TrendingDown size={18} className="text-red-500" />
            </div>
          </div>
          <p className="text-xl font-bold text-[#2a2419] tabular">{formatCurrency(stats.totalDespesa)}</p>
          <p className="text-xs text-[#9b8b73] mt-0.5">Despesas do mês</p>
        </div>

        {/* Saldo */}
        <div className={`card-hover border rounded-xl p-5 ${stats.saldo >= 0 ? "bg-white border-[#ede7dc]" : "bg-red-50 border-red-200"}`}>
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.saldo >= 0 ? "bg-[#fef9ec]" : "bg-red-100"}`}>
              <Wallet size={18} className={stats.saldo >= 0 ? "text-[#d4a017]" : "text-red-500"} />
            </div>
          </div>
          <p className={`text-xl font-bold tabular ${stats.saldo >= 0 ? "text-[#2a2419]" : "text-red-600"}`}>
            {formatCurrency(stats.saldo)}
          </p>
          <p className="text-xs text-[#9b8b73] mt-0.5">Saldo (recebido − despesas)</p>
        </div>
      </div>

      {/* Alerta de atraso */}
      {stats.totalAtrasado > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">
            <strong>Pagamentos em atraso:</strong> {formatCurrency(stats.totalAtrasado)} de parcelas vencidas ainda não recebidas.{" "}
            <button onClick={() => setView("atrasado")} className="underline font-medium">Ver agora</button>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Lista de transações */}
        <div className="lg:col-span-2 bg-white border border-[#ede7dc] rounded-xl overflow-hidden">
          {/* Abas únicas: o que você quer ver agora */}
          <div className="px-4 pt-3 border-b border-[#f5f1ea]">
            <div className="flex gap-1 flex-wrap">
              {[
                { v: "tudo",     label: "📋 Tudo",        count: monthTx.length },
                { v: "receber",  label: "💰 A receber",   count: monthTx.filter((t) => t.type === "receita" && t.status === "pendente" && !isOverdue(t)).length },
                { v: "atrasado", label: "🔴 Atrasado",    count: transactions.filter((t) => t.type === "receita" && isOverdue(t)).length },
                { v: "recebido", label: "✅ Recebido",    count: monthTx.filter((t) => t.type === "receita" && t.status === "recebido").length },
                { v: "despesas", label: "💸 Despesas",    count: monthTx.filter((t) => t.type === "despesa").length },
              ].map(({ v, label, count }) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    view === v
                      ? "border-[#d4a017] text-[#2a2419]"
                      : "border-transparent text-[#9b8b73] hover:text-[#2a2419]"
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${view === v ? "bg-[#d4a017] text-white" : "bg-[#f5f1ea] text-[#6b5d47]"}`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative my-2.5">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9b8b73]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por descrição ou categoria..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#faf8f3] border border-[#ede7dc] text-sm text-[#2a2419] placeholder-[#9b8b73] focus:outline-none focus:border-[#b8860b]"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Wallet size={32} className="text-[#d4cdbe] mx-auto mb-2" />
              <p className="text-sm text-[#9b8b73]">Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f5f1ea]">
              {filtered.map((t) => {
                const overdue = isOverdue(t);
                const isPending = t.status === "pendente";
                const isInstallment = !!t.installmentGroup;

                return (
                  <div key={t.id}
                    className={`px-4 py-3 flex items-center gap-3 transition-colors group ${isPending ? "bg-[#fffbf0]" : "hover:bg-[#faf8f3]"} ${overdue ? "bg-red-50" : ""}`}>

                    {/* Indicador lateral */}
                    <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${
                      overdue ? "bg-red-500" : isPending ? "bg-amber-400" : t.type === "receita" ? "bg-emerald-400" : "bg-red-400"
                    }`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-semibold truncate ${isPending ? "text-[#6b5d47]" : "text-[#2a2419]"}`}>
                          {t.description}
                        </p>
                        {isInstallment && (
                          <span className="flex items-center gap-0.5 text-[10px] bg-[#f5f1ea] text-[#9b8b73] px-1.5 py-0.5 rounded-full flex-shrink-0">
                            <Layers size={9} />
                            {t.installmentNum}/{t.totalInstallments}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] bg-[#f5f1ea] text-[#6b5d47] px-1.5 py-0.5 rounded-full capitalize">{t.category}</span>
                        {overdue && <span className="text-[10px] text-red-600 font-medium">Atrasado</span>}
                        {isPending && !overdue && <span className="text-[10px] text-amber-600 font-medium">Pendente</span>}
                        {t.paymentMethod && !isPending && <span className="text-[10px] text-[#9b8b73]">{t.paymentMethod}</span>}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold tabular ${
                        t.type === "despesa" ? "text-red-500" :
                        isPending ? "text-amber-600" : "text-emerald-600"
                      }`}>
                        {t.type === "receita" ? "+" : "−"}{formatCurrency(t.amount)}
                      </p>
                      <p className="text-[10px] text-[#9b8b73] tabular">{formatDate(t.date)}</p>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Marcar como recebido */}
                      {isPending && (
                        <button
                          onClick={() => markReceived(t.id)}
                          title="Marcar como recebido"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <Check size={13} />
                        </button>
                      )}
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-[#9b8b73] hover:text-[#2a2419] hover:bg-[#f5f1ea] transition-colors">
                        <Edit size={13} />
                      </button>
                      <button onClick={() => handleDelete(t)} className="p-1.5 rounded-lg text-[#9b8b73] hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Coluna lateral */}
        <div className="space-y-4">
          {/* Despesas por categoria */}
          <div className="bg-white border border-[#ede7dc] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#f5f1ea]">
              <h3 className="text-sm font-semibold text-[#2a2419]">Despesas por categoria</h3>
              <p className="text-xs text-[#9b8b73] capitalize">{monthLabel(selectedMonth)}</p>
            </div>
            {expenseByCategory.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-[#9b8b73]">Sem despesas no período</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {expenseByCategory.map(([cat, value]) => {
                  const pct = stats.totalDespesa > 0 ? (value / stats.totalDespesa) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#6b5d47] capitalize">{cat}</span>
                        <span className="text-xs font-semibold text-[#2a2419]">{formatCurrency(value)}</span>
                      </div>
                      <div className="h-1.5 bg-[#f5f1ea] rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Nota fiscal */}
          <div className="bg-[#fef9ec] border border-[#f0d060] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-[#946708] mb-2 flex items-center gap-1.5">
              <AlertCircle size={13} />
              Nota Fiscal
            </h3>
            <p className="text-xs text-[#6b5d47] leading-relaxed">
              As NFS-e devem ser emitidas pelo sistema da prefeitura. Use os dados registrados aqui como base para o seu contador.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Modal: Nova / Editar ──────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Editar transação" : form.type === "receita" ? "Nova Receita" : "Nova Despesa"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          {/* Tipo */}
          {!editTarget && (
            <div className="flex rounded-lg overflow-hidden border border-[#ede7dc]">
              {["receita", "despesa"].map((t) => (
                <button key={t} type="button"
                  onClick={() => { f("type", t); f("category", t === "receita" ? "outros serviços" : "outros"); f("parcelado", false); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    form.type === t
                      ? t === "receita" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                      : "bg-white text-[#6b5d47] hover:bg-[#faf8f3]"
                  }`}>
                  {t === "receita" ? "Receita" : "Despesa"}
                </button>
              ))}
            </div>
          )}

          <Input label="Descrição *" value={form.description}
            onChange={(e) => f("description", e.target.value)}
            placeholder={form.type === "receita" ? "Ex: Evento João Silva" : "Ex: Compra de ingredientes"}
            required />

          <div className="grid grid-cols-2 gap-3">
            <CurrencyInput label={form.parcelado ? "Valor total *" : "Valor *"}
              value={form.amount}
              onChange={(v) => f("amount", v)}
              required />
            <Input label="Data *" type="date" value={form.date}
              onChange={(e) => f("date", e.target.value)} required />
          </div>

          {/* Parcelamento — só para receitas novas */}
          {form.type === "receita" && !editTarget && (
            <div className="bg-[#faf8f3] border border-[#ede7dc] rounded-xl p-3 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.parcelado}
                  onChange={(e) => f("parcelado", e.target.checked)}
                  className="w-4 h-4 accent-[#d4a017] rounded"
                />
                <span className="text-sm font-medium text-[#2a2419]">Pagamento parcelado</span>
                <span className="text-xs text-[#9b8b73]">(PIX mensal)</span>
              </label>

              {form.parcelado && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[#6b5d47]">Nº de parcelas</label>
                    <select
                      value={form.installments}
                      onChange={(e) => f("installments", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#d4cdbe] text-[#2a2419] text-sm focus:outline-none focus:border-[#b8860b]"
                    >
                      {[2,3,4,5,6,8,10,12].map((n) => (
                        <option key={n} value={n}>{n}x</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[#6b5d47]">1ª parcela em</label>
                    <Input type="date" value={form.date}
                      onChange={(e) => f("date", e.target.value)} />
                  </div>
                  {form.amount && (
                    <div className="col-span-2 text-xs text-[#6b5d47] bg-white border border-[#ede7dc] rounded-lg px-3 py-2">
                      {form.installments}x de <strong>{formatCurrency(parseFloat(form.amount) / parseInt(form.installments || "1"))}</strong> — todas começam como <strong>pendentes</strong>, marque como recebido quando o PIX entrar.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status (só para não parcelado) */}
          {!form.parcelado && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#6b5d47]">Status</label>
                <select value={form.status} onChange={(e) => f("status", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#d4cdbe] text-[#2a2419] text-sm focus:outline-none focus:border-[#b8860b]">
                  <option value="recebido">✅ Já recebido</option>
                  <option value="pendente">⏳ A receber</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#6b5d47]">Forma de pagamento</label>
                <select value={form.paymentMethod} onChange={(e) => f("paymentMethod", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#d4cdbe] text-[#2a2419] text-sm focus:outline-none focus:border-[#b8860b]">
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#6b5d47]">Categoria</label>
            <select value={form.category} onChange={(e) => f("category", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#d4cdbe] text-[#2a2419] text-sm focus:outline-none focus:border-[#b8860b]">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#6b5d47]">Observações</label>
            <textarea value={form.notes} onChange={(e) => f("notes", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#d4cdbe] text-sm focus:outline-none focus:border-[#b8860b] resize-none"
              placeholder="Opcional..." />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : form.parcelado ? `Criar ${form.installments} parcelas` : "Salvar"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal: Importar orçamento ───────────────────── */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Importar orçamento aprovado">
        <div className="space-y-2">
          <p className="text-xs text-[#9b8b73] mb-3">
            Selecione um orçamento aprovado para criar uma receita automaticamente.
          </p>
          {quotesAprovados.length === 0 ? (
            <p className="text-sm text-[#9b8b73] text-center py-6">Nenhum orçamento aprovado.</p>
          ) : quotesAprovados.map((q) => {
            const done = importedQuoteIds.has(q.id);
            return (
              <div key={q.id}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                  done ? "border-[#f5f1ea] bg-[#faf8f3] opacity-50" : "border-[#ede7dc] bg-white hover:border-[#d4a017] cursor-pointer"
                }`}
                onClick={() => !done && handleImportQuote(q)}>
                <div>
                  <p className="text-sm font-semibold text-[#2a2419]">{q.clientName}</p>
                  <p className="text-xs text-[#9b8b73]">#{String(q.id).padStart(4, "0")} · {formatDate(q.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#d4a017]">{formatCurrency(q.total)}</p>
                  {done && <p className="text-[10px] text-[#9b8b73]">já importado</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
