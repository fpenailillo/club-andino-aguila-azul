import { prisma } from "@/lib/prisma";
import { buscarSociosCandidatos } from "@/lib/reglas-negocio";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// ============================================================================
// SCHEMAS DE VALIDACIÓN
// ============================================================================

const ESTADOS_SOCIO = [
  "ACTIVO",
  "HONORARIO",
  "CONGELADO",
  "COOPERADOR",
  "RENUNCIADO",
  "ELIMINADO",
  "FALLECIDO",
] as const;

export const crearSocioSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(100),
  apPaterno: z.string().max(100).optional(),
  apMaterno: z.string().max(100).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().max(20).optional(),
  rut: z.string().max(15).optional(),
  direccion: z.string().max(200).optional(),
  fechaNacimiento: z.string().optional(),
  fechaIngreso: z.string().optional(),
  acta: z.string().max(50).optional(),
  fechaExSocio: z.string().optional(),
  estado: z.enum(ESTADOS_SOCIO).default("ACTIVO"),
  categoriaId: z.number().int().positive().optional(),
  notas: z.string().max(500).optional(),
});

export type CrearSocioInput = z.infer<typeof crearSocioSchema>;

export const filtrosSociosSchema = z.object({
  busqueda: z.string().optional(),
  estado: z.enum(ESTADOS_SOCIO).optional(),
  categoriaId: z.number().int().positive().optional(),
  pagina: z.number().int().positive().default(1),
  porPagina: z.number().int().positive().max(200).default(50),
});

export type FiltrosSocios = z.infer<typeof filtrosSociosSchema>;

// ============================================================================
// HELPERS
// ============================================================================

function construirNombreCompleto(
  nombre: string,
  apPaterno?: string | null,
  apMaterno?: string | null
): string {
  return [nombre, apPaterno, apMaterno].filter(Boolean).join(" ");
}

// ============================================================================
// SERVICIO DE SOCIOS
// ============================================================================

export async function buscarSociosQuery(query: string, limite = 10) {
  if (!query || query.trim().length < 2) return [];

  const todosSocios = await prisma.socio.findMany({
    where: { estado: "ACTIVO" },
    select: {
      id: true,
      nombre: true,
      apPaterno: true,
      apMaterno: true,
      nombreCompleto: true,
      email: true,
      estado: true,
    },
  });

  const candidatos = buscarSociosCandidatos(query, todosSocios, 0.4, limite);

  return candidatos.map((c) => ({
    ...c.socio,
    score: c.score,
    esMatchExacto: c.esMatchExacto,
    esMatchParcial: c.esMatchParcial,
  }));
}

export async function obtenerSocios(filtros: Partial<FiltrosSocios>) {
  const { busqueda, estado, categoriaId, pagina = 1, porPagina = 50 } = filtros;

  const where: Prisma.SocioWhereInput = {};

  if (estado) where.estado = estado;
  if (categoriaId) where.categoriaId = categoriaId;

  if (busqueda) {
    where.OR = [
      { nombreCompleto: { contains: busqueda, mode: "insensitive" } },
      { email: { contains: busqueda, mode: "insensitive" } },
      { rut: { contains: busqueda, mode: "insensitive" } },
    ];
  }

  const skip = (pagina - 1) * porPagina;

  const [socios, total] = await Promise.all([
    prisma.socio.findMany({
      where,
      orderBy: { nombreCompleto: "asc" },
      skip,
      take: porPagina,
      include: { categoria: { select: { nombre: true, porcentajeCuota: true } } },
    }),
    prisma.socio.count({ where }),
  ]);

  return {
    socios,
    total,
    pagina,
    porPagina,
    totalPaginas: Math.ceil(total / porPagina),
  };
}

export async function obtenerSocioPorId(id: number) {
  const socio = await prisma.socio.findUnique({
    where: { id },
    include: {
      categoria: true,
      credencial: true,
    },
  });
  if (!socio) throw new Error(`Socio ${id} no encontrado`);
  return socio;
}

export async function crearSocio(data: CrearSocioInput) {
  const parsed = crearSocioSchema.parse(data);

  const nombreCompleto = construirNombreCompleto(
    parsed.nombre,
    parsed.apPaterno,
    parsed.apMaterno
  );

  if (parsed.email) {
    const existente = await prisma.socio.findUnique({ where: { email: parsed.email } });
    if (existente) throw new Error(`Ya existe un socio con el email: ${parsed.email}`);
  }

  if (parsed.rut) {
    const existente = await prisma.socio.findUnique({ where: { rut: parsed.rut } });
    if (existente) throw new Error(`Ya existe un socio con el RUT: ${parsed.rut}`);
  }

  return prisma.socio.create({
    data: {
      nombre: parsed.nombre,
      apPaterno: parsed.apPaterno ?? null,
      apMaterno: parsed.apMaterno ?? null,
      nombreCompleto,
      email: parsed.email || null,
      telefono: parsed.telefono ?? null,
      rut: parsed.rut ?? null,
      direccion: parsed.direccion ?? null,
      fechaNacimiento: parsed.fechaNacimiento ? new Date(parsed.fechaNacimiento) : null,
      fechaIngreso: parsed.fechaIngreso ? new Date(parsed.fechaIngreso) : undefined,
      acta: parsed.acta ?? null,
      fechaExSocio: parsed.fechaExSocio ? new Date(parsed.fechaExSocio) : null,
      estado: parsed.estado,
      categoriaId: parsed.categoriaId ?? null,
      notas: parsed.notas ?? null,
    },
    include: { categoria: true },
  });
}

