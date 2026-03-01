import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const crearReservaSchema = z.object({
  fechaDesde: z.string().datetime(),
  fechaHasta: z.string().datetime(),
  nPersonas: z.number().int().min(1).max(20),
  comentario: z.string().optional(),
});

export async function GET() {
  const { error, session } = await requireRole("SOCIO");
  if (error) return error;

  const socioId = session!.user.socioId;
  if (!socioId) {
    return NextResponse.json({ error: "Socio no vinculado" }, { status: 404 });
  }

  const reservas = await prisma.reserva.findMany({
    where: { socioId },
    orderBy: { fechaDesde: "desc" },
    take: 20,
  });

  return NextResponse.json(reservas);
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireRole("SOCIO");
  if (error) return error;

  const socioId = session!.user.socioId;
  if (!socioId) {
    return NextResponse.json({ error: "Socio no vinculado" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = crearReservaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 });
  }

  const { fechaDesde, fechaHasta, nPersonas, comentario } = parsed.data;

  const desde = new Date(fechaDesde);
  const hasta = new Date(fechaHasta);

  if (desde >= hasta) {
    return NextResponse.json({ error: "La fecha de inicio debe ser anterior a la fecha de término" }, { status: 400 });
  }

  if (desde < new Date()) {
    return NextResponse.json({ error: "No se puede reservar en fechas pasadas" }, { status: 400 });
  }

  // Verificar que el socio está activo
  const socio = await prisma.socio.findUnique({
    where: { id: socioId },
    select: { estado: true },
  });
  if (!socio || !["ACTIVO", "HONORARIO", "COOPERADOR"].includes(socio.estado)) {
    return NextResponse.json({ error: "Tu cuenta no permite hacer reservas" }, { status: 403 });
  }

  const reserva = await prisma.reserva.create({
    data: {
      socioId,
      fechaDesde: desde,
      fechaHasta: hasta,
      nPersonas,
      comentario: comentario ?? "",
      estado: "PENDIENTE",
    },
  });

  return NextResponse.json(reserva, { status: 201 });
}
