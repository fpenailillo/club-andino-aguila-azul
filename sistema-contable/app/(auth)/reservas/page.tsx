"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarCheck,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type EstadoReserva = "PENDIENTE" | "APROBADA" | "RECHAZADA" | "CANCELADA";

interface Reserva {
  id: number;
  fechaDesde: string;
  fechaHasta: string;
  nPersonas: number;
  comentario?: string;
  estado: EstadoReserva;
  motivoRechazo?: string;
  socio: { nombreCompleto: string; email?: string; telefono?: string };
}

interface Socio {
  id: number;
  nombreCompleto: string;
}

const ESTADO_COLORES: Record<EstadoReserva, "success" | "warning" | "destructive" | "secondary"> = {
  PENDIENTE: "warning",
  APROBADA: "success",
  RECHAZADA: "destructive",
  CANCELADA: "secondary",
};

const ESTADO_ICONOS: Record<EstadoReserva, React.ReactNode> = {
  PENDIENTE: <Clock className="h-3 w-3" />,
  APROBADA: <CheckCircle className="h-3 w-3" />,
  RECHAZADA: <XCircle className="h-3 w-3" />,
  CANCELADA: <XCircle className="h-3 w-3" />,
};

const FORM_INICIAL = {
  socioId: "",
  fechaDesde: "",
  fechaHasta: "",
  nPersonas: "1",
  comentario: "",
};

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ReservasPage() {
  const { toast } = useToast();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>("PENDIENTE");
  const [form, setForm] = useState(FORM_INICIAL);
  const [busquedaSocio, setBusquedaSocio] = useState("");
  const [debounce, setDebounce] = useState<NodeJS.Timeout | null>(null);

  const cargarReservas = useCallback(async (estado: string) => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ porPagina: "50" });
      if (estado) params.set("estado", estado);
      const res = await fetch(`/api/reservas?${params}`);
      const data = await res.json();
      setReservas(data.reservas);
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar las reservas", variant: "destructive" });
    } finally {
      setCargando(false);
    }
  }, [toast]);

  useEffect(() => { cargarReservas(filtroEstado); }, [filtroEstado]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBusquedaSocio = (q: string) => {
    setBusquedaSocio(q);
    if (debounce) clearTimeout(debounce);
    if (q.length < 2) { setSocios([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/socios?modo=search&busqueda=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSocios(data);
    }, 350);
    setDebounce(t);
  };

  const handleCrearReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const body = {
        socioId: parseInt(form.socioId),
        fechaDesde: form.fechaDesde,
        fechaHasta: form.fechaHasta,
        nPersonas: parseInt(form.nPersonas),
        comentario: form.comentario || undefined,
      };
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: "Reserva creada", description: "Solicitud enviada, pendiente de aprobación" });
      setDialogOpen(false);
      setForm(FORM_INICIAL);
      setBusquedaSocio("");
      setSocios([]);
      cargarReservas(filtroEstado);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  const aprobarReserva = async (id: number) => {
    try {
      const res = await fetch(`/api/reservas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "aprobar" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "Reserva aprobada" });
      cargarReservas(filtroEstado);
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "", variant: "destructive" });
    }
  };

  const rechazarReserva = async (id: number) => {
    const motivo = window.prompt("Motivo de rechazo:");
    if (!motivo) return;
    try {
      const res = await fetch(`/api/reservas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "rechazar", motivoRechazo: motivo }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "Reserva rechazada" });
      cargarReservas(filtroEstado);
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "", variant: "destructive" });
    }
  };

  const f = (field: keyof typeof FORM_INICIAL, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100">
            <CalendarCheck className="h-5 w-5 text-teal-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Reservas del Refugio</h1>
            <p className="text-muted-foreground text-sm">Solicitudes de uso del refugio en Farellones</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Nueva Solicitud
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Solicitar uso del Refugio</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCrearReserva} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Socio</Label>
                <Input
                  placeholder="Buscar socio..."
                  value={busquedaSocio}
                  onChange={(e) => handleBusquedaSocio(e.target.value)}
                />
                {socios.length > 0 && (
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {socios.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => {
                          f("socioId", s.id.toString());
                          setBusquedaSocio(s.nombreCompleto);
                          setSocios([]);
                        }}
                      >
                        {s.nombreCompleto}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fechaDesde">Fecha entrada</Label>
                  <Input id="fechaDesde" type="date" value={form.fechaDesde} onChange={(e) => f("fechaDesde", e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fechaHasta">Fecha salida</Label>
                  <Input id="fechaHasta" type="date" value={form.fechaHasta} onChange={(e) => f("fechaHasta", e.target.value)} required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nPersonas">N° de personas</Label>
                <Input id="nPersonas" type="number" min="1" max="30" value={form.nPersonas} onChange={(e) => f("nPersonas", e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="comentario">Comentario</Label>
                <Input id="comentario" value={form.comentario} placeholder="Actividad, grupo, etc." onChange={(e) => f("comentario", e.target.value)} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={guardando || !form.socioId}>
                  {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enviar solicitud
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtro estado */}
      <Select value={filtroEstado} onValueChange={setFiltroEstado}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PENDIENTE">Pendientes</SelectItem>
          <SelectItem value="APROBADA">Aprobadas</SelectItem>
          <SelectItem value="RECHAZADA">Rechazadas</SelectItem>
          <SelectItem value="CANCELADA">Canceladas</SelectItem>
        </SelectContent>
      </Select>

      {/* Tabla */}
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Socio</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fechas</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Personas</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
              {filtroEstado === "PENDIENTE" && (
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td>
              </tr>
            ) : reservas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No hay reservas {filtroEstado.toLowerCase()}.
                </td>
              </tr>
            ) : (
              reservas.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.socio.nombreCompleto}</p>
                    {r.comentario && (
                      <p className="text-xs text-muted-foreground">{r.comentario}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatFecha(r.fechaDesde)} → {formatFecha(r.fechaHasta)}
                  </td>
                  <td className="px-4 py-3 text-center">{r.nPersonas}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ESTADO_COLORES[r.estado]} className="flex items-center gap-1 w-fit">
                      {ESTADO_ICONOS[r.estado]}
                      {r.estado}
                    </Badge>
                    {r.motivoRechazo && (
                      <p className="text-xs text-muted-foreground mt-1">{r.motivoRechazo}</p>
                    )}
                  </td>
                  {filtroEstado === "PENDIENTE" && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => aprobarReserva(r.id)}>
                          <CheckCircle className="h-3.5 w-3.5" />
                          Aprobar
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => rechazarReserva(r.id)}>
                          <XCircle className="h-3.5 w-3.5" />
                          Rechazar
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
