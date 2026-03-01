import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const { error } = await requireRole("ADMIN", "TESORERO");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  const accion = searchParams.get("accion");
  const entidad = searchParams.get("entidad");
  const usuarioId = searchParams.get("usuarioId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const where = {
    ...(desde || hasta
      ? {
          createdAt: {
            ...(desde ? { gte: new Date(desde) } : {}),
            ...(hasta ? { lte: new Date(hasta + "T23:59:59") } : {}),
          },
        }
      : {}),
    ...(accion ? { accion: { contains: accion, mode: "insensitive" as const } } : {}),
    ...(entidad ? { entidad: { contains: entidad, mode: "insensitive" as const } } : {}),
    ...(usuarioId ? { usuarioId: parseInt(usuarioId) } : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({ logs, total, page, limit });
}
