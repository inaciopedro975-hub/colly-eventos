"use client";
import { useState } from "react";
import {
  FileText, Plus, Trash2, Edit, Search, Download, FileSignature, Check, X, Clock, AlertTriangle,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Contract {
  id: string;
  type: string; // "decoracao" | "locacao"
  clientName: string;
  clientCpf: string;
  clientRg: string;
  clientAddress: string;
  eventType: string;
  eventStart: string;
  eventEnd: string;
  eventLocation: string;
  serviceDescription?: string | null;
  value: number;
  paymentSignalPct: number;
  paymentInstallments?: number | null;
  paymentInstallmentValue?: number | null;
  extraHourValue?: number | null;
  signCity: string;
  signDate: string;
  notes?: string | null;
  status: string;
  quoteId?: number | null;
  createdAt: string;
}

interface QuoteOption {
  id: number;
  clientName: string;
  clientDoc?: string | null;
  clientAddress?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;
  eventDate: string | null;
  eventType?: string | null;
  total: number;
}

interface BookedEvent {
  id: string;
  title: string;
  clientName: string;
  date: string;
}

interface Props {
  initialContracts: Contract[];
  quotesAprovados: QuoteOption[];
  bookedEvents: BookedEvent[];
}

const DEFAULT_SERVICES = `CERIMÔNIA
01 APARADOR PARA CERIMONIA.
2 arco romano
1 na entrada
1 no altar
30 metros de corredor contínuo 15 de cada lado
01 BUQUE DE NOIVA com flores nobres
Buque jogar com flores da época

FESTA tons segundo a referência
ARRANJOS AÉREO COM FOLHAGEM E LÂMPADAS DE FILAMENTO
01 MESA DE MADEIRA PARA BOLO COM APARADORES.
DECORAÇÃO DA MESA COM ARRANJOS GRANDES NAS PONTAS E VÁRIOS ARRANJOS PEQUENOS PARA COMPOSIÇÃO DA MESA. NA PARTE DE BAIXO DA MESA PLANTAS E ADORNOS PARA COMPLETAR A DECORAÇÃO.
01 BOLO FAKE BRANCO
BANDEJAS PARA DOCES
NAS MESAS DOS CONVIDADOS UM MINI ARRANJOS.`;

const todayISO = () => new Date().toISOString().split("T")[0];

// "YYYY-MM-DD" → "DD/MM/YYYY"
function brDate(d: string) {
  if (!d) return "__/__/____";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

// Máscara de CPF: 000.000.000-00
function maskCPF(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

// Máscara de RG (padrão SP): 00.000.000-0  (último dígito pode ser X)
function maskRG(v: string) {
  const cleaned = v.replace(/[^\dxX]/g, "").toUpperCase().slice(0, 9);
  return cleaned
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})([\dX])$/, "$1-$2");
}

const emptyForm = {
  type: "decoracao",
  clientName: "",
  clientCpf: "",
  clientRg: "",
  clientAddress: "",
  eventType: "casamento",
  eventStartDate: "",
  eventStartTime: "07:00",
  eventEndDate: "",
  eventEndTime: "18:00",
  eventLocation: "Colly Eventos, em Amparo/SP",
  serviceDescription: DEFAULT_SERVICES,
  value: "",
  paymentSignalPct: "20",
  paymentInstallments: "",
  paymentInstallmentValue: "",
  extraHourValue: "",
  signCity: "Amparo",
  signDate: todayISO(),
  notes: "",
  quoteId: "",
};

const TYPE_LABELS: Record<string, string> = {
  decoracao: "Decoração",
  locacao: "Locação de ambiente",
};

