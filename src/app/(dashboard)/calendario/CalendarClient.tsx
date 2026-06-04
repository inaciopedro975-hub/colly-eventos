"use client";
import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import { EventClickArg, EventInput } from "@fullcalendar/core";
import type FullCalendarType from "@fullcalendar/react";

// Lazy-load do FullCalendar — só baixa o JS quando a página carrega
const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 text-[#9b8b73] text-sm">
      Carregando calendário…
    </div>
  ),
}) as unknown as typeof FullCalendarType;
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateLong } from "@/lib/utils";
import { AlertTriangle, Calendar, Trash2, Edit, Plus } from "lucide-react";

interface EventData {
  id: string;
  title: string;
  clientName: string;
  clientPhone?: string | null;
  clientEmail?: string | null;
  date: string;
  timeStart?: string | null;
  timeEnd?: string | null;
  type: string;
  status: string;
  notes?: string | null;
  value?: number | null;
  guestCount?: number | null;
}

interface Props {
  initialEvents: EventData[];
}

const typeLabels: Record<string, string> = {
  casamento: "Casamento",
  aniversario: "Aniversário",
  corporativo: "Corporativo",
  outro: "Outro",
};

const typeColors: Record<string, string> = {
  casamento: "#d4a017",
  aniversario: "#9b59b6",
  corporativo: "#2980b9",
  outro: "#c9beac",
};

const statusLabels: Record<string, string> = {
  confirmado: "Confirmado",
  tentativo: "Tentativo",
  cancelado: "Cancelado",
};

const emptyForm = {
  title: "",
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  date: "",
  timeStart: "",
  timeEnd: "",
  type: "casamento",
  status: "confirmado",
  notes: "",
  value: "",
  guestCount: "",
};

