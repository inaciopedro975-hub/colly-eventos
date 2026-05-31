"use client";
import { useState, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Plus, Edit, Package, Search, Tag, ImagePlus, X } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  unit: string;
  category: string;
  active: boolean;
  imageUrl?: string | null;
}

const emptyForm = {
  name: "",
  description: "",
  price: "",
  unit: "un",
  category: "geral",
  active: true,
  imageUrl: "",
};

const unitLabels: Record<string, string> = {
  un: "Unidade",
  kg: "Kg",
  hora: "Hora",
  pessoa: "Por pessoa",
  porcao: "Porcao",
  litro: "Litro",
};

interface ProductFormProps {
  form: typeof emptyForm;
  onFieldChange: (key: string, val: string | boolean) => void;
  error: string;
  loading: boolean;
  previewSrc: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetImageState: () => void;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

function ProductForm({
  form,
  onFieldChange,
  error,
  loading,
  previewSrc,
  fileInputRef,
  handleFileChange,
  resetImageState,
  setForm,
  onCancel,
  onSubmit,
}: ProductFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[#6b5d47]">Foto do produto</label>
        <div className="flex items-start gap-3">
          <div
            className="w-20 h-20 rounded-xl border border-[#d4cdbe] bg-[#f5f1ea] flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-[#d4a017] transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {previewSrc ? (
              <img src={previewSrc} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <ImagePlus size={22} className="text-[#c9beac]" />
            )}
          </div>
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mb-2"
            >
              <ImagePlus size={14} />
              {previewSrc ? "Trocar foto" : "Adicionar foto"}
            </Button>
            {previewSrc && (
              <button
                type="button"
                onClick={() => {
                  resetImageState();
                  setForm((prev) => ({ ...prev, imageUrl: "" }));
                }}
                className="flex items-center gap-1 text-xs text-[#9b8b73] hover:text-red-600 transition-colors"
              >
                <X size={12} />
                Remover foto
              </button>
            )}
            <p className="text-xs text-[#9b8b73] mt-1">JPG, PNG ou WebP. Max. 4 MB.</p>
          </div>
        </div>
      </div>

