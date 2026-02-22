import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { obtenerCategorias } from "@/lib/services/categorias";
import { handleApiError } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const categorias = await obtenerCategorias();
    return NextResponse.json(categorias);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
