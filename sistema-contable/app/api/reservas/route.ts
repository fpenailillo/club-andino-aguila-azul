import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { crearReserva, obtenerReservas } from "@/lib/services/reservas";
import { handleApiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const resultado = await obtenerReservas({
      estado: searchParams.get("estado") as Parameters<typeof obtenerReservas>[0]["estado"] ?? undefined,
      socioId: searchParams.get("socioId") ? parseInt(searchParams.get("socioId")!) : undefined,
      desde: searchParams.get("desde") || undefined,
      hasta: searchParams.get("hasta") || undefined,
      pagina: searchParams.get("pagina") ? parseInt(searchParams.get("pagina")!) : 1,
      porPagina: searchParams.get("porPagina") ? parseInt(searchParams.get("porPagina")!) : 20,
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
    const reserva = await crearReserva(body);
    return NextResponse.json(reserva, { status: 201 });
  } catch (error) {
    const { message, status } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