      <Input
        label="Nome do produto *"
        value={form.name}
        onChange={(e) => onFieldChange("name", e.target.value)}
        placeholder="Ex: Buffet completo para 100 pessoas"
        required
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[#6b5d47]">Descricao</label>
        <textarea
          value={form.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-white border border-[#d4cdbe] text-[#2a2419] placeholder-[#9b8b73] text-base lg:text-sm focus:outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#d4a017]/15 resize-none"
          placeholder="Descricao opcional..."
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CurrencyInput
          label="Preço *"
          value={form.price}
          onChange={(v) => onFieldChange("price", v)}
          required
        />
        <Select label="Unidade" value={form.unit} onChange={(e) => onFieldChange("unit", e.target.value)}>
          {Object.entries(unitLabels).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </Select>
        <Input
          label="Categoria"
          value={form.category}
          onChange={(e) => onFieldChange("category", e.target.value)}
          placeholder="Ex: buffet, bebidas..."
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#6b5d47]">Status</label>
          <select
            value={form.active ? "ativo" : "inativo"}
            onChange={(e) => onFieldChange("active", e.target.value === "ativo")}
            className="w-full px-3 py-2 rounded-lg bg-white border border-[#d4cdbe] text-[#2a2419] text-base lg:text-sm focus:outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#d4a017]/15"
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

interface Props {
  initialProducts: Product[];
}

export function CatalogClient({ initialProducts }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ["todos", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "todos" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const onFieldChange = (key: string, val: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  function resetImageState() {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function openCreate() {
    setForm(emptyForm);
    setError("");
    resetImageState();
    setCreateOpen(true);
  }

  function openEdit(product: Product) {
    setEditTarget(product);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: product.price.toString(),
      unit: product.unit,
      category: product.category,
      active: product.active,
      imageUrl: product.imageUrl ?? "",
    });
    setError("");
    resetImageState();
    setEditOpen(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return null;
    const fd = new FormData();
    fd.append("file", imageFile);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Falha no upload da imagem");
    const data = await res.json();
    return data.url as string;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let imageUrl = form.imageUrl || null;
      if (imageFile) imageUrl = await uploadImage();
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imageUrl }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setProducts((prev) => [...prev, created]);
      setCreateOpen(false);
      setForm(emptyForm);
      resetImageState();
    } catch {
      setError("Erro ao criar produto.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setError("");
    setLoading(true);
    try {
      let imageUrl = form.imageUrl || null;
      if (imageFile) imageUrl = await uploadImage();
      const res = await fetch(`/api/products/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imageUrl }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditOpen(false);
      resetImageState();
    } catch {
      setError("Erro ao salvar produto.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(product: Product) {
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, active: !product.active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    }
  }

  const previewSrc = imagePreview || form.imageUrl || "";
  const sharedProps: ProductFormProps = {
    form,
    onFieldChange,
    error,
    loading,
    previewSrc,
    fileInputRef,
    handleFileChange,
    resetImageState,
    setForm,
    onCancel: () => { setCreateOpen(false); setEditOpen(false); resetImageState(); },
    onSubmit: handleCreate,
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2a2419]">Catalogo de Produtos</h1>
          <p className="text-sm text-[#9b8b73] mt-1">{products.filter(p => p.active).length} produtos ativos</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Novo produto
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9b8b73]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#ffffff] border border-[#ede7dc] text-[#2a2419] placeholder-[#9b8b73] text-base lg:text-sm focus:outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#d4a017]/15"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-[#d4a017] text-[#faf8f3]"
                  : "bg-[#ffffff] border border-[#ede7dc] text-[#9b8b73] hover:border-[#d4cdbe] hover:text-[#2a2419]"
              }`}
            >
              {cat === "todos" ? "Todos" : cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package size={40} className="text-[#d4cdbe] mb-3" />
          <p className="text-[#9b8b73]">Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className={`bg-[#ffffff] border rounded-xl overflow-hidden transition-all group ${
                product.active ? "border-[#ede7dc] hover:border-[#d4cdbe]" : "border-[#faf8f3] opacity-60"
              }`}
            >
              {product.imageUrl ? (
                <div className="relative w-full h-36 bg-[#f5f1ea]">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => openEdit(product)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm text-[#9b8b73] hover:text-[#2a2419] hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Edit size={14} />
                  </button>
                  {!product.active && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="default" className="text-[10px]">Inativo</Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 pb-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-[#f5f1ea] flex items-center justify-center">
                      <Package size={16} className="text-[#d4a017]" />
                    </div>
                    <div className="flex items-center gap-1">
                      {!product.active && (
                        <Badge variant="default" className="text-[10px]">Inativo</Badge>
                      )}
                      <button
                        onClick={() => openEdit(product)}
                        className="p-1.5 rounded-lg text-[#9b8b73] hover:text-[#2a2419] hover:bg-[#f5f1ea] transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-[#2a2419] mb-1 leading-tight">{product.name}</h3>
                {product.description && (
                  <p className="text-xs text-[#9b8b73] mb-3 line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#ede7dc]">
                  <div>
                    <p className="text-base font-bold text-[#d4a017]">{formatCurrency(product.price)}</p>
                    <p className="text-[10px] text-[#9b8b73]">{unitLabels[product.unit] ?? product.unit}</p>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-[#9b8b73] bg-[#f5f1ea] px-2 py-1 rounded-full">
                    <Tag size={9} />
                    {product.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => { setCreateOpen(false); resetImageState(); }} title="Novo Produto" closeOnBackdropClick={false}>
        <ProductForm {...sharedProps} onSubmit={handleCreate} />
      </Modal>

      <Modal open={editOpen} onClose={() => { setEditOpen(false); resetImageState(); }} title="Editar Produto" closeOnBackdropClick={false}>
        <ProductForm {...sharedProps} onSubmit={handleEdit} />
      </Modal>
    </>
  );
}
