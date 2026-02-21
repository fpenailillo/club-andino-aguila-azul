"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCLP, formatFecha } from "@/lib/utils";
import { labelMotivoSinSocio } from "@/lib/reglas-negocio";
import { BarChart3, Download, Loader2, Search } from "lucide-react";

interface MovimientoReporte {
  id: number;
  numeroRegistro: string;
  tipo: "INGRESO" | "EGRESO";
  fecha: string;
  monto: string | number;
  comentario: string;
  esSinSocio: boolean;
  motivoSinSocio?: string | null;
  socio?: { nombreCompleto: string } | null;
  concepto: { nombre: string };
  centro: { nombre: string };
}

interface Totales {
  ingresos: number;
  egresos: number;
  balance: number;
  cantidadIngresos: number;
  cantidadEgresos: number;
}

export default function ReportesPage() {
  const [tipo, setTipo] = useState<string>("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [movimientos, setMovimientos] = useState<MovimientoReporte[]>([]);
  const [totales, setTotales] = useState<Totales | null>(null);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [ejecutado, setEjecutado] = useState(false);

  const generarReporte = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (tipo) params.set("tipo", tipo);
      if (fechaDesde) params.set("fechaDesde", fechaDesde);
      if (fechaHasta) params.set("fechaHasta", fechaHasta);

      const res = await fetch(`/api/reportes?${params}`);
      const data = await res.json();

      setMovimientos(data.movimientos);
      setTotales(data.totales);
      setTotal(data.total);
      setEjecutado(true);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const exportarCSV = () => {
    const headers = ["N° Registro", "Fecha", "Tipo", "Socio", "Concepto", "Centro", "Monto", "Comentario"];
    const rows = movimientos.map((m) => [
      m.numeroRegistro,
      formatFecha(m.fecha),
      m.tipo,
      m.esSinSocio ? labelMotivoSinSocio(m.motivoSinSocio) : (m.socio?.nombreCompleto ?? ""),
      m.concepto.nombre,
      m.centro.nombre,
      Number(m.monto),
      m.comentario,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-contable-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
          <BarChart3 className="h-5 w-5 text-indigo-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-muted-foreground text-sm">
            Generación de reportes contables
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros del reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de movimiento</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="INGRESO">Solo Ingresos</SelectItem>
                  <SelectItem value="EGRESO">Solo Egresos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaDesde">Fecha desde</Label>
              <Input
                id="fechaDesde"
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaHasta">Fecha hasta</Label>
              <Input
                id="fechaHasta"
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button onClick={generarReporte} disabled={cargando}>
              {cargando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Generar reporte
            </Button>

            {ejecutado && movimientos.length > 0 && (
              <Button variant="outline" onClick={exportarCSV}>
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {ejecutado && (
        <>
          {/* Totales */}
          {totales && (
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <p className="text-xs text-green-600 font-medium">Total Ingresos</p>
                  <p className="text-xl font-bold text-green-800 mt-1">{formatCLP(totales.ingresos)}</p>
                  <p className="text-xs text-green-600">{totales.cantidadIngresos} movimientos</p>
                </CardContent>
              </Card>
              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-4">
                  <p className="text-xs text-red-600 font-medium">Total Egresos</p>
                  <p className="text-xl font-bold text-red-800 mt-1">{formatCLP(totales.egresos)}</p>
                  <p className="text-xs text-red-600">{totales.cantidadEgresos} movimientos</p>
                </CardContent>
              </Card>
              <Card className={totales.balance >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}>
                <CardContent className="pt-4">
                  <p className={`text-xs font-medium ${totales.balance >= 0 ? "text-blue-600" : "text-orange-600"}`}>Balance</p>
                  <p className={`text-xl font-bold mt-1 ${totales.balance >= 0 ? "text-blue-800" : "text-orange-800"}`}>
                    {formatCLP(totales.balance)}
                  </p>
                  <p className={`text-xs ${totales.balance >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                    {total} mov. total
                  </p>
                </CardContent>
              </Card>
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
                  {movimientos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No hay movimientos para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    movimientos.map((mov) => (
                      <tr key={mov.id} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs">{mov.numeroRegistro}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatFecha(mov.fecha)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={mov.tipo === "INGRESO" ? "success" : "destructive"}>
                            {mov.tipo}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {mov.esSinSocio ? (
                            <span className="text-muted-foreground text-xs italic">
                              {labelMotivoSinSocio(mov.motivoSinSocio)}
                            </span>
                          ) : (
                            mov.socio?.nombreCompleto ?? "—"
                          )}
                        </td>
                        <td className="px-4 py-3">{mov.concepto.nombre}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{mov.centro.nombre}</Badge>
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${mov.tipo === "INGRESO" ? "text-green-700" : "text-red-700"}`}>
                          {mov.tipo === "EGRESO" ? "-" : ""}{formatCLP(Number(mov.monto))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
