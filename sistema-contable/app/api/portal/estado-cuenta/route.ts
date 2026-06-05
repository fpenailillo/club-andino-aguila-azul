import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

export async function GET() {
  const { error, session } = await requireRole("SOCIO");
  if (error) return error;

  const socioId = session!.user.socioId;
  if (!socioId) {
    return NextResponse.json({ error: "Socio no vinculado" }, { status: 404 });
  }

  const movimientos = await prisma.movimiento.findMany({
    where: { socioId, tipo: { in: ["CARGO", "ABONO"] } },
    include: { concepto: { select: { nombre: true } } },
    orderBy: { fecha: "desc" },
    take: 100,
  });

  const totalCargos = movimientos
    .filter((m) => m.tipo === "CARGO")
    .reduce((sum, m) => sum + Number(m.monto), 0);

  const totalAbonos = movimientos
    .filter((m) => m.tipo === "ABONO")
    .reduce((sum, m) => sum + Number(m.monto), 0);

  const saldo = totalAbonos - totalCargos;

  return NextResponse.json({
    movimientos: movimientos.map((m) => ({
      id: m.id,
      numeroRegistro: m.numeroRegistro,
      tipo: m.tipo,
      concepto: m.concepto.nombre,
      monto: Number(m.monto),
      fecha: m.fecha,
      comentario: m.comentario,
    })),
    resumen: { totalCargos, totalAbonos, saldo },
  });
}