export function CalendarClient({ initialEvents }: Props) {
  const [events, setEvents] = useState<EventData[]>(initialEvents);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [conflictError, setConflictError] = useState("");
  const [loading, setLoading] = useState(false);
  const calendarRef = useRef<FullCalendarType>(null);

  const calendarEvents: EventInput[] = events.map((e) => ({
    id: e.id,
    title: e.type === "casamento" ? `💍 ${e.title}` : e.title,
    start: e.date,
    backgroundColor: typeColors[e.type] ?? "#c9beac",
    borderColor: typeColors[e.type] ?? "#c9beac",
    opacity: e.status === "cancelado" ? 0.4 : 1,
    extendedProps: { ...e },
  }));

  function checkConflict(date: string, excludeId?: string): EventData | null {
    const day = date.split("T")[0];
    const conflict = events.find((e) => {
      if (excludeId && e.id === excludeId) return false;
      if (e.status === "cancelado") return false;
      return e.date.split("T")[0] === day;
    });
    return conflict ?? null;
  }

  function openCreate(date: string) {
    setSelectedDate(date);
    setForm({ ...emptyForm, date });
    setConflictError("");
    setCreateOpen(true);
  }

  const handleDateClick = useCallback((arg: DateClickArg) => {
    openCreate(arg.dateStr);
  }, []);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const ev = arg.event.extendedProps as EventData;
    setSelectedEvent({ ...ev, id: arg.event.id });
    setViewOpen(true);
  }, []);

  function openEdit(ev: EventData) {
    setForm({
      title: ev.title,
      clientName: ev.clientName,
      clientPhone: ev.clientPhone ?? "",
      clientEmail: ev.clientEmail ?? "",
      date: ev.date.split("T")[0],
      timeStart: ev.timeStart ?? "",
      timeEnd: ev.timeEnd ?? "",
      type: ev.type,
      status: ev.status,
      notes: ev.notes ?? "",
      value: ev.value?.toString() ?? "",
      guestCount: ev.guestCount?.toString() ?? "",
    });
    setConflictError("");
    setViewOpen(false);
    setEditOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setConflictError("");

    const conflict = checkConflict(form.date);
    if (conflict) {
      setConflictError(
        `Conflito! Já existe "${conflict.title}" (${conflict.clientName}) nesta data.`
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          value: form.value ? parseFloat(form.value) : null,
          guestCount: form.guestCount ? parseInt(form.guestCount) : null,
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setEvents((prev) => [...prev, created]);
      setCreateOpen(false);
      setForm(emptyForm);
    } catch {
      setConflictError("Erro ao criar evento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEvent) return;
    setConflictError("");

    const conflict = checkConflict(form.date, selectedEvent.id);
    if (conflict) {
      setConflictError(
        `Conflito! Já existe "${conflict.title}" (${conflict.clientName}) nesta data.`
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          value: form.value ? parseFloat(form.value) : null,
          guestCount: form.guestCount ? parseInt(form.guestCount) : null,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
      setEditOpen(false);
      setSelectedEvent(updated);
    } catch {
      setConflictError("Erro ao salvar evento.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este evento?")) return;
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setViewOpen(false);
    }
  }

  const f = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2a2419]">Calendário de Eventos</h1>
          <p className="text-sm text-[#9b8b73] mt-1">
            Clique em uma data para adicionar um evento
          </p>
        </div>
        <Button onClick={() => openCreate(new Date().toISOString().split("T")[0])}>
          <Plus size={16} />
          Novo evento
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-5 text-xs text-[#9b8b73]">
        {Object.entries(typeLabels).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: typeColors[key] }}
            />
            {label}
          </span>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-[#ffffff] border border-[#ede7dc] rounded-xl p-4 overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="pt-br"
          events={calendarEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth",
          }}
          buttonText={{ today: "Hoje", month: "Mês" }}
          dayMaxEvents={3}
          eventDisplay="block"
          eventClassNames="cursor-pointer text-xs font-medium px-1 rounded"
        />
      </div>

      {/* CREATE MODAL */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setConflictError(""); }}
        title="Novo Evento"
        className="max-w-xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {conflictError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{conflictError}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input label="Título do evento" value={form.title} onChange={(e) => f("title", e.target.value)} placeholder="Ex: Casamento Silva & Souza" required />
            </div>
            <Input label="Data *" type="date" value={form.date} onChange={(e) => f("date", e.target.value)} required />
            <Select label="Tipo" value={form.type} onChange={(e) => f("type", e.target.value)}>
              <option value="casamento">Casamento</option>
              <option value="aniversario">Aniversário</option>
              <option value="corporativo">Corporativo</option>
              <option value="outro">Outro</option>
            </Select>
            <Input label="Horário início" type="time" value={form.timeStart} onChange={(e) => f("timeStart", e.target.value)} />
            <Input label="Horário fim" type="time" value={form.timeEnd} onChange={(e) => f("timeEnd", e.target.value)} />
            <Input label="Nome do cliente *" value={form.clientName} onChange={(e) => f("clientName", e.target.value)} required />
            <Input label="Telefone" value={form.clientPhone} onChange={(e) => f("clientPhone", e.target.value)} placeholder="(11) 99999-9999" />
            <Input label="Email" type="email" value={form.clientEmail} onChange={(e) => f("clientEmail", e.target.value)} />
            <CurrencyInput label="Valor" value={form.value} onChange={(v) => f("value", v)} />
            <Input label="Convidados" type="number" value={form.guestCount} onChange={(e) => f("guestCount", e.target.value)} min="0" />
            <Select label="Status" value={form.status} onChange={(e) => f("status", e.target.value)} className="col-span-2">
              <option value="confirmado">Confirmado</option>
              <option value="tentativo">Tentativo</option>
              <option value="cancelado">Cancelado</option>
            </Select>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-sm font-medium text-[#6b5d47]">Observações</label>
              <textarea
                value={form.notes}
                onChange={(e) => f("notes", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#d4cdbe] text-[#2a2419] placeholder-[#9b8b73] text-sm focus:outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#d4a017]/15 resize-none"
                placeholder="Informações adicionais..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : "Criar evento"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL */}
      {selectedEvent && (
        <Modal
          open={viewOpen}
          onClose={() => setViewOpen(false)}
          title={selectedEvent.title}
          className="max-w-md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={selectedEvent.status as never}>
                {statusLabels[selectedEvent.status]}
              </Badge>
              <span className="text-xs text-[#9b8b73]">{typeLabels[selectedEvent.type]}</span>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-[#6b5d47]">
                <Calendar size={14} />
                <span>{formatDateLong(selectedEvent.date)}</span>
                {selectedEvent.timeStart && (
                  <span className="text-[#9b8b73]">
                    {selectedEvent.timeStart}
                    {selectedEvent.timeEnd ? ` – ${selectedEvent.timeEnd}` : ""}
                  </span>
                )}
              </div>

              <div className="bg-[#f5f1ea] rounded-lg p-3 space-y-2">
                <p className="font-medium text-[#2a2419]">{selectedEvent.clientName}</p>
                {selectedEvent.clientPhone && (
                  <p className="text-[#9b8b73]">{selectedEvent.clientPhone}</p>
                )}
                {selectedEvent.clientEmail && (
                  <p className="text-[#9b8b73]">{selectedEvent.clientEmail}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {selectedEvent.value && (
                  <div className="bg-[#f5f1ea] rounded-lg p-3">
                    <p className="text-xs text-[#9b8b73]">Valor</p>
                    <p className="font-semibold text-[#d4a017]">{formatCurrency(selectedEvent.value)}</p>
                  </div>
                )}
                {selectedEvent.guestCount && (
                  <div className="bg-[#f5f1ea] rounded-lg p-3">
                    <p className="text-xs text-[#9b8b73]">Convidados</p>
                    <p className="font-semibold text-[#2a2419]">{selectedEvent.guestCount}</p>
                  </div>
                )}
              </div>

              {selectedEvent.notes && (
                <div className="bg-[#f5f1ea] rounded-lg p-3">
                  <p className="text-xs text-[#9b8b73] mb-1">Observações</p>
                  <p className="text-[#6b5d47]">{selectedEvent.notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={() => openEdit(selectedEvent)} className="flex-1" size="sm">
                <Edit size={14} />
                Editar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(selectedEvent.id)}
              >
                <Trash2 size={14} />
                Excluir
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* EDIT MODAL */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setConflictError(""); }}
        title="Editar Evento"
        className="max-w-xl"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          {conflictError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{conflictError}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input label="Título" value={form.title} onChange={(e) => f("title", e.target.value)} required />
            </div>
            <Input label="Data *" type="date" value={form.date} onChange={(e) => f("date", e.target.value)} required />
            <Select label="Tipo" value={form.type} onChange={(e) => f("type", e.target.value)}>
              <option value="casamento">Casamento</option>
              <option value="aniversario">Aniversário</option>
              <option value="corporativo">Corporativo</option>
              <option value="outro">Outro</option>
            </Select>
            <Input label="Horário início" type="time" value={form.timeStart} onChange={(e) => f("timeStart", e.target.value)} />
            <Input label="Horário fim" type="time" value={form.timeEnd} onChange={(e) => f("timeEnd", e.target.value)} />
            <Input label="Nome do cliente" value={form.clientName} onChange={(e) => f("clientName", e.target.value)} required />
            <Input label="Telefone" value={form.clientPhone} onChange={(e) => f("clientPhone", e.target.value)} />
            <Input label="Email" type="email" value={form.clientEmail} onChange={(e) => f("clientEmail", e.target.value)} />
            <CurrencyInput label="Valor" value={form.value} onChange={(v) => f("value", v)} />
            <Input label="Convidados" type="number" value={form.guestCount} onChange={(e) => f("guestCount", e.target.value)} min="0" />
            <Select label="Status" value={form.status} onChange={(e) => f("status", e.target.value)} className="col-span-2">
              <option value="confirmado">Confirmado</option>
              <option value="tentativo">Tentativo</option>
              <option value="cancelado">Cancelado</option>
            </Select>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-sm font-medium text-[#6b5d47]">Observações</label>
              <textarea
                value={form.notes}
                onChange={(e) => f("notes", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#d4cdbe] text-[#2a2419] placeholder-[#9b8b73] text-sm focus:outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#d4a017]/15 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : "Salvar alterações"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
