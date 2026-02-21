"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { debeAsignarSocio, formatearMonto } from "@/lib/reglas-negocio";
import { Loader2, User, AlertCircle } from "lucide-react";

// ============================================================================
// TIPOS
// ============================================================================

interface Concepto {
  id: number;
  nombre: string;
  tipo: string;
}

interface Centro {
  id: number;
  nombre: string;
}

interface Socio {
  id: number;
  nombreCompleto: string;
  estado: string;
  score?: number;
  esMatchExacto?: boolean;
}

// ============================================================================
// SCHEMA DE VALIDACIÓN
// ============================================================================

const formSchema = z.object({
  socioId: z.number().nullable().optional(),
  conceptoId: z.number().int().positive("Selecciona un concepto"),
  centroId: z.number().int().positive("Selecciona un centro"),
  comentario: z.string().min(1, "El comentario es requerido").max(500),
  monto: z.string().min(1, "El monto es requerido"),
  fecha: z.string().min(1, "La fecha es requerida"),
});

type FormValues = z.infer<typeof formSchema>;

// ============================================================================
// PROPS
// ============================================================================

interface MovimientoFormProps {
  tipo: "INGRESO" | "EGRESO";
  onSuccess?: (numeroRegistro: string) => void;
  onCancel?: () => void;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function MovimientoForm({ tipo, onSuccess, onCancel }: MovimientoFormProps) {
  const { toast } = useToast();

  const [conceptos, setConceptos] = useState<Concepto[]>([]);
  const [centros, setCentros] = useState<Centro[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [busquedaSocio, setBusquedaSocio] = useState("");
  const [buscandoSocio, setBuscandoSocio] = useState(false);
  const [socioSeleccionado, setSocioSeleccionado] = useState<Socio | null>(null);
  const [mostrarListaSocios, setMostrarListaSocios] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [conceptoActual, setConceptoActual] = useState<Concepto | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const hoy = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fecha: hoy,
      socioId: null,
    },
  });

  const comentarioWatch = watch("comentario") ?? "";

  // ============================================================================
  // CARGAR DATOS INICIALES
  // ============================================================================

  useEffect(() => {
    const cargarDatos = async () => {
      const [conceptosRes, centrosRes] = await Promise.all([
        fetch(`/api/conceptos?tipo=${tipo}`),
        fetch("/api/centros"),
      ]);
      const [conceptosData, centrosData] = await Promise.all([
        conceptosRes.json(),
        centrosRes.json(),
      ]);
      setConceptos(conceptosData);
      setCentros(centrosData);
    };
    cargarDatos();
  }, [tipo]);

  // ============================================================================
  // BÚSQUEDA DE SOCIOS CON DEBOUNCE
  // ============================================================================

  const buscarSocios = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSocios([]);
        return;
      }
      setBuscandoSocio(true);
      try {
        const res = await fetch(
          `/api/socios?modo=search&busqueda=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setSocios(data);
        setMostrarListaSocios(true);
      } catch {
        setSocios([]);
      } finally {
        setBuscandoSocio(false);
      }
    },
    []
  );

  const handleBusquedaSocioChange = (value: string) => {
    setBusquedaSocio(value);
    if (value !== socioSeleccionado?.nombreCompleto) {
      setSocioSeleccionado(null);
      setValue("socioId", null);
    }

    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => buscarSocios(value), 300);
    setDebounceTimer(timer);
  };

  const seleccionarSocio = (socio: Socio) => {
    setSocioSeleccionado(socio);
    setValue("socioId", socio.id);
    setBusquedaSocio(socio.nombreCompleto);
    setMostrarListaSocios(false);
    setSocios([]);
  };

  // ============================================================================
  // LÓGICA DE CONCEPTO → CENTRO AUTOMÁTICO
  // ============================================================================

  const handleConceptoChange = (conceptoId: string) => {
    const id = parseInt(conceptoId);
    setValue("conceptoId", id);
    const concepto = conceptos.find((c) => c.id === id);
    setConceptoActual(concepto ?? null);

    // Auto-determinar centro
    if (concepto?.nombre.includes("Refugio")) {
      const centroRefugio = centros.find((c) => c.nombre === "Refugio");
      if (centroRefugio) setValue("centroId", centroRefugio.id);
    } else {
      const centroSede = centros.find((c) => c.nombre === "Sede");
      if (centroSede) setValue("centroId", centroSede.id);
    }

    // Limpiar socio si no debe asignar
    if (concepto) {
      const debeAsignar = debeAsignarSocio(concepto.nombre, comentarioWatch);
      if (!debeAsignar) {
        setSocioSeleccionado(null);
        setValue("socioId", null);
        setBusquedaSocio("");
      }
    }
  };

  // ============================================================================
  // DETERMINAR SI CAMPO SOCIO DEBE ESTAR DESHABILITADO
  // ============================================================================

  const campSocioDeshabilitado = React.useMemo(() => {
    if (!conceptoActual) return false;
    return !debeAsignarSocio(conceptoActual.nombre, comentarioWatch);
  }, [conceptoActual, comentarioWatch]);

  const labelSinSocio = React.useMemo(() => {
    if (!conceptoActual) return null;
    if (conceptoActual.nombre === "Estadia en Refugio") {
      return "Sin asignar (Refugio)";
    }
    if (
      conceptoActual.nombre === "Otros" &&
      comentarioWatch.toLowerCase().includes("osvaldo")
    ) {
      return "Sin asignar (Colecta Osvaldo)";
    }
    return null;
  }, [conceptoActual, comentarioWatch]);

  // ============================================================================
  // ENVÍO DEL FORMULARIO
  // ============================================================================

  const onSubmit = async (data: FormValues) => {
    setCargando(true);
    try {
      const montoNum = parseFloat(data.monto.replace(/\./g, "").replace(",", "."));

      const payload = {
        tipo,
        socioId: data.socioId ?? null,
        conceptoId: data.conceptoId,
        centroId: data.centroId,
        comentario: data.comentario,
        monto: montoNum,
        fecha: new Date(data.fecha).toISOString(),
      };

      const res = await fetch("/api/movimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Error al crear movimiento");
      }

      toast({
        title: "Movimiento registrado",
        description: `N° Registro: ${result.numeroRegistro}`,
      });

      reset({ fecha: hoy, socioId: null });
      setSocioSeleccionado(null);
      setBusquedaSocio("");
      setConceptoActual(null);

      if (onSuccess) onSuccess(result.numeroRegistro);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setCargando(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Concepto */}
      <div className="space-y-2">
        <Label htmlFor="conceptoId">Concepto *</Label>
        <Select onValueChange={handleConceptoChange}>
          <SelectTrigger id="conceptoId">
            <SelectValue placeholder="Seleccionar concepto..." />
          </SelectTrigger>
          <SelectContent>
            {conceptos.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.conceptoId && (
          <p className="text-xs text-red-600">{errors.conceptoId.message}</p>
        )}
      </div>

      {/* Socio */}
      <div className="space-y-2">
        <Label htmlFor="socioSearch">
          Socio
          {!campSocioDeshabilitado && tipo === "INGRESO" && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </Label>
        {campSocioDeshabilitado ? (
          <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-muted text-muted-foreground text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{labelSinSocio ?? "Sin asignar"}</span>
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                id="socioSearch"
                type="text"
                value={busquedaSocio}
                onChange={(e) => handleBusquedaSocioChange(e.target.value)}
                onFocus={() => busquedaSocio.length >= 2 && setMostrarListaSocios(true)}
                placeholder="Buscar socio por nombre..."
                className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              {buscandoSocio && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {socioSeleccionado && (
              <Badge variant="success" className="mt-1">
                {socioSeleccionado.nombreCompleto}
              </Badge>
            )}
            {mostrarListaSocios && socios.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                {socios.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent cursor-pointer text-left"
                    onMouseDown={() => seleccionarSocio(s)}
                  >
                    <span>{s.nombreCompleto}</span>
                    <div className="flex items-center gap-2">
                      {s.score && (
                        <span className="text-xs text-muted-foreground">
                          {Math.round(s.score * 100)}%
                        </span>
                      )}
                      <Badge
                        variant={s.estado === "ACTIVO" ? "success" : "warning"}
                        className="text-xs"
                      >
                        {s.estado}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comentario */}
      <div className="space-y-2">
        <Label htmlFor="comentario">Comentario *</Label>
        <textarea
          id="comentario"
          {...register("comentario")}
          rows={2}
          placeholder="Descripción del movimiento..."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
        />
        {errors.comentario && (
          <p className="text-xs text-red-600">{errors.comentario.message}</p>
        )}
      </div>

      {/* Monto y Fecha en grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monto">Monto (CLP) *</Label>
          <Input
            id="monto"
            type="number"
            step="1"
            min="1"
            placeholder="0"
            {...register("monto")}
          />
          {watch("monto") && !isNaN(parseFloat(watch("monto"))) && (
            <p className="text-xs text-muted-foreground">
              {formatearMonto(parseFloat(watch("monto")))}
            </p>
          )}
          {errors.monto && (
            <p className="text-xs text-red-600">{errors.monto.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fecha">Fecha *</Label>
          <Input
            id="fecha"
            type="date"
            max={hoy}
            {...register("fecha")}
          />
          {errors.fecha && (
            <p className="text-xs text-red-600">{errors.fecha.message}</p>
          )}
        </div>
      </div>

      {/* Centro */}
      <div className="space-y-2">
        <Label htmlFor="centroId">Centro de Costo *</Label>
        <Select
          onValueChange={(v) => setValue("centroId", parseInt(v))}
          value={watch("centroId")?.toString()}
        >
          <SelectTrigger id="centroId">
            <SelectValue placeholder="Seleccionar centro..." />
          </SelectTrigger>
          <SelectContent>
            {centros.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.centroId && (
          <p className="text-xs text-red-600">{errors.centroId.message}</p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={cargando}
          className={tipo === "INGRESO" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
        >
          {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
          Registrar {tipo === "INGRESO" ? "Ingreso" : "Egreso"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
