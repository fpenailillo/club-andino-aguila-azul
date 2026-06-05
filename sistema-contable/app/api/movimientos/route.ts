import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  crearMovimiento,
  obtenerMovimientos,
  filtrosMovimientosSchema,
} from "@/lib/services/movimientos";
import { handleApiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);

    const filtros = filtrosMovimientosSchema.parse({
      tipo: searchParams.get("tipo") || undefined,
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
      busqueda: searchParams.get("busqueda") || undefined,
      pagina: searchParams.get("pagina")
        ? parseInt(searchParams.get("pagina")!)
        : 1,
      porPagina: searchParams.get("porPagina")
        ? parseInt(searchParams.get("porPagina")!)
        : 20,
      ordenPor: searchParams.get("ordenPor") || "fecha",
      orden: (searchParams.get("orden") as "asc" | "desc") || "desc",
    });

    const resultado = await obtenerMovimientos(filtros);
    return NextResponse.json(resultado);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const movimiento = await crearMovimiento({
      ...body,
      creadoPor: session.user?.email ?? undefined,
    });

    return NextResponse.json(
      {
        success: true,
        numeroRegistro: movimiento.numeroRegistro,
        data: movimiento,
      },
      { status: 201 }
    );
  } catch (error) {
    const { message, status } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
