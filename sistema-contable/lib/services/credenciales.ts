import { prisma } from "@/lib/prisma";

// Formato: "CAA-2026-00042"
function generarCodigoCredencial(anio: number, numero: number): string {
  return `CAA-${anio}-${numero.toString().padStart(5, "0")}`;
}

export async function emitirCredencial(socioId: number, emitidoPor?: string) {
  const socio = await prisma.socio.findUnique({
    where: { id: socioId },
    include: { credencial: true },
  });
  if (!socio) throw new Error(`Socio ${socioId} no encontrado`);
  if (socio.estado !== "ACTIVO" && socio.estado !== "HONORARIO") {
    throw new Error(`Solo se puede emitir credencial a socios Activos o Honorarios`);
  }

  const anioActual = new Date().getFullYear();

  // Si ya tiene credencial vigente para este año, renovarla
  if (socio.credencial) {
    if (socio.credencial.anioVigencia === anioActual && socio.credencial.activa) {
      return socio.credencial; // Ya tiene credencial válida
    }
    // Actualizar año de vigencia
    return prisma.credencial.update({
      where: { socioId },
      data: {
        anioVigencia: anioActual,
        activa: true,
        emitidaEn: new Date(),
      },
      include: { socio: { select: { nombreCompleto: true, rut: true, estado: true, categoria: true } } },
    });
  }

  // Contar credenciales emitidas para generar número correlativo
  const total = await prisma.credencial.count();
  const codigo = generarCodigoCredencial(anioActual, total + 1);

  return prisma.credencial.create({
    data: {
      socioId,
      codigo,
      anioVigencia: anioActual,
      activa: true,
    },
    include: { socio: { select: { nombreCompleto: true, rut: true, estado: true, categoria: true } } },
  });
}

export async function obtenerCredencial(socioId: number) {
  return prisma.credencial.findUnique({
    where: { socioId },
    include: { socio: { select: { nombreCompleto: true, rut: true, estado: true, categoria: true } } },
  });
}

export async function verificarCredencial(codigo: string) {
  const credencial = await prisma.credencial.findUnique({
    where: { codigo },
    include: { socio: { select: { nombreCompleto: true, rut: true, estado: true, categoria: true } } },
  });

  if (!credencial) return { valida: false, razon: "Credencial no encontrada" };

  const anioActual = new Date().getFullYear();
  if (!credencial.activa) return { valida: false, razon: "Credencial inactiva", credencial };
  if (credencial.anioVigencia !== anioActual) {
    return { valida: false, razon: `Credencial vencida (vigente ${credencial.anioVigencia})`, credencial };
  }
  if (credencial.socio.estado !== "ACTIVO" && credencial.socio.estado !== "HONORARIO") {
    return { valida: false, razon: `Socio en estado ${credencial.socio.estado}`, credencial };
  }

  return { valida: true, credencial };
}

export async function listarCredenciales(anio?: number) {
  const anioFiltro = anio ?? new Date().getFullYear();
  return prisma.credencial.findMany({
    where: { anioVigencia: anioFiltro },
    include: { socio: { select: { nombreCompleto: true, rut: true, estado: true } } },
    orderBy: { emitidaEn: "desc" },
  });
}
