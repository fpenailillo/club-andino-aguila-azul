"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCLP, formatFecha } from "@/lib/utils";
import { labelMotivoSinSocio } from "@/lib/reglas-negocio";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Plus,
  BarChart3,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

interface DashboardData {
  estadisticasMes: {
    totalIngresos: number;
    totalEgresos: number;
    balance: number;
    cantidadIngresos: number;
    cantidadEgresos: number;
    mes: number;
    anio: number;
  };
  evolucionMensual: Array<{
    mes: string;
    ingresos: number;
    egresos: number;
  }>;
  distribucionIngresos: Array<{
    concepto: string;
    monto: number;
    cantidad: number;
  }>;
  resumenSocios: {
    total: number;
    ACTIVO: number;
    HONORARIO: number;
    CONGELADO: number;
    COOPERADOR: number;
    RENUNCIADO: number;
    ELIMINADO: number;
    FALLECIDO: number;
  };
  ultimosMovimientos: Array<{
    id: number;
    numeroRegistro: string;
    tipo: "INGRESO" | "EGRESO" | "CARGO" | "ABONO";
    fecha: string;
    monto: string | number;
    comentario: string;
    esSinSocio: boolean;
    motivoSinSocio?: string | null;
    socio?: { nombreCompleto: string } | null;
    concepto: { nombre: string };
  }>;
}

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const { estadisticasMes, evolucionMensual, distribucionIngresos, resumenSocios, ultimosMovimientos } = data;
  const mesNombre = MESES[estadisticasMes.mes - 1];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Resumen contable — {mesNombre} {estadisticasMes.anio}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/ingresos">
              <Plus className="h-4 w-4 mr-1" />
              Ingreso
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/egresos">
              <Plus className="h-4 w-4 mr-1" />
              Egreso
            </Link>
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Ingresos del mes</CardDescription>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">
              {formatCLP(estadisticasMes.totalIngresos)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {estadisticasMes.cantidadIngresos} movimientos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Egresos del mes</CardDescription>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">
              {formatCLP(estadisticasMes.totalEgresos)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {estadisticasMes.cantidadEgresos} movimientos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Balance</CardDescription>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${estadisticasMes.balance >= 0 ? "text-blue-700" : "text-orange-700"}`}>
              {formatCLP(estadisticasMes.balance)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {estadisticasMes.balance >= 0 ? "Superávit" : "Déficit"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Socios activos</CardDescription>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-700">
              {resumenSocios.ACTIVO}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              de {resumenSocios.total} totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolución mensual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingresos vs Egresos</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={evolucionMensual}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v: number) => formatCLP(v)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#16a34a"
                  strokeWidth={2}
                  name="Ingresos"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="egresos"
                  stroke="#dc2626"
                  strokeWidth={2}
                  name="Egresos"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por concepto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución de Ingresos</CardTitle>
            <CardDescription>Por concepto</CardDescription>
          </CardHeader>
          <CardContent>
            {distribucionIngresos.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart>
                    <Pie
                      data={distribucionIngresos}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="monto"
                      nameKey="concepto"
                    >
                      {distribucionIngresos.map((_, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCLP(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {distribucionIngresos.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium leading-none">{item.concepto}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCLP(item.monto)} ({item.cantidad})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                Sin datos de ingresos aún
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimos movimientos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Últimos Movimientos</CardTitle>
            <CardDescription>Los 10 más recientes</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/ingresos">
              <BarChart3 className="h-4 w-4 mr-1" />
              Ver todos
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ultimosMovimientos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay movimientos aún.
              </p>
            ) : (
              ultimosMovimientos.map((mov) => (
                <div
                  key={mov.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge
                      variant={
                        mov.tipo === "INGRESO" ? "success" :
                        mov.tipo === "EGRESO" ? "destructive" :
                        mov.tipo === "ABONO" ? "secondary" : "warning"
                      }
                      className="flex-shrink-0 text-xs"
                    >
                      {mov.tipo === "INGRESO" ? "ING" :
                       mov.tipo === "EGRESO" ? "EGR" :
                       mov.tipo === "CARGO" ? "CAR" : "ABO"}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {mov.esSinSocio
                          ? labelMotivoSinSocio(mov.motivoSinSocio)
                          : mov.socio?.nombreCompleto ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mov.concepto.nombre} · {formatFecha(mov.fecha)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-sm font-semibold flex-shrink-0 ml-2 ${
                      mov.tipo === "INGRESO" || mov.tipo === "ABONO" ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {mov.tipo === "EGRESO" || mov.tipo === "CARGO" ? "-" : ""}
                    {formatCLP(Number(mov.monto))}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
