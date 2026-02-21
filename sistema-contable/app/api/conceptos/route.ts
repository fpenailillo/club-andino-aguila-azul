import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo") as "INGRESO" | "EGRESO" | null;

    const conceptos = await prisma.concepto.findMany({
      where: {
        activo: true,
        ...(tipo ? { tipo } : {}),
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(conceptos);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
