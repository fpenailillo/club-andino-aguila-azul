"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Settings, Plus, Pencil, ToggleLeft, ToggleRight } from "lucide-react";

type Concepto = {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  activo: boolean;
};

type Centro = {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
};

type Categoria = {
  id: number;
  nombre: string;
  porcentajeCuota: number;
  activo: boolean;
};

type Tab = "conceptos" | "centros" | "categorias";

const TABS: { id: Tab; label: string }[] = [
  { id: "conceptos", label: "Conceptos" },
  { id: "centros", label: "Centros de Costo" },
  { id: "categorias", label: "Categorías de Socios" },
];

const TIPO_LABELS: Record<string, string> = {
  INGRESO: "Ingreso",
  EGRESO: "Egreso",
  CARGO: "Cargo",
  ABONO: "Abono",
};

const TIPO_COLORS: Record<string, string> = {
  INGRESO: "bg-green-100 text-green-700",
  EGRESO: "bg-red-100 text-red-700",
  CARGO: "bg-orange-100 text-orange-700",
  ABONO: "bg-blue-100 text-blue-700",
};

export default function ConfiguracionPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("conceptos");
  const [data, setData] = useState<(Concepto | Centro | Categoria)[]>([]);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string | number | boolean | null>>({});

  useEffect(() => {
    cargar();
  }, [activeTab]);

  async function cargar() {
    setLoading(true);
    setCreando(false);
    setEditandoId(null);
    const res = await fetch(`/api/admin/configuracion?tipo=${activeTab}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  function iniciarCrear() {
    setEditandoId(null);
    if (activeTab === "conceptos") setForm({ nombre: "", tipo: "INGRESO", descripcion: "" });
    else if (activeTab === "centros") setForm({ nombre: "", descripcion: "" });
    else setForm({ nombre: "", porcentajeCuota: 100 });
    setCreando(true);
  }

  function iniciarEditar(item: Concepto | Centro | Categoria) {
    setCreando(false);
    setEditandoId(item.id);
    setForm({ ...item });
  }

  async function guardar() {
    const method = creando ? "POST" : "PUT";
    const body = creando ? form : { id: editandoId, ...form };
    const res = await fetch(`/api/admin/configuracion?tipo=${activeTab}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast({ title: creando ? "Creado correctamente" : "Actualizado correctamente" });
      cargar();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: JSON.stringify(err.error), variant: "destructive" });
    }
  }

  async function toggleActivo(item: Concepto | Centro | Categoria) {
    const res = await fetch(`/api/admin/configuracion?tipo=${activeTab}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, activo: !item.activo }),
    });
    if (res.ok) {
      toast({ title: item.activo ? "Desactivado" : "Activado" });
      cargar();
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Configuración</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Formulario inline de creación */}
      {!creando && (
        <button
          onClick={iniciarCrear}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted"
        >
          <Plus className="h-4 w-4" />
          Agregar {activeTab === "conceptos" ? "concepto" : activeTab === "centros" ? "centro" : "categoría"}
        </button>
      )}

      {creando && (
        <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
          <p className="text-sm font-medium">Nuevo registro</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Nombre</label>
              <input
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                value={form.nombre as string}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            {activeTab === "conceptos" && (
              <div>
                <label className="text-xs text-muted-foreground">Tipo</label>
                <select
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  value={form.tipo as string}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                >
                  {Object.entries(TIPO_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            )}
            {activeTab === "categorias" && (
              <div>
                <label className="text-xs text-muted-foreground">Porcentaje cuota (%)</label>
                <input
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  type="number"
                  min={0}
                  max={100}
                  value={form.porcentajeCuota as number}
                  onChange={(e) => setForm({ ...form, porcentajeCuota: parseFloat(e.target.value) })}
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={guardar}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Guardar
            </button>
            <button
              onClick={() => setCreando(false)}
              className="rounded-lg border px-4 py-1.5 text-sm hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nombre</th>
                {activeTab === "conceptos" && (
                  <th className="text-left px-4 py-3 font-medium">Tipo</th>
                )}
                {activeTab === "categorias" && (
                  <th className="text-left px-4 py-3 font-medium">Cuota (%)</th>
                )}
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-right px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((item) => {
                const concepto = item as Concepto;
                const categoria = item as Categoria;
                const isEditing = editandoId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          className="w-full rounded-md border px-2 py-1 text-sm"
                          value={form.nombre as string}
                          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        />
                      ) : (
                        <span className="font-medium">{item.nombre}</span>
                      )}
                    </td>
                    {activeTab === "conceptos" && (
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${TIPO_COLORS[concepto.tipo]}`}>
                          {TIPO_LABELS[concepto.tipo]}
                        </span>
                      </td>
                    )}
                    {activeTab === "categorias" && (
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            className="w-24 rounded-md border px-2 py-1 text-sm"
                            type="number"
                            value={form.porcentajeCuota as number}
                            onChange={(e) => setForm({ ...form, porcentajeCuota: parseFloat(e.target.value) })}
                          />
                        ) : (
                          `${Number(categoria.porcentajeCuota)}%`
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${item.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {item.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={guardar}
                              className="rounded px-3 py-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditandoId(null)}
                              className="rounded px-3 py-1 text-xs border hover:bg-muted"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => iniciarEditar(item)}
                              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => toggleActivo(item)}
                              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                              title={item.activo ? "Desactivar" : "Activar"}
                            >
                              {item.activo
                                ? <ToggleRight className="h-4 w-4 text-green-600" />
                                : <ToggleLeft className="h-4 w-4" />
                              }
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">Sin registros.</div>
          )}
        </div>
      )}
    </div>
  );
}
