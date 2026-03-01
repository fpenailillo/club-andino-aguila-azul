import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Receipt, CalendarCheck, IdCard, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

function formatMonto(monto: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(monto);
}

export default async function PortalInicioPage() {
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") redirect("/portal/login");

  const socioId = session.user.socioId;
  if (!socioId) {
    return (
      <div className="p-6 text-muted-foreground">
        Tu cuenta no está vinculada a un socio. Contacta al administrador.
      </div>
    );
  }

  const [socio, movimientos, proximaReserva, credencial] = await Promise.all([
    prisma.socio.findUnique({
      where: { id: socioId },
      select: {
        nombreCompleto: true,
        estado: true,
        categoria: { select: { nombre: true } },
      },
    }),
    prisma.movimiento.findMany({
      where: { socioId, tipo: { in: ["CARGO", "ABONO"] } },
      select: { tipo: true, monto: true },
    }),
    prisma.reserva.findFirst({
      where: {
        socioId,
        estado: "APROBADA",
        fechaDesde: { gte: new Date() },
      },
      orderBy: { fechaDesde: "asc" },
    }),
    prisma.credencial.findUnique({
      where: { socioId },
      select: { codigo: true, anioVigencia: true, activa: true },
    }),
  ]);

  const totalCargos = movimientos
    .filter((m) => m.tipo === "CARGO")
    .reduce((s, m) => s + Number(m.monto), 0);
  const totalAbonos = movimientos
    .filter((m) => m.tipo === "ABONO")
    .reduce((s, m) => s + Number(m.monto), 0);
  const saldo = totalAbonos - totalCargos;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Bienvenida */}
      <div>
        <h1 className="text-2xl font-bold">Hola, {socio?.nombreCompleto?.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">
          {socio?.categoria?.nombre} · Estado:{" "}
          <span className="text-foreground font-medium">{socio?.estado}</span>
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Receipt className="h-4 w-4" />
            Saldo cuenta
          </div>
          <p className={`text-2xl font-bold ${saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatMonto(saldo)}
          </p>
          <p className="text-xs text-muted-foreground">
            {saldo >= 0 ? "Al día" : "Deuda pendiente"}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <TrendingDown className="h-4 w-4 text-red-500" />
            Total cargos
          </div>
          <p className="text-xl font-semibold">{formatMonto(totalCargos)}</p>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Total abonos
          </div>
          <p className="text-xl font-semibold">{formatMonto(totalAbonos)}</p>
        </div>
      </div>

      {/* Próxima reserva */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Próxima reserva
          </h2>
          <Link href="/portal/reservas" className="text-xs text-primary hover:underline">
            Ver todas
          </Link>
        </div>
        {proximaReserva ? (
          <div className="text-sm space-y-0.5">
            <p className="font-medium">
              {new Date(proximaReserva.fechaDesde).toLocaleDateString("es-CL", {
                weekday: "long", day: "numeric", month: "long",
              })}
              {" — "}
              {new Date(proximaReserva.fechaHasta).toLocaleDateString("es-CL", {
                day: "numeric", month: "long",
              })}
            </p>
            <p className="text-muted-foreground">{proximaReserva.nPersonas} persona(s)</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No tienes reservas aprobadas próximas.{" "}
            <Link href="/portal/reservas" className="text-primary hover:underline">
              Hacer una reserva
            </Link>
          </p>
        )}
      </div>

      {/* Credencial */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <IdCard className="h-5 w-5 text-primary" />
            Credencial digital
          </h2>
          <Link href="/portal/credencial" className="text-xs text-primary hover:underline">
            Ver credencial
          </Link>
        </div>
        {credencial ? (
          <div className="text-sm space-y-0.5">
            <p className="font-mono font-semibold text-lg">{credencial.codigo}</p>
            <p className="text-muted-foreground">
              Vigencia: {credencial.anioVigencia} ·{" "}
              <span className={credencial.activa ? "text-green-600" : "text-red-500"}>
                {credencial.activa ? "Activa" : "Inactiva"}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No tienes credencial emitida este año. Contacta al administrador.
          </p>
        )}
      </div>
    </div>
  );
}
