import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revisarReserva, cancelarReserva } from "@/lib/services/reservas";
import { handleApiError } from "@/lib/utils";

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
    const { accion, motivoRechazo, socioId } = body;

    if (accion === "cancelar") {
      const reserva = await cancelarReserva(parseInt(id), parseInt(socioId));
      return NextResponse.json(reserva);
    }

    if (accion === "aprobar" || accion === "rechazar") {
      const decision = accion === "aprobar" ? "APROBADA" : "RECHAZADA";
      const nombreUsuario = (session.user as { name?: string }).name ?? "admin";
      const reserva = await revisarReserva(parseInt(id), decision, nombreUsuario, motivoRechazo);
      return NextResponse.json(reserva);
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    const { message, status } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
