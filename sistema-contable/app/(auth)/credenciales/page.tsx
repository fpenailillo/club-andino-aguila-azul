"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { IdCard, Search, Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Credencial {
  id: number;
  codigo: string;
  anioVigencia: number;
  activa: boolean;
  emitidaEn: string;
  socio: {
    nombreCompleto: string;
    rut?: string;
    estado: string;
  };
}

export default function CredencialesPage() {
  const { toast } = useToast();
  const [credenciales, setCredenciales] = useState<Credencial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [buscandoCodigo, setBuscandoCodigo] = useState("");
  const [resultadoVerificacion, setResultadoVerificacion] = useState<{
    valida: boolean;
    razon?: string;
    credencial?: Credencial;
  } | null>(null);
  const [verificando, setVerificando] = useState(false);

  const anioActual = new Date().getFullYear();

  const cargarCredenciales = async () => {
    setCargando(true);
    try {
      const res = await fetch(`/api/credenciales?anio=${anioActual}`);
      const data = await res.json();
      setCredenciales(data);
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar las credenciales", variant: "destructive" });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCredenciales();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const verificarCodigo = async () => {
    if (!buscandoCodigo.trim()) return;
    setVerificando(true);
    setResultadoVerificacion(null);
    try {
      const res = await fetch(`/api/credenciales?codigo=${encodeURIComponent(buscandoCodigo.trim())}`);
      const data = await res.json();
      setResultadoVerificacion(data);
    } catch {
      toast({ title: "Error", description: "Error al verificar", variant: "destructive" });
    } finally {
      setVerificando(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
          <IdCard className="h-5 w-5 text-indigo-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Credenciales</h1>
          <p className="text-muted-foreground text-sm">
            Credenciales de socio emitidas — año {anioActual}
          </p>
        </div>
      </div>

      {/* Verificador de credencial */}
      <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
        <p className="text-sm font-medium">Verificar credencial</p>
        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="CAA-2026-00042"
              value={buscandoCodigo}
              onChange={(e) => {
                setBuscandoCodigo(e.target.value);
                setResultadoVerificacion(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && verificarCodigo()}
              className="pl-9 font-mono"
            />
          </div>
          <Button onClick={verificarCodigo} disabled={verificando || !buscandoCodigo.trim()}>
            {verificando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
          </Button>
        </div>

        {resultadoVerificacion && (
          <div className={`flex items-start gap-3 p-3 rounded-md ${
            resultadoVerificacion.valida ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          }`}>
            {resultadoVerificacion.valida
              ? <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              : <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            }
            <div>
              {resultadoVerificacion.valida ? (
                <>
                  <p className="text-sm font-medium text-green-800">Credencial válida</p>
                  <p className="text-sm text-green-700">{resultadoVerificacion.credencial?.socio.nombreCompleto}</p>
                  <p className="text-xs text-green-600">
                    {resultadoVerificacion.credencial?.codigo} · Vigente {resultadoVerificacion.credencial?.anioVigencia}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-red-800">Credencial no válida</p>
                  <p className="text-sm text-red-700">{resultadoVerificacion.razon}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lista de credenciales */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{credenciales.length} credenciales emitidas</p>
        <Button variant="outline" size="sm" onClick={cargarCredenciales}>
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Socio</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">RUT</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vigencia</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td>
              </tr>
            ) : credenciales.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No hay credenciales emitidas para {anioActual}.
                </td>
              </tr>
            ) : (
              credenciales.map((cred) => (
                <tr key={cred.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-sm">{cred.codigo}</td>
                  <td className="px-4 py-3 font-medium">{cred.socio.nombreCompleto}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{cred.socio.rut ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{cred.anioVigencia}</td>
                  <td className="px-4 py-3">
                    <Badge variant={cred.activa ? "success" : "secondary"}>
                      {cred.activa ? "Activa" : "Inactiva"}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
