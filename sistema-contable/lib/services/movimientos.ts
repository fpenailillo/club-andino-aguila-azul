import { prisma } from "@/lib/prisma";
import {
  debeAsignarSocio,
  getMotivoSinSocio,
  determinarCentro,
  generarNumeroRegistro,
  validarMonto,
  validarFecha,
  validarSocioRequerido,
} from "@/lib/reglas-negocio";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// ============================================================================
// SCHEMAS DE VALIDACIÓN
// ============================================================================

export const crearMovimientoSchema = z.object({
  tipo: z.enum(["INGRESO", "EGRESO"]),
  socioId: z.number().nullable().optional(),
  conceptoId: z.number().int().positive(),
  centroId: z.number().int().positive().optional(),
  comentario: z.string().min(1, "El comentario es requerido").max(500),
  monto: z.number().positive("El monto debe ser positivo"),
  fecha: z.string().or(z.date()),
  creadoPor: z.string().optional(),
});

export type CrearMovimientoInput = z.infer<typeof crearMovimientoSchema>;

export const filtrosMovimientosSchema = z.object({
  tipo: z.enum(["INGRESO", "EGRESO"]).optional(),
  socioId: z.number().optional(),
  conceptoId: z.number().optional(),
  centroId: z.number().optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  busqueda: z.string().optional(),
  pagina: z.number().int().positive().default(1),
  porPagina: z.number().int().positive().max(100).default(20),
  ordenPor: z.string().optional().default("fecha"),
  orden: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type FiltrosMovimientos = z.infer<typeof filtrosMovimientosSchema>;

// ============================================================================
// SERVICIO DE MOVIMIENTOS
// ============================================================================

export async function crearMovimiento(data: CrearMovimientoInput) {
  // Parsear y validar
  const parsed = crearMovimientoSchema.parse(data);

  const fecha =
    typeof parsed.fecha === "string" ? new Date(parsed.fecha) : parsed.fecha;

  // Validaciones de negocio
  const validMonto = validarMonto(parsed.monto);
  if (!validMonto.valido) {
    throw new Error(validMonto.error);
  }

  const validFecha = validarFecha(fecha);
  if (!validFecha.valido) {
    throw new Error(validFecha.error);
  }

  // Obtener concepto para aplicar reglas
  const concepto = await prisma.concepto.findUnique({
    where: { id: parsed.conceptoId },
  });
  if (!concepto) {
    throw new Error("Concepto no encontrado");
  }

  // Aplicar regla de asignación de socios
  const debeAsignar = debeAsignarSocio(concepto.nombre, parsed.comentario);
  const validSocio = validarSocioRequerido(
    parsed.socioId ?? null,
    concepto.nombre,
    parsed.comentario
  );
  if (!validSocio.valido) {
    throw new Error(validSocio.error);
  }

  const socioId = debeAsignar ? (parsed.socioId ?? null) : null;
  const esSinSocio = !debeAsignar;
  const motivoSinSocio = getMotivoSinSocio(concepto.nombre, parsed.comentario);

  // Determinar centro automáticamente si no se especifica
  let centroId = parsed.centroId;
  if (!centroId) {
    const nombreCentro = determinarCentro(concepto.nombre);
    const centro = await prisma.centro.findUnique({
      where: { nombre: nombreCentro },
    });
    centroId = centro?.id;
  }
  if (!centroId) {
    throw new Error("Centro no encontrado");
  }

  // Generar número de registro (con transacción para evitar race conditions)
  const movimiento = await prisma.$transaction(async (tx) => {
    const contador = await tx.contadorRegistro.update({
      where: { tipo: parsed.tipo },
      data: { ultimo: { increment: 1 } },
    });

    const numeroRegistro = generarNumeroRegistro(
      parsed.tipo,
      contador.ultimo
    );

    return tx.movimiento.create({
      data: {
        tipo: parsed.tipo,
        numeroRegistro,
        socioId,
        conceptoId: parsed.conceptoId,
        centroId,
        comentario: parsed.comentario,
        monto: new Prisma.Decimal(parsed.monto),
        fecha,
        esSinSocio,
        motivoSinSocio,
        creadoPor: parsed.creadoPor,
      },
      include: {
        socio: true,
        concepto: true,
        centro: true,
      },
    });
  });

  return movimiento;
}

export async function obtenerMovimientos(filtros: Partial<FiltrosMovimientos>) {
  const {
    tipo,
    socioId,
    conceptoId,
    centroId,
    fechaDesde,
    fechaHasta,
    busqueda,
    pagina = 1,
    porPagina = 20,
    ordenPor = "fecha",
    orden = "desc",
  } = filtros;

  const where: Prisma.MovimientoWhereInput = {};

  if (tipo) where.tipo = tipo;
  if (socioId) where.socioId = socioId;
  if (conceptoId) where.conceptoId = conceptoId;
  if (centroId) where.centroId = centroId;

  if (fechaDesde || fechaHasta) {
    where.fecha = {};
    if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
    if (fechaHasta) {
      const hasta = new Date(fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      where.fecha.lte = hasta;
    }
  }

  if (busqueda) {
    where.OR = [
      { numeroRegistro: { contains: busqueda, mode: "insensitive" } },
      { comentario: { contains: busqueda, mode: "insensitive" } },
      {
        socio: {
          nombreCompleto: { contains: busqueda, mode: "insensitive" },
        },
      },
    ];
  }

  const orderBy: Prisma.MovimientoOrderByWithRelationInput = {};
  if (ordenPor === "fecha") orderBy.fecha = orden;
  else if (ordenPor === "monto") orderBy.monto = orden;
  else if (ordenPor === "numeroRegistro") orderBy.numeroRegistro = orden;
  else orderBy.fecha = "desc";

  const skip = (pagina - 1) * porPagina;

  const [movimientos, total] = await Promise.all([
    prisma.movimiento.findMany({
      where,
      include: {
        socio: { select: { id: true, nombreCompleto: true, estado: true } },
        concepto: { select: { id: true, nombre: true, tipo: true } },
        centro: { select: { id: true, nombre: true } },
      },
      orderBy,
      skip,
      take: porPagina,
    }),
    prisma.movimiento.count({ where }),
  ]);

  // Calcular totales del resultado actual
  const totalesResult = await prisma.movimiento.groupBy({
    by: ["tipo"],
    where,
    _sum: { monto: true },
    _count: true,
  });

  const totales = {
    ingresos: 0,
    egresos: 0,
    balance: 0,
    cantidadIngresos: 0,
    cantidadEgresos: 0,
  };

  for (const r of totalesResult) {
    const suma = Number(r._sum.monto ?? 0);
    if (r.tipo === "INGRESO") {
      totales.ingresos = suma;
      totales.cantidadIngresos = r._count;
    } else {
      totales.egresos = suma;
      totales.cantidadEgresos = r._count;
    }
  }
  totales.balance = totales.ingresos - totales.egresos;

  return {
    movimientos,
    total,
    pagina,
    porPagina,
    totalPaginas: Math.ceil(total / porPagina),
    totales,
  };
}

export async function obtenerMovimientoPorId(id: number) {
  const movimiento = await prisma.movimiento.findUnique({
    where: { id },
    include: {
      socio: true,
      concepto: true,
      centro: true,
    },
  });

  if (!movimiento) {
    throw new Error(`Movimiento ${id} no encontrado`);
  }

  return movimiento;
}

export async function actualizarMovimiento(
  id: number,
  data: Partial<CrearMovimientoInput>
) {
  const existente = await prisma.movimiento.findUnique({
    where: { id },
    include: { concepto: true },
  });
  if (!existente) {
    throw new Error(`Movimiento ${id} no encontrado`);
  }

  const updateData: Prisma.MovimientoUpdateInput = {};

  if (data.comentario !== undefined) updateData.comentario = data.comentario;
  if (data.monto !== undefined) {
    const validMonto = validarMonto(data.monto);
    if (!validMonto.valido) throw new Error(validMonto.error);
    updateData.monto = new Prisma.Decimal(data.monto);
  }
  if (data.fecha !== undefined) {
    const fecha =
      typeof data.fecha === "string" ? new Date(data.fecha) : data.fecha;
    const validFecha = validarFecha(fecha);
    if (!validFecha.valido) throw new Error(validFecha.error);
    updateData.fecha = fecha;
  }

  if (data.modificadoPor) updateData.modificadoPor = data.modificadoPor as string;

  return prisma.movimiento.update({
    where: { id },
    data: updateData,
    include: {
      socio: true,
      concepto: true,
      centro: true,
    },
  });
}

export async function eliminarMovimiento(id: number) {
  const existente = await prisma.movimiento.findUnique({ where: { id } });
  if (!existente) {
    throw new Error(`Movimiento ${id} no encontrado`);
  }

  return prisma.movimiento.delete({ where: { id } });
}

// ============================================================================
// ESTADÍSTICAS PARA DASHBOARD
// ============================================================================

export async function obtenerEstadisticasMes(anio?: number, mes?: number) {
  const ahora = new Date();
  const anioActual = anio ?? ahora.getFullYear();
  const mesActual = mes ?? ahora.getMonth() + 1;

  const inicio = new Date(anioActual, mesActual - 1, 1);
  const fin = new Date(anioActual, mesActual, 0, 23, 59, 59, 999);

  const [ingresos, egresos] = await Promise.all([
    prisma.movimiento.aggregate({
      where: { tipo: "INGRESO", fecha: { gte: inicio, lte: fin } },
      _sum: { monto: true },
      _count: true,
    }),
    prisma.movimiento.aggregate({
      where: { tipo: "EGRESO", fecha: { gte: inicio, lte: fin } },
      _sum: { monto: true },
      _count: true,
    }),
  ]);

  const totalIngresos = Number(ingresos._sum.monto ?? 0);
  const totalEgresos = Number(egresos._sum.monto ?? 0);

  return {
    totalIngresos,
    totalEgresos,
    balance: totalIngresos - totalEgresos,
    cantidadIngresos: ingresos._count,
    cantidadEgresos: egresos._count,
    mes: mesActual,
    anio: anioActual,
  };
}

export async function obtenerEvolucionMensual(meses = 6) {
  const resultados = [];

  for (let i = meses - 1; i >= 0; i--) {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - i);

    const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59, 999);

    const [ingresos, egresos] = await Promise.all([
      prisma.movimiento.aggregate({
        where: { tipo: "INGRESO", fecha: { gte: inicio, lte: fin } },
        _sum: { monto: true },
      }),
      prisma.movimiento.aggregate({
        where: { tipo: "EGRESO", fecha: { gte: inicio, lte: fin } },
        _sum: { monto: true },
      }),
    ]);

    resultados.push({
      mes: inicio.toLocaleDateString("es-CL", { month: "short", year: "2-digit" }),
      ingresos: Number(ingresos._sum.monto ?? 0),
      egresos: Number(egresos._sum.monto ?? 0),
    });
  }

  return resultados;
}

export async function obtenerDistribucionPorConcepto(tipo: "INGRESO" | "EGRESO") {
  const resultado = await prisma.movimiento.groupBy({
    by: ["conceptoId"],
    where: { tipo },
    _sum: { monto: true },
    _count: true,
    orderBy: { _sum: { monto: "desc" } },
  });

  const conceptos = await prisma.concepto.findMany({
    where: { id: { in: resultado.map((r) => r.conceptoId) } },
  });

  const conceptoMap = new Map(conceptos.map((c) => [c.id, c.nombre]));

  return resultado.map((r) => ({
    concepto: conceptoMap.get(r.conceptoId) ?? "Desconocido",
    monto: Number(r._sum.monto ?? 0),
    cantidad: r._count,
  }));
}
