"use client";

import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";

type Movimiento = {
  id: number;
  numeroRegistro: string;
  tipo: "CARGO" | "ABONO";
  concepto: string;
  monto: number;
  fecha: string;
  comentario: string;
};

type Resumen = {
  totalCargos: number;
  totalAbonos: number;
  saldo: number;
};

function formatMonto(monto: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(monto);
}

export default function EstadoCuentaPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/estado-cuenta")
      .then((r) => r.json())
      .then((data) => {
        setMovimientos(data.movimientos ?? []);
        setResumen(data.resumen ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Receipt className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Estado de Cuenta</h1>
      </div>

      {resumen && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Cargos</p>
            <p className="font-semibold text-red-600">{formatMonto(resumen.totalCargos)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Abonos</p>
            <p className="font-semibold text-green-600">{formatMonto(resumen.totalAbonos)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`font-bold text-lg ${resumen.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatMonto(resumen.saldo)}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 font-medium">Concepto</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-right px-4 py-3 font-medium">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {movimientos.map((m) => (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(m.fecha).toLocaleDateString("es-CL")}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{m.concepto}</p>
                    {m.comentario && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">{m.comentario}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      m.tipo === "CARGO"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {m.tipo === "CARGO" ? "Cargo" : "Abono"}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${
                    m.tipo === "CARGO" ? "text-red-600" : "text-green-600"
                  }`}>
                    {m.tipo === "CARGO" ? "-" : "+"}{formatMonto(m.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {movimientos.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">No hay movimientos registrados.</div>
          )}
        </div>
      )}
    </div>
  );
}
