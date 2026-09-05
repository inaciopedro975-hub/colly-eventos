"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Plus, Edit, Trash2, Shield, User, UserX } from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface Props {
  initialUsers: UserRow[];
}

const emptyForm = {
  name: "",
  email: "",
  password: "",
  userRole: "staff",
  active: true,
};

export function AdminClient({ initialUsers }: Props) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string })?.id;

  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const f = (key: string, val: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  function openEdit(user: UserRow) {
    setEditTarget(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      userRole: user.role,
      active: user.active,
    });
    setError("");
    setEditOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setUsers((prev) => [...prev, data]);
      setCreateOpen(false);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar usuário.");
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
      const res = await fetch(`/api/users/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)));
      setEditOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(user: UserRow) {
    if (user.id === currentUserId) return;
    if (!confirm(`Excluir o usuário "${user.name}"?`)) return;
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== user.id));
  }

  function UserForm({ isCreate }: { isCreate: boolean }) {
    return (
      <form onSubmit={isCreate ? handleCreate : handleEdit} className="space-y-4">
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <Input label="Nome *" value={form.name} onChange={(e) => f("name", e.target.value)} required />
        <Input label="Email *" type="email" value={form.email} onChange={(e) => f("email", e.target.value)} required />
        <Input
          label={isCreate ? "Senha *" : "Nova senha (deixe em branco para não alterar)"}
          type="password"
          value={form.password}
          onChange={(e) => f("password", e.target.value)}
          required={isCreate}
          placeholder={isCreate ? "" : "••••••••"}
        />
        <Select label="Nível de acesso" value={form.userRole} onChange={(e) => f("userRole", e.target.value)}>
          <option value="staff">Funcionário</option>
          <option value="admin">Administrador</option>
        </Select>
        {!isCreate && (
          <Select label="Status" value={form.active ? "ativo" : "inativo"} onChange={(e) => f("active", e.target.value === "ativo")}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </Select>
        )}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Salvando..." : isCreate ? "Criar usuário" : "Salvar"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => { setCreateOpen(false); setEditOpen(false); }}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2a2419]">Administração</h1>
          <p className="text-sm text-[#9b8b73] mt-1">Gestão de usuários do sistema</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setError(""); setCreateOpen(true); }}>
          <Plus size={16} />
          Novo usuário
        </Button>
      </div>

      {/* overflow-x-auto: no celular a tabela é mais larga que a tela; sem isso
          ela empurra a página inteira para os lados em vez de rolar sozinha. */}
      <div className="bg-[#ffffff] border border-[#f5f1ea] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-[#f5f1ea]">
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9b8b73] uppercase tracking-wider">Usuário</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9b8b73] uppercase tracking-wider">Acesso</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9b8b73] uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#9b8b73] uppercase tracking-wider">Criado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#faf8f3]">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-[#faf8f3] transition-colors group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#f5f1ea] flex items-center justify-center">
                      {user.role === "admin" ? (
                        <Shield size={14} className="text-[#d4a017]" />
                      ) : (
                        <User size={14} className="text-[#9b8b73]" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[#2a2419]">
                        {user.name}
                        {user.id === currentUserId && (
                          <span className="ml-2 text-[10px] text-[#d4a017] bg-[#d4a017]/10 px-1.5 py-0.5 rounded">você</span>
                        )}
                      </p>
                      <p className="text-xs text-[#9b8b73]">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-medium ${user.role === "admin" ? "text-[#d4a017]" : "text-[#9b8b73]"}`}>
                    {user.role === "admin" ? "Administrador" : "Funcionário"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <Badge variant={user.active ? "confirmado" : "cancelado"}>
                    {user.active ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-xs text-[#9b8b73]">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(user)}
                      className="p-1.5 rounded-lg text-[#9b8b73] hover:text-[#2a2419] hover:bg-[#f5f1ea] transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                    {user.id !== currentUserId && (
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-1.5 rounded-lg text-[#9b8b73] hover:text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo Usuário">
        <UserForm isCreate={true} />
      </Modal>
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar Usuário">
        <UserForm isCreate={false} />
      </Modal>
    </>
  );
}
