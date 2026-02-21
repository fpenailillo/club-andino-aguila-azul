import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  obtenerSocioPorId,
  actualizarSocio,
  obtenerEstadoCuentaSocio,
} from "@/lib/services/socios";
import { handleApiError } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const incluirEstado = searchParams.get("estado") === "true";

    if (incluirEstado) {
      const estadoCuenta = await obtenerEstadoCuentaSocio(parseInt(id));
      return NextResponse.json(estadoCuenta);
    }

    const socio = await obtenerSocioPorId(parseInt(id));
    return NextResponse.json(socio);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const socio = await actualizarSocio(parseInt(id), body);
    return NextResponse.json(socio);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
