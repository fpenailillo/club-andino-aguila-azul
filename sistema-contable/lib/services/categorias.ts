import { prisma } from "@/lib/prisma";

export async function obtenerCategorias(soloActivas = true) {
  return prisma.categoria.findMany({
    where: soloActivas ? { activo: true } : undefined,
    orderBy: [{ porcentajeCuota: "desc" }, { nombre: "asc" }],
    include: {
      _count: { select: { socios: true } },
    },
  });
}

export async function obtenerCategoriaPorId(id: number) {
  const cat = await prisma.categoria.findUnique({
    where: { id },
    include: { _count: { select: { socios: true } } },
  });
  if (!cat) throw new Error(`Categoría ${id} no encontrada`);
  return cat;
}
