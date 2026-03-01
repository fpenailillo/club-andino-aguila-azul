"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Reserva = {
  id: number;
  fechaDesde: string;
  fechaHasta: string;
  nPersonas: number;
  comentario: string | null;
  estado: "PENDIENTE" | "APROBADA" | "RECHAZADA" | "CANCELADA";
  motivoRechazo: string | null;
};

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  PENDIENTE: { label: "Pendiente revisión", color: "bg-yellow-100 text-yellow-700" },
  APROBADA: { label: "Aprobada", color: "bg-green-100 text-green-700" },
  RECHAZADA: { label: "Rechazada", color: "bg-red-100 text-red-700" },
  CANCELADA: { label: "Cancelada", color: "bg-gray-100 text-gray-500" },
};

export default function PortalReservasPage() {
  const { toast } = useToast();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    fechaDesde: "",
    fechaHasta: "",
    nPersonas: 1,
    comentario: "",
  });

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setLoading(true);
    const res = await fetch("/api/portal/reservas");
    if (res.ok) setReservas(await res.json());
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const res = await fetch("/api/portal/reservas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        fechaDesde: new Date(form.fechaDesde).toISOString(),
        fechaHasta: new Date(form.fechaHasta).toISOString(),
      }),
    });
    setGuardando(false);

    if (res.ok) {
      toast({ title: "Reserva solicitada. Quedará pendiente de aprobación." });
      setCreando(false);
      setForm({ fechaDesde: "", fechaHasta: "", nPersonas: 1, comentario: "" });
      cargar();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error, variant: "destructive" });
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Reservas del Refugio</h1>
        </div>
        <button
          onClick={() => setCreando(!creando)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nueva reserva
        </button>
      </div>

      {/* Formulario de nueva reserva */}
      {creando && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold">Solicitar nueva reserva</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Fecha de ingreso</label>
              <input
                type="date"
                required
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.fechaDesde}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm({ ...form, fechaDesde: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Fecha de salida</label>
              <input
                type="date"
                required
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.fechaHasta}
                min={form.fechaDesde || new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm({ ...form, fechaHasta: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Número de personas</label>
            <input
              type="number"
              min={1}
              max={20}
              required
              className="w-32 rounded-lg border px-3 py-2 text-sm"
              value={form.nPersonas}
              onChange={(e) => setForm({ ...form, nPersonas: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Comentarios (opcional)</label>
            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
              rows={2}
              placeholder="Actividad, grupo, etc."
              value={form.comentario}
              onChange={(e) => setForm({ ...form, comentario: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {guardando ? "Enviando..." : "Solicitar reserva"}
            </button>
            <button
              type="button"
              onClick={() => setCreando(false)}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de reservas */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : reservas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No tienes reservas. ¡Solicita tu primera estadía en el refugio!</div>
      ) : (
        <div className="space-y-3">
          {reservas.map((r) => {
            const estado = ESTADO_CONFIG[r.estado];
            return (
              <div key={r.id} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">
                      {new Date(r.fechaDesde).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
                      {" → "}
                      {new Date(r.fechaHasta).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p className="text-sm text-muted-foreground">{r.nPersonas} persona(s)</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${estado.color}`}>
                    {estado.label}
                  </span>
                </div>
                {r.comentario && (
                  <p className="text-sm text-muted-foreground">{r.comentario}</p>
                )}
                {r.motivoRechazo && (
                  <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-1.5">
                    Motivo de rechazo: {r.motivoRechazo}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
