"use client";

import { useState, useEffect, useCallback } from "react";
import { ScrollText, Search } from "lucide-react";

type AuditLog = {
  id: number;
  accion: string;
  entidad: string;
  entidadId: number | null;
  detalle: string | null;
  usuarioId: number | null;
  usuarioNombre: string;
  ip: string | null;
  createdAt: string;
};

const ACCION_COLORS: Record<string, string> = {
  CREAR: "bg-green-100 text-green-700",
  EDITAR: "bg-blue-100 text-blue-700",
  ELIMINAR: "bg-red-100 text-red-700",
  APROBAR: "bg-teal-100 text-teal-700",
  RECHAZAR: "bg-orange-100 text-orange-700",
  CANCELAR: "bg-yellow-100 text-yellow-700",
  EMITIR: "bg-purple-100 text-purple-700",
  LOGIN: "bg-gray-100 text-gray-600",
  CAMBIAR: "bg-pink-100 text-pink-700",
  DESACTIVAR: "bg-red-100 text-red-700",
};

function getAccionColor(accion: string): string {
  const key = Object.keys(ACCION_COLORS).find((k) => accion.startsWith(k));
  return key ? ACCION_COLORS[key] : "bg-gray-100 text-gray-600";
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [filtros, setFiltros] = useState({
    desde: "",
    hasta: "",
    accion: "",
    entidad: "",
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "50" });
    if (filtros.desde) params.set("desde", filtros.desde);
    if (filtros.hasta) params.set("hasta", filtros.hasta);
    if (filtros.accion) params.set("accion", filtros.accion);
    if (filtros.entidad) params.set("entidad", filtros.entidad);

    const res = await fetch(`/api/admin/auditoria?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page, filtros]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function aplicarFiltros(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    cargar();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <ScrollText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Auditoría del sistema</h1>
        <span className="ml-auto text-sm text-muted-foreground">{total} registros</span>
      </div>

      {/* Filtros */}
      <form onSubmit={aplicarFiltros} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Desde</label>
          <input
            type="date"
            className="w-full rounded-md border px-3 py-1.5 text-sm"
            value={filtros.desde}
            onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Hasta</label>
          <input
            type="date"
            className="w-full rounded-md border px-3 py-1.5 text-sm"
            value={filtros.hasta}
            onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Acción</label>
          <input
            className="w-full rounded-md border px-3 py-1.5 text-sm"
            placeholder="CREAR_MOVIMIENTO..."
            value={filtros.accion}
            onChange={(e) => setFiltros({ ...filtros, accion: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Entidad</label>
          <input
            className="w-full rounded-md border px-3 py-1.5 text-sm"
            placeholder="Movimiento, Socio..."
            value={filtros.entidad}
            onChange={(e) => setFiltros({ ...filtros, entidad: e.target.value })}
          />
        </div>
        <div className="col-span-2 md:col-span-4 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Search className="h-4 w-4" />
            Filtrar
          </button>
        </div>
      </form>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : (
        <>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium">Acción</th>
                  <th className="text-left px-4 py-3 font-medium">Entidad</th>
                  <th className="text-left px-4 py-3 font-medium">Usuario</th>
                  <th className="text-left px-4 py-3 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("es-CL", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getAccionColor(log.accion)}`}>
                        {log.accion.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.entidad}
                      {log.entidadId ? ` #${log.entidadId}` : ""}
                    </td>
                    <td className="px-4 py-3">{log.usuarioNombre}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono max-w-xs truncate">
                      {log.detalle ? (() => {
                        try {
                          const parsed = JSON.parse(log.detalle);
                          return Object.entries(parsed)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ");
                        } catch {
                          return log.detalle;
                        }
                      })() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                No se encontraron registros con los filtros aplicados.
              </div>
            )}
          </div>

          {/* Paginación */}
          {total > 50 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Mostrando {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} de {total}</span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded border px-3 py-1 disabled:opacity-40 hover:bg-muted"
                >
                  Anterior
                </button>
                <button
                  disabled={page * 50 >= total}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border px-3 py-1 disabled:opacity-40 hover:bg-muted"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
