import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

type RolPermitido = "ADMIN" | "TESORERO" | "USUARIO" | "SOCIO";

/**
 * Valida que la sesión activa tenga uno de los roles permitidos.
 * Uso en API routes:
 *   const { error, session } = await requireRole("ADMIN", "TESORERO");
 *   if (error) return error;
 */
export async function requireRole(...roles: RolPermitido[]) {
  const session = await auth();

  if (!session) {
    return {
      error: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
      session: null,
    };
  }

  if (!roles.includes(session.user.role as RolPermitido)) {
    return {
      error: NextResponse.json({ error: "Sin permisos suficientes" }, { status: 403 }),
      session: null,
    };
  }

  return { error: null, session };
}
