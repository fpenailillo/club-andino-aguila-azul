"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCLP, formatFecha } from "@/lib/utils";
import { labelMotivoSinSocio } from "@/lib/reglas-negocio";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

// ============================================================================
// TIPOS
// ============================================================================

interface Movimiento {
  id: number;
  numeroRegistro: string;
  tipo: "INGRESO" | "EGRESO";
  fecha: string;
  monto: string | number;
  comentario: string;
  esSinSocio: boolean;
  motivoSinSocio?: string | null;
  socio?: { id: number; nombreCompleto: string; estado: string } | null;
  concepto: { id: number; nombre: string };
  centro: { id: number; nombre: string };
}

interface Totales {
  ingresos: number;
  egresos: number;
  balance: number;
  cantidadIngresos: number;
  cantidadEgresos: number;
}

interface RespuestaMovimientos {
  movimientos: Movimiento[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
  totales: Totales;
}

interface FiltrosTabla {
  tipo?: "INGRESO" | "EGRESO";
  conceptoId?: number;
  centroId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  socioId?: number;
}

// ============================================================================
// PROPS
// ============================================================================

interface TablaMovimientosProps {
  filtros?: FiltrosTabla;
  onMovimientoClick?: (movimiento: Movimiento) => void;
  refreshKey?: number;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function TablaMovimientos({
  filtros = {},
  onMovimientoClick,
  refreshKey,
}: TablaMovimientosProps) {
  const [data, setData] = useState<RespuestaMovimientos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const cargarMovimientos = useCallback(
    async (paginaActual: number, busquedaActual: string) => {
      setCargando(true);
      try {
        const params = new URLSearchParams({
          pagina: paginaActual.toString(),
          porPagina: "20",
          ordenPor: "fecha",
          orden: "desc",
        });

        if (filtros.tipo) params.set("tipo", filtros.tipo);
        if (filtros.conceptoId) params.set("conceptoId", filtros.conceptoId.toString());
        if (filtros.centroId) params.set("centroId", filtros.centroId.toString());
        if (filtros.fechaDesde) params.set("fechaDesde", filtros.fechaDesde);
        if (filtros.fechaHasta) params.set("fechaHasta", filtros.fechaHasta);
        if (filtros.socioId) params.set("socioId", filtros.socioId.toString());
        if (busquedaActual) params.set("busqueda", busquedaActual);

        const res = await fetch(`/api/movimientos?${params}`);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Error cargando movimientos:", error);
      } finally {
        setCargando(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      filtros.tipo,
      filtros.conceptoId,
      filtros.centroId,
      filtros.fechaDesde,
      filtros.fechaHasta,
      filtros.socioId,
    ]
  );

  useEffect(() => {
    cargarMovimientos(pagina, busqueda);
  }, [pagina, cargarMovimientos, refreshKey]);

  const handleBusqueda = (valor: string) => {
    setBusqueda(valor);
    setPagina(1);
    if (debounceTimer) clearTimeout(debounceTimer);
    const t = setTimeout(() => cargarMovimientos(1, valor), 400);
    setDebounceTimer(t);
  };

  const nombresocio = (mov: Movimiento) => {
    if (mov.esSinSocio) {
      return (
        <span className="text-muted-foreground text-xs italic">
          {labelMotivoSinSocio(mov.motivoSinSocio)}
        </span>
      );
    }
    return mov.socio?.nombreCompleto ?? (
      <span className="text-muted-foreground text-xs">—</span>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por N° registro, comentario o socio..."
            value={busqueda}
            onChange={(e) => handleBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Totales */}
      {data && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-green-50 p-3">
            <div className="flex items-center gap-2 text-green-700 text-xs font-medium mb-1">
              <TrendingUp className="h-3 w-3" />
              Total Ingresos
            </div>
            <p className="text-lg font-bold text-green-800">
              {formatCLP(data.totales.ingresos)}
            </p>
            <p className="text-xs text-green-600">{data.totales.cantidadIngresos} mov.</p>
          </div>
          <div className="rounded-lg border bg-red-50 p-3">
            <div className="flex items-center gap-2 text-red-700 text-xs font-medium mb-1">
              <TrendingDown className="h-3 w-3" />
              Total Egresos
            </div>
            <p className="text-lg font-bold text-red-800">
              {formatCLP(data.totales.egresos)}
            </p>
            <p className="text-xs text-red-600">{data.totales.cantidadEgresos} mov.</p>
          </div>
          <div className={`rounded-lg border p-3 ${data.totales.balance >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
            <div className={`flex items-center gap-2 text-xs font-medium mb-1 ${data.totales.balance >= 0 ? "text-blue-700" : "text-orange-700"}`}>
              Balance
            </div>
            <p className={`text-lg font-bold ${data.totales.balance >= 0 ? "text-blue-800" : "text-orange-800"}`}>
              {formatCLP(data.totales.balance)}
            </p>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">N° Registro</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Socio</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Concepto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Centro</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Monto</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Cargando...
                  </td>
                </tr>
              ) : !data || data.movimientos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No hay movimientos para mostrar.
                  </td>
                </tr>
              ) : (
                data.movimientos.map((mov) => (
                  <tr
                    key={mov.id}
                    className={`border-t hover:bg-muted/30 ${onMovimientoClick ? "cursor-pointer" : ""}`}
                    onClick={() => onMovimientoClick?.(mov)}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{mov.numeroRegistro}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatFecha(mov.fecha)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={mov.tipo === "INGRESO" ? "success" : "destructive"}>
                        {mov.tipo}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{nombresocio(mov)}</td>
                    <td className="px-4 py-3">{mov.concepto.nombre}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{mov.centro.nombre}</Badge>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${mov.tipo === "INGRESO" ? "text-green-700" : "text-red-700"}`}>
                      {mov.tipo === "EGRESO" ? "-" : ""}
                      {formatCLP(Number(mov.monto))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {data && data.totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(data.pagina - 1) * data.porPagina + 1}–
            {Math.min(data.pagina * data.porPagina, data.total)} de{" "}
            {data.total} registros
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center text-sm px-2">
              {pagina} / {data.totalPaginas}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagina((p) => Math.min(data.totalPaginas, p + 1))}
              disabled={pagina >= data.totalPaginas}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
