import { prisma } from "@/lib/prisma";
import {
  buscarSocio,
  buscarSociosCandidatos,
  normalizarNombre,
} from "@/lib/reglas-negocio";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// ============================================================================
// SCHEMAS DE VALIDACIÓN
// ============================================================================

export const crearSocioSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(100),
  apellido: z.string().max(100).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().max(20).optional(),
  rut: z.string().max(15).optional(),
  estado: z
    .enum(["ACTIVO", "INACTIVO", "SUSPENDIDO", "MOROSO"])
    .default("ACTIVO"),
  notas: z.string().max(500).optional(),
  fechaIngreso: z.string().optional(),
});

export type CrearSocioInput = z.infer<typeof crearSocioSchema>;

export const filtrosSociosSchema = z.object({
  busqueda: z.string().optional(),
  estado: z.enum(["ACTIVO", "INACTIVO", "SUSPENDIDO", "MOROSO"]).optional(),
  pagina: z.number().int().positive().default(1),
  porPagina: z.number().int().positive().max(200).default(50),
});

export type FiltrosSocios = z.infer<typeof filtrosSociosSchema>;

// ============================================================================
// SERVICIO DE SOCIOS
// ============================================================================

export async function buscarSociosQuery(query: string, limite = 10) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  // Obtener todos los socios activos para búsqueda fuzzy
  const todosSocios = await prisma.socio.findMany({
    where: { estado: "ACTIVO" },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      nombreCompleto: true,
      email: true,
      estado: true,
    },
  });

  // Usar búsqueda fuzzy de reglas de negocio
  const candidatos = buscarSociosCandidatos(query, todosSocios, 0.4, limite);

  return candidatos.map((c) => ({
    ...c.socio,
    score: c.score,
    esMatchExacto: c.esMatchExacto,
    esMatchParcial: c.esMatchParcial,
  }));
}

export async function obtenerSocios(filtros: Partial<FiltrosSocios>) {
  const { busqueda, estado, pagina = 1, porPagina = 50 } = filtros;

  const where: Prisma.SocioWhereInput = {};

  if (estado) where.estado = estado;

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
  const socio = await prisma.socio.findUnique({ where: { id } });
  if (!socio) throw new Error(`Socio ${id} no encontrado`);
  return socio;
}

export async function crearSocio(data: CrearSocioInput) {
  const parsed = crearSocioSchema.parse(data);

  const nombreCompleto = [parsed.nombre, parsed.apellido]
    .filter(Boolean)
    .join(" ");

  // Verificar email único
  if (parsed.email) {
    const existente = await prisma.socio.findUnique({
      where: { email: parsed.email },
    });
    if (existente) {
      throw new Error(`Ya existe un socio con el email: ${parsed.email}`);
    }
  }

  return prisma.socio.create({
    data: {
      nombre: parsed.nombre,
      apellido: parsed.apellido,
      nombreCompleto,
      email: parsed.email || null,
      telefono: parsed.telefono,
      rut: parsed.rut,
      estado: parsed.estado,
      notas: parsed.notas,
      fechaIngreso: parsed.fechaIngreso
        ? new Date(parsed.fechaIngreso)
        : undefined,
    },
  });
}

export async function actualizarSocio(
  id: number,
  data: Partial<CrearSocioInput>
) {
  const existente = await prisma.socio.findUnique({ where: { id } });
  if (!existente) throw new Error(`Socio ${id} no encontrado`);

  const updateData: Prisma.SocioUpdateInput = {};

  if (data.nombre !== undefined) updateData.nombre = data.nombre;
  if (data.apellido !== undefined) updateData.apellido = data.apellido;
  if (data.nombre || data.apellido) {
    const nombre = data.nombre ?? existente.nombre;
    const apellido = data.apellido ?? existente.apellido;
    updateData.nombreCompleto = [nombre, apellido].filter(Boolean).join(" ");
  }
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.telefono !== undefined) updateData.telefono = data.telefono;
  if (data.rut !== undefined) updateData.rut = data.rut;
  if (data.estado !== undefined) updateData.estado = data.estado;
  if (data.notas !== undefined) updateData.notas = data.notas;

  return prisma.socio.update({ where: { id }, data: updateData });
}

export async function obtenerEstadoCuentaSocio(socioId: number) {
  const socio = await prisma.socio.findUnique({ where: { id: socioId } });
  if (!socio) throw new Error(`Socio ${socioId} no encontrado`);

  const [totales, ultimosMovimientos] = await Promise.all([
    prisma.movimiento.groupBy({
      by: ["tipo"],
      where: { socioId },
      _sum: { monto: true },
      _count: true,
    }),
    prisma.movimiento.findMany({
      where: { socioId },
      include: {
        concepto: { select: { nombre: true } },
        centro: { select: { nombre: true } },
      },
      orderBy: { fecha: "desc" },
      take: 10,
    }),
  ]);

  let totalIngresos = 0;
  let totalEgresos = 0;
  let cantidadMovimientos = 0;

  for (const t of totales) {
    if (t.tipo === "INGRESO") {
      totalIngresos = Number(t._sum.monto ?? 0);
    } else {
      totalEgresos = Number(t._sum.monto ?? 0);
    }
    cantidadMovimientos += t._count;
  }

  return {
    socio,
    totalIngresos,
    totalEgresos,
    balance: totalIngresos - totalEgresos,
    cantidadMovimientos,
    ultimosMovimientos,
  };
}

export async function obtenerResumenSocios() {
  const [total, porEstado] = await Promise.all([
    prisma.socio.count(),
    prisma.socio.groupBy({
      by: ["estado"],
      _count: true,
    }),
  ]);

  const estados = {
    ACTIVO: 0,
    INACTIVO: 0,
    SUSPENDIDO: 0,
    MOROSO: 0,
  };

  for (const e of porEstado) {
    estados[e.estado] = e._count;
  }

  return { total, ...estados };
}
