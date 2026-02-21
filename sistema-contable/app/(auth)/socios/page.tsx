"use client";

import React, { useEffect, useState } from "react";
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

interface Socio {
  id: number;
  nombre: string;
  apellido?: string;
  nombreCompleto: string;
  email?: string;
  telefono?: string;
  rut?: string;
  estado: "ACTIVO" | "INACTIVO" | "SUSPENDIDO" | "MOROSO";
  fechaIngreso: string;
}

const ESTADO_COLORES: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  ACTIVO: "success",
  INACTIVO: "secondary",
  SUSPENDIDO: "warning",
  MOROSO: "destructive",
};

export default function SociosPage() {
  const { toast } = useToast();
  const [socios, setSocios] = useState<Socio[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const [nuevoSocio, setNuevoSocio] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    rut: "",
    estado: "ACTIVO",
  });

  const cargarSocios = async (paginaActual: number, busquedaActual: string) => {
    setCargando(true);
    try {
      const params = new URLSearchParams({
        pagina: paginaActual.toString(),
        porPagina: "20",
      });
      if (busquedaActual) params.set("busqueda", busquedaActual);

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
  };

  useEffect(() => {
    cargarSocios(pagina, busqueda);
  }, [pagina]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBusqueda = (valor: string) => {
    setBusqueda(valor);
    setPagina(1);
    if (debounceTimer) clearTimeout(debounceTimer);
    const t = setTimeout(() => cargarSocios(1, valor), 400);
    setDebounceTimer(t);
  };

  const handleCrearSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const res = await fetch("/api/socios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoSocio),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: "Socio creado", description: `${data.nombreCompleto} agregado exitosamente` });
      setDialogOpen(false);
      setNuevoSocio({ nombre: "", apellido: "", email: "", telefono: "", rut: "", estado: "ACTIVO" });
      cargarSocios(1, busqueda);
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
            <p className="text-muted-foreground text-sm">
              {total} socios registrados
            </p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Nuevo Socio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Agregar Socio</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCrearSocio} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={nuevoSocio.nombre}
                    onChange={(e) => setNuevoSocio({ ...nuevoSocio, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    value={nuevoSocio.apellido}
                    onChange={(e) => setNuevoSocio({ ...nuevoSocio, apellido: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={nuevoSocio.email}
                  onChange={(e) => setNuevoSocio({ ...nuevoSocio, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rut">RUT</Label>
                  <Input
                    id="rut"
                    value={nuevoSocio.rut}
                    placeholder="12.345.678-9"
                    onChange={(e) => setNuevoSocio({ ...nuevoSocio, rut: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={nuevoSocio.telefono}
                    placeholder="+56 9 ..."
                    onChange={(e) => setNuevoSocio({ ...nuevoSocio, telefono: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={nuevoSocio.estado}
                  onValueChange={(v) => setNuevoSocio({ ...nuevoSocio, estado: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVO">Activo</SelectItem>
                    <SelectItem value="INACTIVO">Inactivo</SelectItem>
                    <SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
                    <SelectItem value="MOROSO">Moroso</SelectItem>
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

      {/* Búsqueda */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar socio..."
          value={busqueda}
          onChange={(e) => handleBusqueda(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabla */}
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">RUT</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Teléfono</th>
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
                  <td className="px-4 py-3 font-medium">{socio.nombreCompleto}</td>
                  <td className="px-4 py-3 text-muted-foreground">{socio.email ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{socio.rut ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{socio.telefono ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ESTADO_COLORES[socio.estado]}>
                      {socio.estado}
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
