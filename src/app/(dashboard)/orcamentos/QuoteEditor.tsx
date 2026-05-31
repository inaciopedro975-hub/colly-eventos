"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { parseToCents, formatBRL } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Search, Package, ChevronLeft, Save, FileDown } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  unit: string;
  category: string;
}

interface QuoteItem {
  productId: string;
  productName: string;
  productUnit: string;
  quantity: number;
  unitPrice: number;
  notes: string;
}

interface ExistingQuote {
  id: number;
  clientName: string;
  clientDoc?: string | null;
  clientAddress?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;
  eventDate?: string | null;
  eventType?: string | null;
  guestCount?: number | null;
  status: string;
  notes?: string | null;
  paymentTerms?: string | null;
  validity?: string | null;
  discount: number;
  total: number;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    notes?: string | null;
    product: Product;
  }>;
}

interface Props {
  products: Product[];
  existing?: ExistingQuote;
}

const unitLabels: Record<string, string> = {
  un: "un",
  kg: "kg",
  hora: "h",
  pessoa: "pax",
  porcao: "porç",
  litro: "L",
};

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-white border border-[#d4cdbe] text-[#2a2419] placeholder-[#9b8b73] text-sm focus:outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#d4a017]/15 transition-colors";

export function QuoteEditor({ products, existing }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showCatalog, setShowCatalog] = useState(false);

  const [form, setForm] = useState({
    clientName: existing?.clientName ?? "",
    clientDoc: existing?.clientDoc ?? "",
    clientAddress: existing?.clientAddress ?? "",
    clientPhone: existing?.clientPhone ?? "",
    clientEmail: existing?.clientEmail ?? "",
    eventDate: existing?.eventDate ? existing.eventDate.split("T")[0] : "",
    eventType: existing?.eventType ?? "",
    guestCount: existing?.guestCount?.toString() ?? "",
    status: existing?.status ?? "rascunho",
    notes: existing?.notes ?? "",
    paymentTerms: existing?.paymentTerms ?? "",
    validity: existing?.validity ?? "30 dias",
    discount: existing?.discount?.toString() ?? "0",
  });

  const [items, setItems] = useState<QuoteItem[]>(
    existing?.items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      productUnit: item.product.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      notes: item.notes ?? "",
    })) ?? []
  );

  const f = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  function addProduct(product: Product) {
    const exists = items.find((i) => i.productId === product.id);
    if (exists) {
      setItems((prev) =>
        prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          productUnit: product.unit,
          quantity: 1,
          unitPrice: product.price,
          notes: "",
        },
      ]);
    }
    setShowCatalog(false);
    setProductSearch("");
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function updateItem(productId: string, key: "quantity" | "unitPrice" | "notes", val: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, [key]: key === "notes" ? val : parseFloat(val) || 0 }
          : i
      )
    );
  }

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const discountVal = parseFloat(form.discount) || 0;
  const total = subtotal - discountVal;

  async function handleSave() {
    if (!form.clientName) {
      setError("Nome do cliente é obrigatório.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        guestCount: form.guestCount || null,
        discount: discountVal,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          notes: i.notes,
        })),
      };

      let res;
      if (existing) {
        res = await fetch(`/api/quotes/${existing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error();
      const saved = await res.json();
      router.push(`/orcamentos/${saved.id.toString()}`);
      router.refresh();
    } catch {
      setError("Erro ao salvar orçamento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-[#9b8b73] hover:text-[#2a2419] hover:bg-white transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-[#2a2419] tracking-tight">
            {existing ? `Orçamento Nº ${String(existing.id).padStart(4, "0")}` : "Novo Orçamento"}
          </h1>
          <p className="text-xs text-[#9b8b73] mt-0.5">
            {existing ? "Edite os dados e gere o PDF para o cliente" : "Preencha os dados para criar a proposta"}
          </p>
        </div>
        <Select value={form.status} onChange={(e) => f("status", e.target.value)} className="w-36">
          <option value="rascunho">Rascunho</option>
          <option value="enviado">Enviado</option>
          <option value="aprovado">Aprovado</option>
          <option value="rejeitado">Rejeitado</option>
        </Select>
        {existing && (
          <a
            href={`/api/quotes/${existing.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" type="button">
              <FileDown size={16} />
              Baixar PDF
            </Button>
          </a>
        )}
        <Button onClick={handleSave} disabled={loading}>
          <Save size={16} />
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Client + Details */}
        <div className="lg:col-span-1 space-y-4">
          <Section title="Dados do Cliente">
            <Input label="Nome / Razão Social *" value={form.clientName} onChange={(e) => f("clientName", e.target.value)} placeholder="Nome completo" required />
            <Input label="CNPJ / CPF" value={form.clientDoc} onChange={(e) => f("clientDoc", e.target.value)} placeholder="000.000.000-00" />
            <Input label="Endereço" value={form.clientAddress} onChange={(e) => f("clientAddress", e.target.value)} placeholder="Rua, número, bairro, cidade" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Telefone" value={form.clientPhone} onChange={(e) => f("clientPhone", e.target.value)} placeholder="(11) 99999-9999" />
              <Input label="Email" type="email" value={form.clientEmail} onChange={(e) => f("clientEmail", e.target.value)} placeholder="cliente@email.com" />
            </div>
          </Section>

          <Section title="Detalhes do Evento">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Data" type="date" value={form.eventDate} onChange={(e) => f("eventDate", e.target.value)} />
              <Input label="Convidados" type="number" value={form.guestCount} onChange={(e) => f("guestCount", e.target.value)} min="0" />
            </div>
            <Select label="Tipo de evento" value={form.eventType} onChange={(e) => f("eventType", e.target.value)}>
              <option value="">Selecionar...</option>
              <option value="Casamento">Casamento</option>
              <option value="Aniversário">Aniversário</option>
              <option value="Corporativo">Corporativo</option>
              <option value="Formatura">Formatura</option>
              <option value="Outro">Outro</option>
            </Select>
          </Section>

          <Section title="Condições">
            <Input label="Forma de pagamento" value={form.paymentTerms} onChange={(e) => f("paymentTerms", e.target.value)} placeholder="Ex: 50% sinal + 50% no evento" />
            <Input label="Validade da proposta" value={form.validity} onChange={(e) => f("validity", e.target.value)} placeholder="30 dias" />
          </Section>

          <Section title="Observações">
            <textarea
              value={form.notes}
              onChange={(e) => f("notes", e.target.value)}
              rows={4}
              className={`${inputClass} resize-none`}
              placeholder="Informações adicionais que aparecerão no PDF..."
            />
          </Section>
        </div>

        {/* Right: Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-[#ede7dc] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-[#2a2419] tracking-tight">
                  Itens da Proposta
                </h2>
                <p className="text-xs text-[#9b8b73] mt-0.5">
                  {items.length} {items.length === 1 ? "item adicionado" : "itens adicionados"}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setShowCatalog(!showCatalog)}>
                <Plus size={14} />
                Adicionar do catálogo
              </Button>
            </div>

            {/* Catalog picker */}
            {showCatalog && (
              <div className="mb-4 bg-[#faf8f3] border border-[#ede7dc] rounded-lg p-4">
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9b8b73]" />
                  <input
                    autoFocus
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar no catálogo..."
                    className={`pl-9 ${inputClass}`}
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredProducts.length === 0 ? (
                    <p className="text-sm text-[#9b8b73] text-center py-4">Nenhum produto encontrado</p>
                  ) : (
                    filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addProduct(p)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white border border-transparent hover:border-[#ede7dc] transition-all text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded bg-[#fef9ec] flex items-center justify-center flex-shrink-0">
                            <Package size={13} className="text-[#d4a017]" />
                          </div>
                          <div>
                            <p className="text-sm text-[#2a2419] font-medium">{p.name}</p>
                            <p className="text-xs text-[#9b8b73]">{p.category}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-[#d4a017] whitespace-nowrap">
                          {formatCurrency(p.price)}<span className="text-[#9b8b73] font-normal">/{unitLabels[p.unit] ?? p.unit}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Items list */}
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-[#faf8f3]/50 border border-dashed border-[#ede7dc] rounded-lg">
                <Package size={28} className="text-[#c9beac] mb-2" />
                <p className="text-sm text-[#6b5d47] font-medium">Nenhum item adicionado</p>
                <p className="text-xs text-[#9b8b73] mt-1">
                  Use o botão acima para incluir produtos do catálogo
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="grid grid-cols-12 gap-2 px-3 text-[10px] text-[#9b8b73] font-semibold uppercase tracking-wider">
                  <span className="col-span-5">Produto</span>
                  <span className="col-span-2 text-center">Qtd</span>
                  <span className="col-span-2 text-center">Preço un.</span>
                  <span className="col-span-2 text-right">Total</span>
                  <span className="col-span-1" />
                </div>
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="grid grid-cols-12 gap-2 items-center bg-[#faf8f3] border border-[#ede7dc] rounded-lg px-3 py-2.5"
                  >
                    <div className="col-span-5">
                      <p className="text-sm font-medium text-[#2a2419] leading-tight">
                        {item.productName}
                      </p>
                      <input
                        value={item.notes}
                        onChange={(e) => updateItem(item.productId, "notes", e.target.value)}
                        placeholder="Observação para este item..."
                        className="mt-1 w-full text-xs bg-transparent border-0 text-[#6b5d47] placeholder-[#c9beac] focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.productId, "quantity", e.target.value)}
                        min="0.01"
                        step="0.01"
                        className="w-full px-2 py-1 rounded-md bg-white border border-[#d4cdbe] text-[#2a2419] text-xs text-center focus:outline-none focus:border-[#b8860b]"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatBRL(parseToCents(item.unitPrice))}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          const cents = digits === "" ? 0 : parseInt(digits, 10);
                          updateItem(item.productId, "unitPrice", (cents / 100).toFixed(2));
                        }}
                        className="w-full px-2 py-1 rounded-md bg-white border border-[#d4cdbe] text-[#2a2419] text-xs text-right tabular focus:outline-none focus:border-[#b8860b]"
                      />
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-sm font-semibold text-[#2a2419]">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-1.5 rounded-md text-[#9b8b73] hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="bg-white border border-[#ede7dc] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6b5d47]">Subtotal</span>
                <span className="text-[#2a2419] font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6b5d47]">Desconto</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9b8b73]">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatBRL(parseToCents(form.discount))}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      const cents = digits === "" ? 0 : parseInt(digits, 10);
                      f("discount", (cents / 100).toFixed(2));
                    }}
                    className="w-28 px-2 py-1 rounded-md bg-white border border-[#d4cdbe] text-[#2a2419] text-sm text-right tabular focus:outline-none focus:border-[#b8860b]"
                  />
                </div>
              </div>
            </div>
            <div className="bg-[#2a2419] px-5 py-4 flex items-center justify-between">
              <span className="text-base font-semibold text-white">Total Geral</span>
              <span className="text-2xl font-bold text-[#d4a017]">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#ede7dc] rounded-xl p-5 space-y-3 shadow-sm">
      <h2 className="text-[11px] font-semibold text-[#9b8b73] uppercase tracking-wider">
        {title}
      </h2>
      {children}
    </div>
  );
}
