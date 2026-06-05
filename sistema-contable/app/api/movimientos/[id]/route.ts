import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  obtenerMovimientoPorId,
  actualizarMovimiento,
  eliminarMovimiento,
} from "@/lib/services/movimientos";
import { handleApiError } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const movimiento = await obtenerMovimientoPorId(parseInt(id));
    return NextResponse.json(movimiento);
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

    const movimiento = await actualizarMovimiento(parseInt(id), {
      ...body,
      modificadoPor: session.user?.email ?? undefined,
    });

    return NextResponse.json(movimiento);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await eliminarMovimiento(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
