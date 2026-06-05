import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

export const crearReservaSchema = z.object({
  socioId: z.number().int().positive(),
  fechaDesde: z.string(),
  fechaHasta: z.string(),
  nPersonas: z.number().int().positive().max(30).default(1),
  comentario: z.string().max(500).optional(),
});

export type CrearReservaInput = z.infer<typeof crearReservaSchema>;

export async function crearReserva(data: CrearReservaInput) {
  const parsed = crearReservaSchema.parse(data);

  const socio = await prisma.socio.findUnique({ where: { id: parsed.socioId } });
  if (!socio) throw new Error("Socio no encontrado");
  if (socio.estado === "ELIMINADO" || socio.estado === "FALLECIDO" || socio.estado === "RENUNCIADO") {
    throw new Error("Solo socios activos pueden solicitar uso del refugio");
  }

  const desde = new Date(parsed.fechaDesde);
  const hasta = new Date(parsed.fechaHasta);

  if (desde >= hasta) throw new Error("La fecha de salida debe ser posterior a la de entrada");
  if (desde < new Date()) throw new Error("La fecha de entrada no puede ser en el pasado");

  // Verificar solapamiento con reservas aprobadas
  const solapamiento = await prisma.reserva.findFirst({
    where: {
      estado: "APROBADA",
      OR: [
        { fechaDesde: { lte: hasta }, fechaHasta: { gte: desde } },
      ],
    },
  });

  return prisma.reserva.create({
    data: {
      socioId: parsed.socioId,
      fechaDesde: desde,
      fechaHasta: hasta,
      nPersonas: parsed.nPersonas,
      comentario: parsed.comentario ?? null,
      estado: solapamiento ? "PENDIENTE" : "PENDIENTE", // siempre pendiente, admin aprueba
    },
    include: { socio: { select: { nombreCompleto: true, email: true } } },
  });
}

export async function obtenerReservas(filtros: {
  estado?: "PENDIENTE" | "APROBADA" | "RECHAZADA" | "CANCELADA";
  socioId?: number;
  desde?: string;
  hasta?: string;
  pagina?: number;
  porPagina?: number;
}) {
  const { estado, socioId, desde, hasta, pagina = 1, porPagina = 20 } = filtros;

  const where: Prisma.ReservaWhereInput = {};
  if (estado) where.estado = estado;
  if (socioId) where.socioId = socioId;
  if (desde || hasta) {
    where.fechaDesde = {};
    if (desde) where.fechaDesde.gte = new Date(desde);
    if (hasta) where.fechaDesde.lte = new Date(hasta);
  }

  const [reservas, total] = await Promise.all([
    prisma.reserva.findMany({
      where,
      include: { socio: { select: { nombreCompleto: true, email: true, telefono: true } } },
      orderBy: { fechaDesde: "asc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.reserva.count({ where }),
  ]);

  return { reservas, total, pagina, porPagina, totalPaginas: Math.ceil(total / porPagina) };
}

export async function revisarReserva(
  id: number,
  decision: "APROBADA" | "RECHAZADA",
  revisadoPor: string,
  motivoRechazo?: string
) {
  const reserva = await prisma.reserva.findUnique({ where: { id } });
  if (!reserva) throw new Error("Reserva no encontrada");
  if (reserva.estado !== "PENDIENTE") throw new Error("Solo se pueden revisar reservas pendientes");
  if (decision === "RECHAZADA" && !motivoRechazo) throw new Error("Debe indicar motivo de rechazo");

  return prisma.reserva.update({
    where: { id },
    data: {
      estado: decision,
      revisadoPor,
      revisadoEn: new Date(),
      motivoRechazo: motivoRechazo ?? null,
    },
    include: { socio: { select: { nombreCompleto: true, email: true } } },
  });
}

export async function cancelarReserva(id: number, socioId: number) {
  const reserva = await prisma.reserva.findUnique({ where: { id } });
  if (!reserva) throw new Error("Reserva no encontrada");
  if (reserva.socioId !== socioId) throw new Error("No tienes permiso para cancelar esta reserva");
  if (reserva.estado === "APROBADA") {
    const horasHastaReserva = (reserva.fechaDesde.getTime() - Date.now()) / 3600000;
    if (horasHastaReserva < 24) throw new Error("No se puede cancelar con menos de 24 horas de anticipación");
  }

  return prisma.reserva.update({
    where: { id },
    data: { estado: "CANCELADA" },
  });
}
