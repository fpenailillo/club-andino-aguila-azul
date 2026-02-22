"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Plus, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type EstadoSocio = "ACTIVO" | "HONORARIO" | "CONGELADO" | "COOPERADOR" | "RENUNCIADO" | "ELIMINADO" | "FALLECIDO";

interface Categoria {
  id: number;
  nombre: string;
  porcentajeCuota: string;
}

interface Socio {
  id: number;
  nombre: string;
  apPaterno?: string;
  apMaterno?: string;
  nombreCompleto: string;
  email?: string;
  telefono?: string;
  rut?: string;
  estado: EstadoSocio;
  fechaIngreso: string;
  categoria?: Categoria;
}

const ESTADO_LABELS: Record<EstadoSocio, string> = {
  ACTIVO: "Activo",
  HONORARIO: "Honorario",
  CONGELADO: "Congelado",
  COOPERADOR: "Cooperador",
  RENUNCIADO: "Renunciado",
  ELIMINADO: "Eliminado",
  FALLECIDO: "Fallecido",
};

const ESTADO_COLORES: Record<EstadoSocio, "success" | "warning" | "destructive" | "secondary"> = {
  ACTIVO: "success",
  HONORARIO: "secondary",
  CONGELADO: "warning",
  COOPERADOR: "secondary",
  RENUNCIADO: "secondary",
  ELIMINADO: "destructive",
  FALLECIDO: "secondary",
};

const FORM_INICIAL = {
  nombre: "",
  apPaterno: "",
  apMaterno: "",
  email: "",
  telefono: "",
  rut: "",
  direccion: "",
  fechaNacimiento: "",
  acta: "",
  estado: "ACTIVO" as EstadoSocio,
  categoriaId: "",
};

export default function SociosPage() {
  const { toast } = useToast();
  const [socios, setSocios] = useState<Socio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [cargando, setCargando] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const cargarSocios = useCallback(async (paginaActual: number, busquedaActual: string, estadoActual: string) => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ pagina: paginaActual.toString(), porPagina: "20" });
      if (busquedaActual) params.set("busqueda", busquedaActual);
      if (estadoActual) params.set("estado", estadoActual);
      const res = await fetch(`/api/socios?${params}`);
      const data = await res.json();
      setSocios(data.socios);
      setTotal(data.total);
      setTotalPaginas(data.totalPaginas);
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los socios", variant: "destructive" });
    } finally {
      setCargando(false);
    }
  }, [toast]);

  useEffect(() => {
    cargarSocios(pagina, busqueda, filtroEstado);
  }, [pagina, filtroEstado]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch("/api/categorias")
      .then((r) => r.json())
      .then(setCategorias)
      .catch(() => {});
  }, []);

  const handleBusqueda = (valor: string) => {
    setBusqueda(valor);
    setPagina(1);
    if (debounceTimer) clearTimeout(debounceTimer);
    const t = setTimeout(() => cargarSocios(1, valor, filtroEstado), 400);
    setDebounceTimer(t);
  };

  const handleFiltroEstado = (valor: string) => {
    setFiltroEstado(valor === "TODOS" ? "" : valor);
    setPagina(1);
  };

  const handleCrearSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const body = {
        ...form,
        categoriaId: form.categoriaId ? parseInt(form.categoriaId) : undefined,
        fechaNacimiento: form.fechaNacimiento || undefined,
      };
      const res = await fetch("/api/socios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: "Socio creado", description: `${data.nombreCompleto} agregado exitosamente` });
      setDialogOpen(false);
      setForm(FORM_INICIAL);
      cargarSocios(1, busqueda, filtroEstado);
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

  const f = (field: keyof typeof FORM_INICIAL, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
            <Users className="h-5 w-5 text-purple-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Socios</h1>
            <p className="text-muted-foreground text-sm">{total} socios registrados</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Nuevo Socio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Socio</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCrearSocio} className="space-y-4">
              {/* Nombre */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input id="nombre" value={form.nombre} onChange={(e) => f("nombre", e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="apPaterno">Ap. Paterno</Label>
                  <Input id="apPaterno" value={form.apPaterno} onChange={(e) => f("apPaterno", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="apMaterno">Ap. Materno</Label>
                  <Input id="apMaterno" value={form.apMaterno} onChange={(e) => f("apMaterno", e.target.value)} />
                </div>
              </div>

              {/* Contacto */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => f("email", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input id="telefono" value={form.telefono} placeholder="+56 9 ..." onChange={(e) => f("telefono", e.target.value)} />
                </div>
              </div>

              {/* Identificación */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rut">RUT</Label>
                  <Input id="rut" value={form.rut} placeholder="12.345.678-9" onChange={(e) => f("rut", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="acta">N° Acta Ingreso</Label>
                  <Input id="acta" value={form.acta} placeholder="Ej: 2023-047" onChange={(e) => f("acta", e.target.value)} />
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-1.5">
                <Label htmlFor="direccion">Dirección</Label>
                <Input id="direccion" value={form.direccion} onChange={(e) => f("direccion", e.target.value)} />
              </div>

              {/* Fechas + Categoría + Estado */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                  <Input id="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={(e) => f("fechaNacimiento", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Categoría</Label>
                  <Select value={form.categoriaId} onValueChange={(v) => f("categoriaId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.nombre} ({Number(c.porcentajeCuota)}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={(v) => f("estado", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(ESTADO_LABELS) as [EstadoSocio, string][]).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={guardando}>
                  {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
                  Guardar socio
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, RUT o email..."
            value={busqueda}
            onChange={(e) => handleBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroEstado || "TODOS"} onValueChange={handleFiltroEstado}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos los estados</SelectItem>
            {(Object.entries(ESTADO_LABELS) as [EstadoSocio, string][]).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">RUT</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contacto</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoría</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </td>
              </tr>
            ) : socios.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No se encontraron socios.
                </td>
              </tr>
            ) : (
              socios.map((socio) => (
                <tr key={socio.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{socio.nombreCompleto}</p>
                    {socio.email && (
                      <p className="text-xs text-muted-foreground">{socio.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{socio.rut ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{socio.telefono ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">
                    {socio.categoria?.nombre ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={ESTADO_COLORES[socio.estado]}>
                      {ESTADO_LABELS[socio.estado]}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(pagina - 1) * 20 + 1}–{Math.min(pagina * 20, total)} de {total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center text-sm px-2">{pagina} / {totalPaginas}</span>
            <Button variant="outline" size="sm" onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina >= totalPaginas}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
