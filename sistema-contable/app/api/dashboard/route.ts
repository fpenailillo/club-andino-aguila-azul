import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  obtenerEstadisticasMes,
  obtenerEvolucionMensual,
  obtenerDistribucionPorConcepto,
  obtenerMovimientos,
} from "@/lib/services/movimientos";
import { obtenerResumenSocios } from "@/lib/services/socios";
import { handleApiError } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const [
      estadisticasMes,
      evolucionMensual,
      distribucionIngresos,
      resumenSocios,
      ultimosMovimientos,
    ] = await Promise.all([
      obtenerEstadisticasMes(),
      obtenerEvolucionMensual(6),
      obtenerDistribucionPorConcepto("INGRESO"),
      obtenerResumenSocios(),
      obtenerMovimientos({ pagina: 1, porPagina: 10, ordenPor: "fecha", orden: "desc" }),
    ]);

    return NextResponse.json({
      estadisticasMes,
      evolucionMensual,
      distribucionIngresos,
      resumenSocios,
      ultimosMovimientos: ultimosMovimientos.movimientos,
    });
  } catch (error) {
    const { message, status } = handleApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