export async function actualizarSocio(id: number, data: Partial<CrearSocioInput>) {
  const existente = await prisma.socio.findUnique({ where: { id } });
  if (!existente) throw new Error(`Socio ${id} no encontrado`);

  const updateData: Prisma.SocioUpdateInput = {};

  if (data.nombre !== undefined) updateData.nombre = data.nombre;
  if (data.apPaterno !== undefined) updateData.apPaterno = data.apPaterno ?? null;
  if (data.apMaterno !== undefined) updateData.apMaterno = data.apMaterno ?? null;

  // Reconstruir nombreCompleto si cambia cualquier parte del nombre
  if (data.nombre !== undefined || data.apPaterno !== undefined || data.apMaterno !== undefined) {
    updateData.nombreCompleto = construirNombreCompleto(
      data.nombre ?? existente.nombre,
      data.apPaterno ?? existente.apPaterno,
      data.apMaterno ?? existente.apMaterno
    );
  }

  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.telefono !== undefined) updateData.telefono = data.telefono ?? null;
  if (data.rut !== undefined) updateData.rut = data.rut ?? null;
  if (data.direccion !== undefined) updateData.direccion = data.direccion ?? null;
  if (data.fechaNacimiento !== undefined) {
    updateData.fechaNacimiento = data.fechaNacimiento ? new Date(data.fechaNacimiento) : null;
  }
  if (data.acta !== undefined) updateData.acta = data.acta ?? null;
  if (data.fechaExSocio !== undefined) {
    updateData.fechaExSocio = data.fechaExSocio ? new Date(data.fechaExSocio) : null;
  }
  if (data.estado !== undefined) updateData.estado = data.estado;
  if (data.categoriaId !== undefined) {
    updateData.categoria = data.categoriaId
      ? { connect: { id: data.categoriaId } }
      : { disconnect: true };
  }
  if (data.notas !== undefined) updateData.notas = data.notas ?? null;

  return prisma.socio.update({
    where: { id },
    data: updateData,
    include: { categoria: true },
  });
}

export async function obtenerEstadoCuentaSocio(socioId: number) {
  const socio = await prisma.socio.findUnique({
    where: { id: socioId },
    include: { categoria: true, credencial: true },
  });
  if (!socio) throw new Error(`Socio ${socioId} no encontrado`);

  const totales = await prisma.movimiento.groupBy({
    by: ["tipo"],
    where: { socioId },
    _sum: { monto: true },
    _count: true,
  });

  let totalIngresos = 0;
  let totalEgresos = 0;
  let totalCargos = 0;
  let totalAbonos = 0;

  for (const t of totales) {
    const suma = Number(t._sum.monto ?? 0);
    if (t.tipo === "INGRESO") totalIngresos = suma;
    else if (t.tipo === "EGRESO") totalEgresos = suma;
    else if (t.tipo === "CARGO") totalCargos = suma;
    else if (t.tipo === "ABONO") totalAbonos = suma;
  }

  const cantidadMovimientos = totales.reduce((acc, t) => acc + t._count, 0);

  // Saldo en cuenta corriente: abonos - cargos (positivo = a favor del socio)
  const saldoCuenta = totalAbonos - totalCargos;

  const ultimosMovimientos = await prisma.movimiento.findMany({
    where: { socioId },
    include: {
      concepto: { select: { nombre: true } },
      centro: { select: { nombre: true } },
    },
    orderBy: { fecha: "desc" },
    take: 10,
  });

  return {
    socio,
    totalIngresos,
    totalEgresos,
    totalCargos,
    totalAbonos,
    saldoCuenta,
    cantidadMovimientos,
    ultimosMovimientos,
  };
}

export async function obtenerResumenSocios() {
  const [total, porEstado] = await Promise.all([
    prisma.socio.count(),
    prisma.socio.groupBy({ by: ["estado"], _count: true }),
  ]);

  const estados = Object.fromEntries(
    ESTADOS_SOCIO.map((e) => [e, 0])
  ) as Record<typeof ESTADOS_SOCIO[number], number>;

  for (const e of porEstado) {
    estados[e.estado] = e._count;
  }

  return { total, ...estados };
}
