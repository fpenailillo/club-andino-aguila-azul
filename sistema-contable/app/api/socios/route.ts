import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { obtenerSocios, buscarSociosQuery, crearSocio } from "@/lib/services/socios";
import { handleApiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get("busqueda") || undefined;
    const modo = searchParams.get("modo");

    if (modo === "search" && busqueda) {
      const resultados = await buscarSociosQuery(busqueda);
      return NextResponse.json(resultados);
    }

    const estadoParam = searchParams.get("estado");
    const categoriaIdParam = searchParams.get("categoriaId");

    const resultado = await obtenerSocios({
      busqueda,
      estado: estadoParam as Parameters<typeof obtenerSocios>[0]["estado"] ?? undefined,
      categoriaId: categoriaIdParam ? parseInt(categoriaIdParam) : undefined,
      pagina: searchParams.get("pagina") ? parseInt(searchParams.get("pagina")!) : 1,
      porPagina: searchParams.get("porPagina") ? parseInt(searchParams.get("porPagina")!) : 50,
    });

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
    const socio = await crearSocio(body);
    return NextResponse.json(socio, { status: 201 });
  } catch (error) {
    const { message, status } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
