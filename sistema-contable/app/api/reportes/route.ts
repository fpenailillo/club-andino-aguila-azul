import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { obtenerMovimientos } from "@/lib/services/movimientos";
import { handleApiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);

    const filtros = {
      tipo: (searchParams.get("tipo") as "INGRESO" | "EGRESO") || undefined,
      socioId: searchParams.get("socioId")
        ? parseInt(searchParams.get("socioId")!)
        : undefined,
      conceptoId: searchParams.get("conceptoId")
        ? parseInt(searchParams.get("conceptoId")!)
        : undefined,
      centroId: searchParams.get("centroId")
        ? parseInt(searchParams.get("centroId")!)
        : undefined,
      fechaDesde: searchParams.get("fechaDesde") || undefined,
      fechaHasta: searchParams.get("fechaHasta") || undefined,
      pagina: 1,
      porPagina: 1000, // Para reportes, traer más registros
      ordenPor: "fecha",
      orden: "desc" as const,
    };

    const resultado = await obtenerMovimientos(filtros);

    return NextResponse.json({
      movimientos: resultado.movimientos,
      totales: resultado.totales,
      total: resultado.total,
      filtros,
    });
  } catch (error) {
    const { message, status } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
