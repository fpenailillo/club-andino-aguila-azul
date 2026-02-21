import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/utils";

export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const centros = await prisma.centro.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(centros);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
