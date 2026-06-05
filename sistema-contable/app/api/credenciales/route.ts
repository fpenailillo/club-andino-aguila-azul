import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { emitirCredencial, listarCredenciales, verificarCredencial } from "@/lib/services/credenciales";
import { handleApiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const codigo = searchParams.get("codigo");
    const anio = searchParams.get("anio") ? parseInt(searchParams.get("anio")!) : undefined;

    if (codigo) {
      const resultado = await verificarCredencial(codigo);
      return NextResponse.json(resultado);
    }

    const credenciales = await listarCredenciales(anio);
    return NextResponse.json(credenciales);
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
    const { socioId } = body;
    if (!socioId) return NextResponse.json({ error: "socioId requerido" }, { status: 400 });

    const credencial = await emitirCredencial(
      parseInt(socioId),
      (session.user as { name?: string }).name ?? undefined
    );
    return NextResponse.json(credencial, { status: 201 });
  } catch (error) {
    const { message, status } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
