"use client";

import { useEffect, useState } from "react";
import { IdCard, Copy, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type CredencialData = {
  credencial: {
    id: number;
    codigo: string;
    anioVigencia: number;
    activa: boolean;
    emitidaEn: string;
  } | null;
  socio: {
    nombreCompleto: string;
    estado: string;
    categoria: { nombre: string } | null;
  } | null;
};

export default function CredencialPage() {
  const { toast } = useToast();
  const [data, setData] = useState<CredencialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    fetch("/api/portal/credencial")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  async function copiarCodigo() {
    if (!data?.credencial?.codigo) return;
    await navigator.clipboard.writeText(data.credencial.codigo);
    setCopiado(true);
    toast({ title: "Código copiado al portapapeles" });
    setTimeout(() => setCopiado(false), 2000);
  }

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground py-12">Cargando...</div>;
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <IdCard className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Mi Credencial</h1>
      </div>

      {data?.credencial ? (
        <div className="space-y-4">
          {/* Tarjeta visual */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 text-white p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-xs font-medium uppercase tracking-wider">Club Andino</p>
                <p className="text-lg font-bold">Águila Azul</p>
              </div>
              <div className="text-4xl opacity-80">⛰</div>
            </div>

            <div>
              <p className="text-blue-200 text-xs">Socio</p>
              <p className="text-xl font-bold">{data.socio?.nombreCompleto}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-blue-200 text-xs">Categoría</p>
                <p className="font-medium">{data.socio?.categoria?.nombre ?? "—"}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs">Vigencia</p>
                <p className="font-medium">{data.credencial.anioVigencia}</p>
              </div>
            </div>

            <div className="border-t border-blue-600 pt-3">
              <p className="text-blue-200 text-xs mb-1">Código</p>
              <p className="font-mono text-2xl font-bold tracking-widest">{data.credencial.codigo}</p>
            </div>

            <div className="flex items-center justify-between">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                data.credencial.activa
                  ? "bg-green-400/20 text-green-200"
                  : "bg-red-400/20 text-red-200"
              }`}>
                {data.credencial.activa ? "ACTIVA" : "INACTIVA"}
              </span>
              <p className="text-blue-300 text-xs">
                Emitida {new Date(data.credencial.emitidaEn).toLocaleDateString("es-CL")}
              </p>
            </div>
          </div>

          {/* Botón copiar */}
          <button
            onClick={copiarCodigo}
            className="w-full flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            {copiado ? (
              <>
                <CheckCheck className="h-4 w-4 text-green-600" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar código
              </>
            )}
          </button>

          <p className="text-xs text-center text-muted-foreground">
            Presenta tu código{" "}
            <span className="font-mono font-semibold">{data.credencial.codigo}</span>{" "}
            para identificarte como socio del club.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-8 text-center space-y-3">
          <div className="text-4xl">🪪</div>
          <h2 className="font-semibold">Sin credencial emitida</h2>
          <p className="text-sm text-muted-foreground">
            No tienes una credencial digital emitida para este año. Contacta al administrador del club para solicitarla.
          </p>
        </div>
      )}
    </div>
  );
}