const statusLabels: Record<string, { label: string; color: string }> = {
  gerado: { label: "Gerado", color: "bg-[#fef9ec] text-[#946708] border-[#f0d060]" },
  assinado: { label: "Assinado", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelado: { label: "Cancelado", color: "bg-red-50 text-red-700 border-red-200" },
};

export function ContractsClient({ initialContracts, quotesAprovados, bookedEvents }: Props) {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Contract | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const filtered = contracts.filter((c) => {
    const matchSearch =
      c.clientName.toLowerCase().includes(search.toLowerCase()) ||
      c.clientCpf.includes(search);
    const matchStatus = statusFilter === "todos" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function openCreate(type: "decoracao" | "locacao" = "decoracao") {
    setEditTarget(null);
    setForm({
      ...emptyForm,
      type,
      paymentSignalPct: type === "locacao" ? "30" : "20",
      eventLocation: type === "locacao" ? "Chácara Colly Eventos, em Amparo/SP" : "Colly Eventos, em Amparo/SP",
      eventEndTime: type === "locacao" ? "23:59" : "18:00",
      signDate: todayISO(),
    });
    setError("");
    setModalOpen(true);
  }

  function openEdit(c: Contract) {
    setEditTarget(c);
    const start = new Date(c.eventStart);
    const end = new Date(c.eventEnd);
    setForm({
      type: c.type,
      clientName: c.clientName,
      clientCpf: maskCPF(c.clientCpf),
      clientRg: maskRG(c.clientRg),
      clientAddress: c.clientAddress,
      eventType: c.eventType,
      eventStartDate: c.eventStart.split("T")[0],
      eventStartTime: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
      eventEndDate: c.eventEnd.split("T")[0],
      eventEndTime: `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
      eventLocation: c.eventLocation,
      serviceDescription: c.serviceDescription ?? DEFAULT_SERVICES,
      value: c.value.toString(),
      paymentSignalPct: c.paymentSignalPct.toString(),
      paymentInstallments: c.paymentInstallments?.toString() ?? "",
      paymentInstallmentValue: c.paymentInstallmentValue?.toString() ?? "",
      extraHourValue: c.extraHourValue?.toString() ?? "",
      signCity: c.signCity,
      signDate: c.signDate.split("T")[0],
      notes: c.notes ?? "",
      quoteId: c.quoteId?.toString() ?? "",
    });
    setError("");
    setModalOpen(true);
  }

  function buildBody() {
    return {
      type: form.type,
      clientName: form.clientName,
      clientCpf: form.clientCpf,
      clientRg: form.clientRg,
      clientAddress: form.clientAddress,
      eventType: form.eventType,
      eventStart: `${form.eventStartDate}T${form.eventStartTime}:00`,
      eventEnd: `${form.eventEndDate}T${form.eventEndTime}:00`,
      eventLocation: form.eventLocation,
      serviceDescription: form.type === "decoracao" ? form.serviceDescription : null,
      value: form.value,
      paymentSignalPct: form.paymentSignalPct,
      paymentInstallments: form.type === "decoracao" ? (form.paymentInstallments || null) : null,
      paymentInstallmentValue: form.type === "decoracao" ? (form.paymentInstallmentValue || null) : null,
      extraHourValue: form.type === "locacao" ? (form.extraHourValue || null) : null,
      signCity: form.signCity,
      signDate: form.signDate,
      notes: form.notes,
      quoteId: form.quoteId || null,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = buildBody();
      const res = editTarget
        ? await fetch(`/api/contracts/${editTarget.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/contracts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      if (editTarget) {
        setContracts((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
      } else {
        setContracts((prev) => [saved, ...prev]);
      }
      setModalOpen(false);
    } catch {
      setError("Erro ao salvar contrato.");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(id: string, status: string) {
    const res = await fetch(`/api/contracts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este contrato? O PDF gerado não voltará.")) return;
    const res = await fetch(`/api/contracts/${id}`, { method: "DELETE" });
    if (res.ok) setContracts((prev) => prev.filter((c) => c.id !== id));
  }

  function importFromQuote(q: QuoteOption) {
    const eventDate = q.eventDate ? q.eventDate.split("T")[0] : todayISO();
    setForm({
      ...emptyForm,
      type: "decoracao",
      clientName: q.clientName,
      clientCpf: maskCPF(q.clientDoc ?? ""),
      clientRg: "",
      clientAddress: q.clientAddress ?? "",
      eventType: q.eventType ?? "casamento",
      eventStartDate: eventDate,
      eventStartTime: "07:00",
      eventEndDate: eventDate,
      eventEndTime: "23:00",
      eventLocation: "Colly Eventos, em Amparo/SP",
      serviceDescription: DEFAULT_SERVICES,
      value: q.total.toString(),
      paymentSignalPct: "20",
      paymentInstallments: "",
      paymentInstallmentValue: "",
      extraHourValue: "",
      signCity: "Amparo",
      signDate: todayISO(),
      notes: "",
      quoteId: String(q.id),
    });
    setEditTarget(null);
    setImportOpen(false);
    setError("");
    setModalOpen(true);
  }

  // Preview do valor por parcela
  const installmentPreview = (() => {
    const val = parseFloat(form.value);
    const pct = parseFloat(form.paymentSignalPct);
    const n = parseInt(form.paymentInstallments);
    if (!val || isNaN(pct) || !n) return null;
    const saldo = val * (1 - pct / 100);
    return saldo / n;
  })();

  // Conflito de data: o espaço só pode ter uma locação por dia.
  // Avisa se a data escolhida já tem outra locação OU um evento no calendário.
  const dateConflict = (() => {
    if (form.type !== "locacao" || !form.eventStartDate) return null;
    const day = form.eventStartDate; // "YYYY-MM-DD"

    const contratoConflitante = contracts.find(
      (c) =>
        c.id !== editTarget?.id &&
        c.type === "locacao" &&
        c.status !== "cancelado" &&
        c.eventStart.slice(0, 10) === day
    );
    if (contratoConflitante) {
      return { tipo: "contrato", nome: contratoConflitante.clientName };
    }

    const eventoConflitante = bookedEvents.find((e) => e.date.slice(0, 10) === day);
    if (eventoConflitante) {
      return { tipo: "agenda", nome: `${eventoConflitante.title} — ${eventoConflitante.clientName}` };
    }
    return null;
  })();

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2a2419]">Contratos</h1>
          <p className="text-sm text-[#9b8b73] mt-1">
            {contracts.length} contrato{contracts.length !== 1 ? "s" : ""} · seus dados ficam fixos
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <Download size={15} /> Importar orçamento
          </Button>
          <Button variant="secondary" onClick={() => openCreate("locacao")}>
            <Plus size={15} /> Locação
          </Button>
          <Button onClick={() => openCreate("decoracao")}>
            <Plus size={15} /> Decoração
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9b8b73]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou CPF..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-[#ede7dc] text-sm text-[#2a2419] placeholder-[#9b8b73] focus:outline-none focus:border-[#b8860b]"
          />
        </div>
        <div className="flex gap-2">
          {["todos", "gerado", "assinado", "cancelado"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-[#d4a017] text-white"
                  : "bg-white border border-[#ede7dc] text-[#9b8b73] hover:border-[#d4cdbe] hover:text-[#2a2419]"
              }`}
            >
              {s === "todos" ? "Todos" : statusLabels[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-[#ede7dc] rounded-xl">
          <FileSignature size={40} className="text-[#d4cdbe] mb-3" />
          <p className="text-[#9b8b73]">Nenhum contrato encontrado</p>
          <button onClick={() => openCreate("decoracao")} className="mt-4">
            <Button size="sm">Criar primeiro contrato</Button>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const s = statusLabels[c.status] ?? statusLabels.gerado;
            return (
              <div
                key={c.id}
                className="card-hover bg-white border border-[#ede7dc] rounded-xl px-5 py-4 flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#fef9ec] flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-[#d4a017]" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#2a2419] truncate">{c.clientName}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${s.color}`}>
                      {s.label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f1ea] text-[#6b5d47] font-medium">
                      {TYPE_LABELS[c.type] ?? "Decoração"}
                    </span>
                    <span className="text-xs text-[#9b8b73] capitalize">{c.eventType}</span>
                    <span className="text-xs text-[#9b8b73]">{formatDate(c.eventStart)}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-[#d4a017] text-lg tabular">{formatCurrency(c.value)}</p>
                  <p className="text-xs text-[#9b8b73] tabular">criado {formatDate(c.createdAt)}</p>
                </div>

                {/* Ações rápidas */}
                {c.status === "gerado" && (
                  <button
                    onClick={() => changeStatus(c.id, "assinado")}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                    title="Marcar como assinado"
                  >
                    <Check size={13} /> Assinado
                  </button>
                )}
                {c.status === "assinado" && (
                  <button
                    onClick={() => changeStatus(c.id, "gerado")}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#fef9ec] text-[#946708] border border-[#f0d060] hover:bg-[#fcf3d6] transition-colors"
                    title="Voltar para gerado"
                  >
                    <Clock size={13} /> Reverter
                  </button>
                )}

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={`/api/contracts/${c.id}/pdf`} target="_blank" rel="noopener noreferrer" title="Baixar PDF">
                    <button className="p-2 rounded-lg text-[#9b8b73] hover:text-[#d4a017] hover:bg-[#fef9ec] transition-colors">
                      <Download size={15} />
                    </button>
                  </a>
                  <button
                    onClick={() => openEdit(c)}
                    className="p-2 rounded-lg text-[#9b8b73] hover:text-[#2a2419] hover:bg-[#f5f1ea] transition-colors"
                    title="Editar"
                  >
                    <Edit size={15} />
                  </button>
                  {c.status !== "cancelado" && (
                    <button
                      onClick={() => changeStatus(c.id, "cancelado")}
                      className="p-2 rounded-lg text-[#9b8b73] hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Cancelar"
                    >
                      <X size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 rounded-lg text-[#9b8b73] hover:text-red-700 hover:bg-red-50 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal criar/editar ──────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Editar contrato" : `Novo contrato — ${TYPE_LABELS[form.type] ?? "Decoração"}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Tipo de contrato */}
          <div className="flex rounded-lg overflow-hidden border border-[#ede7dc]">
            {(["decoracao", "locacao"] as const).map((t) => (
              <button key={t} type="button"
                onClick={() => {
                  f("type", t);
                  f("paymentSignalPct", t === "locacao" ? "30" : "20");
                  f("eventLocation", t === "locacao" ? "Chácara Colly Eventos, em Amparo/SP" : "Colly Eventos, em Amparo/SP");
                }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  form.type === t ? "bg-[#d4a017] text-white" : "bg-white text-[#6b5d47] hover:bg-[#faf8f3]"
                }`}>
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Cliente */}
          <div>
            <p className="text-xs font-semibold text-[#946708] uppercase tracking-wide mb-2">👤 Dados do cliente</p>
            <div className="space-y-3">
              <Input label="Nome completo *" value={form.clientName}
                onChange={(e) => f("clientName", e.target.value)} required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="CPF *" value={form.clientCpf}
                  onChange={(e) => f("clientCpf", maskCPF(e.target.value))}
                  inputMode="numeric"
                  placeholder="000.000.000-00" required />
                <Input label="RG *" value={form.clientRg}
                  onChange={(e) => f("clientRg", maskRG(e.target.value))}
                  inputMode="numeric"
                  placeholder="00.000.000-0" required />
              </div>
              <Input label="Endereço completo *" value={form.clientAddress}
                onChange={(e) => f("clientAddress", e.target.value)}
                placeholder="Rua, número, bairro, cidade/UF" required />
            </div>
          </div>

          {/* Evento */}
          <div className="border-t border-[#f5f1ea] pt-4">
            <p className="text-xs font-semibold text-[#946708] uppercase tracking-wide mb-2">🎉 Evento</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-[#6b5d47]">Tipo</label>
                  <select value={form.eventType} onChange={(e) => f("eventType", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#d4cdbe] text-[#2a2419] text-sm focus:outline-none focus:border-[#b8860b]">
                    <option value="casamento">Casamento</option>
                    <option value="aniversário">Aniversário</option>
                    <option value="batizado">Batizado</option>
                    <option value="formatura">Formatura</option>
                    <option value="corporativo">Corporativo</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <Input label="Local" value={form.eventLocation}
                  onChange={(e) => f("eventLocation", e.target.value)} />
              </div>

              {/* Início — linha própria, data e hora com rótulos claros */}
              <div className="bg-[#faf8f3] border border-[#ede7dc] rounded-xl p-3 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-[#2a2419] mb-2">🟢 Quando começa *</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-[#9b8b73]">Data</label>
                      <input type="date" value={form.eventStartDate}
                        onChange={(e) => f("eventStartDate", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#d4cdbe] text-sm text-[#2a2419] focus:outline-none focus:border-[#b8860b]" required />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-[#9b8b73]">Horário</label>
                      <input type="time" value={form.eventStartTime}
                        onChange={(e) => f("eventStartTime", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#d4cdbe] text-sm text-[#2a2419] focus:outline-none focus:border-[#b8860b]" required />
                    </div>
                  </div>
                </div>
                <div className="border-t border-[#ede7dc] pt-3">
                  <p className="text-sm font-semibold text-[#2a2419] mb-2">🔴 Quando termina *</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-[#9b8b73]">Data</label>
                      <input type="date" value={form.eventEndDate}
                        onChange={(e) => f("eventEndDate", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#d4cdbe] text-sm text-[#2a2419] focus:outline-none focus:border-[#b8860b]" required />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-[#9b8b73]">Horário</label>
                      <input type="time" value={form.eventEndTime}
                        onChange={(e) => f("eventEndTime", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#d4cdbe] text-sm text-[#2a2419] focus:outline-none focus:border-[#b8860b]" required />
                    </div>
                  </div>
                </div>
                {form.eventStartDate && form.eventEndDate === "" && (
                  <button type="button"
                    onClick={() => f("eventEndDate", form.eventStartDate)}
                    className="text-xs text-[#946708] underline">
                    Termina no mesmo dia? Clique para copiar a data de início
                  </button>
                )}
              </div>

              {/* Alerta de data já alugada (somente locação) */}
              {dateConflict && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">
                    <strong>Atenção: esta data já está ocupada!</strong>{" "}
                    {dateConflict.tipo === "contrato"
                      ? `Já existe uma locação para ${dateConflict.nome} neste dia.`
                      : `Já existe um evento na agenda neste dia (${dateConflict.nome}).`}
                    {" "}Confirme se não há conflito antes de gerar.
                  </p>
                </div>
              )}

              {form.type === "decoracao" && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-[#6b5d47]">
                    Serviços contratados (Cláusula 3ª) *
                  </label>
                  <p className="text-[11px] text-[#9b8b73] -mt-0.5 mb-1">
                    Uma coisa por linha. Linhas em CAIXA ALTA viram cabeçalhos negrito.
                  </p>
                  <textarea value={form.serviceDescription}
                    onChange={(e) => f("serviceDescription", e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#d4cdbe] text-[#2a2419] text-xs font-mono focus:outline-none focus:border-[#b8860b] resize-y"
                    required={form.type === "decoracao"} />
                </div>
              )}
              {form.type === "locacao" && (
                <p className="text-[11px] text-[#9b8b73] bg-[#faf8f3] border border-[#ede7dc] rounded-lg px-3 py-2">
                  ℹ️ O contrato de locação já inclui todas as 24 cláusulas padrão (mesas, cadeiras, regras do espaço, gerador, lei do silêncio etc.). Você só preenche cliente, datas, valor e hora extra.
                </p>
              )}
            </div>
          </div>

          {/* Pagamento */}
          <div className="border-t border-[#f5f1ea] pt-4">
            <p className="text-xs font-semibold text-[#946708] uppercase tracking-wide mb-2">💰 Pagamento</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <CurrencyInput label="Valor total *" value={form.value}
                  onChange={(v) => f("value", v)} required />
                <Input label="Sinal (%)" type="number" value={form.paymentSignalPct}
                  onChange={(e) => f("paymentSignalPct", e.target.value)} min="0" max="100" />
              </div>

              {/* Decoração: parcelas do saldo */}
              {form.type === "decoracao" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Nº de parcelas do saldo" type="number" value={form.paymentInstallments}
                      onChange={(e) => f("paymentInstallments", e.target.value)} min="0" placeholder="ex: 5" />
                    <CurrencyInput label="Valor de cada parcela" value={form.paymentInstallmentValue}
                      onChange={(v) => f("paymentInstallmentValue", v)} />
                  </div>
                  {installmentPreview && !form.paymentInstallmentValue && (
                    <p className="text-xs text-[#946708] bg-[#fef9ec] border border-[#f0d060] rounded-lg px-3 py-2">
                      💡 Sugestão: <strong>{form.paymentInstallments}x de {formatCurrency(installmentPreview)}</strong> (saldo após sinal de {form.paymentSignalPct}%).
                    </p>
                  )}
                </>
              )}

              {/* Locação: hora extra + nota do restante */}
              {form.type === "locacao" && (
                <>
                  <CurrencyInput label="Valor da hora extra (Cláusula 4ª)" value={form.extraHourValue}
                    onChange={(v) => f("extraHourValue", v)} />
                  <p className="text-xs text-[#946708] bg-[#fef9ec] border border-[#f0d060] rounded-lg px-3 py-2">
                    💡 Pagamento: entrada de <strong>{form.paymentSignalPct}%</strong>
                    {form.value && <> (<strong>{formatCurrency(parseFloat(form.value) * (parseFloat(form.paymentSignalPct || "0") / 100))}</strong>)</>}
                    {" "}na assinatura, restante até 30 dias antes do evento.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Assinatura */}
          <div className="border-t border-[#f5f1ea] pt-4">
            <p className="text-xs font-semibold text-[#946708] uppercase tracking-wide mb-2">✍️ Assinatura</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Cidade" value={form.signCity}
                onChange={(e) => f("signCity", e.target.value)} />
              <Input label="Data" type="date" value={form.signDate}
                onChange={(e) => f("signDate", e.target.value)} />
            </div>
          </div>

          {/* Painel: partes que serão inseridas no contrato (preview ao vivo) */}
          <div className="border-t border-[#f5f1ea] pt-4">
            <p className="text-xs font-semibold text-[#946708] uppercase tracking-wide mb-2">
              📋 Como vai entrar no contrato
            </p>
            <div className="bg-[#faf8f3] border border-[#ede7dc] rounded-xl p-3 space-y-2 text-xs text-[#2a2419] leading-relaxed">
              <p>
                <span className="font-semibold text-[#946708]">Cláusula 1ª — </span>
                {form.type === "locacao"
                  ? `A locação se iniciará às ${form.eventStartTime} horas do dia ${brDate(form.eventStartDate)} e a terminar às ${form.eventEndTime} horas do dia ${brDate(form.eventEndDate)}.`
                  : `Evento com início às ${form.eventStartTime} do dia ${brDate(form.eventStartDate)} e término às ${form.eventEndTime} do dia ${brDate(form.eventEndDate)}.`}
              </p>
              <p>
                <span className="font-semibold text-[#946708]">Cláusula 2ª — </span>
                destina-se exclusivamente à realização de evento <strong>{form.eventType}</strong>.
              </p>
              <p>
                <span className="font-semibold text-[#946708]">Cláusula 3ª — </span>
                {form.value ? (
                  <>
                    valor de <strong>{formatCurrency(parseFloat(form.value))}</strong>
                    {form.type === "locacao"
                      ? <>, entrada de {form.paymentSignalPct}% (<strong>{formatCurrency(parseFloat(form.value) * (parseFloat(form.paymentSignalPct || "0") / 100))}</strong>) na assinatura, restante até 30 dias antes do evento.</>
                      : <>, sinal de {form.paymentSignalPct}% na assinatura{form.paymentInstallments ? ` + ${form.paymentInstallments} parcelas do saldo.` : "."}</>}
                  </>
                ) : (
                  <span className="text-[#9b8b73]">preencha o valor acima…</span>
                )}
              </p>
              {form.type === "locacao" && (
                <p>
                  <span className="font-semibold text-[#946708]">Cláusula 4ª — </span>
                  cada hora extra: <strong>{form.extraHourValue ? formatCurrency(parseFloat(form.extraHourValue)) : "não definido"}</strong>.
                </p>
              )}
              <p className="text-[11px] text-[#9b8b73] pt-1 border-t border-[#ede7dc]">
                {form.type === "locacao"
                  ? "As demais 20 cláusulas (regras do espaço, gerador, móveis, rescisão, foro…) já entram automaticamente."
                  : "As demais cláusulas (obrigações, rescisão, foro, LGPD…) já entram automaticamente."}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : editTarget ? "Salvar alterações" : "Gerar contrato"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal importar ──────────────────────────────── */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Importar de orçamento aprovado">
        <div className="space-y-2">
          <p className="text-xs text-[#9b8b73] mb-3">
            Os dados do cliente (nome, CPF, endereço) e o valor virão preenchidos. Você completa o RG, ajusta data/hora e revisa antes de gerar.
          </p>
          {quotesAprovados.length === 0 ? (
            <p className="text-sm text-[#9b8b73] text-center py-6">Nenhum orçamento aprovado disponível.</p>
          ) : quotesAprovados.map((q) => (
            <button key={q.id} type="button" onClick={() => importFromQuote(q)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#ede7dc] bg-white hover:border-[#d4a017] cursor-pointer transition-colors text-left">
              <div>
                <p className="text-sm font-semibold text-[#2a2419]">{q.clientName}</p>
                <p className="text-xs text-[#9b8b73]">
                  #{String(q.id).padStart(4, "0")}
                  {q.eventDate && ` · ${formatDate(q.eventDate)}`}
                  {q.eventType && ` · ${q.eventType}`}
                </p>
              </div>
              <p className="text-sm font-bold text-[#d4a017]">{formatCurrency(q.total)}</p>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
