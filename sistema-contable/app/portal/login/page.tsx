"use client";

import { useState } from "react";
import { Mountain } from "lucide-react";

export default function PortalLoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setEnviado(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary mb-4">
            <Mountain className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Portal del Socio</h1>
          <p className="text-sm text-muted-foreground mt-1">Club Andino Águila Azul</p>
        </div>

        {enviado ? (
          <div className="rounded-xl border bg-card p-8 text-center space-y-3">
            <div className="text-4xl">📧</div>
            <h2 className="font-semibold text-lg">Revisa tu email</h2>
            <p className="text-sm text-muted-foreground">
              Si tu email está registrado, recibirás un enlace de acceso en los próximos minutos.
            </p>
            <p className="text-xs text-muted-foreground">
              El enlace expira en 15 minutos.
            </p>
            <button
              onClick={() => { setEnviado(false); setEmail(""); }}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Ingresar otro email
            </button>
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="font-semibold text-lg">Ingresa tu email</h2>
              <p className="text-sm text-muted-foreground">
                Te enviaremos un enlace de acceso seguro, sin necesidad de contraseña.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="email">
                  Email registrado en el club
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="tu@email.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Enviando..." : "Enviar enlace de acceso"}
              </button>
            </form>

            <p className="text-xs text-center text-muted-foreground">
              ¿Eres del equipo del club?{" "}
              <a href="/login" className="text-primary hover:underline">
                Acceder con contraseña
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
