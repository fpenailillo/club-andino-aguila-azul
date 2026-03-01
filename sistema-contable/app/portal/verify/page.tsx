"use client";

import { useEffect, useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Mountain } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [estado, setEstado] = useState<"verificando" | "error">("verificando");

  useEffect(() => {
    if (!token) {
      setEstado("error");
      return;
    }

    signIn("magic-link", {
      token,
      callbackUrl: "/portal/inicio",
      redirect: true,
    }).catch(() => setEstado("error"));
  }, [token]);

  if (estado === "error") {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-lg font-semibold">Enlace inválido o expirado</h2>
        <p className="text-sm text-muted-foreground">
          Este enlace ya fue utilizado o ha expirado. Los enlaces son válidos por 15 minutos.
        </p>
        <a
          href="/portal/login"
          className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Solicitar nuevo enlace
        </a>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <div className="inline-flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-primary border-t-transparent" />
      <h2 className="text-lg font-semibold">Verificando acceso...</h2>
      <p className="text-sm text-muted-foreground">Serás redirigido en un momento.</p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary mb-4">
            <Mountain className="h-8 w-8 text-primary-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Club Andino Águila Azul</p>
        </div>
        <div className="rounded-xl border bg-card p-8">
          <Suspense fallback={<div className="text-sm text-muted-foreground">Cargando...</div>}>
            <VerifyContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
