import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export type AccionAudit =
  | "CREAR_MOVIMIENTO"
  | "EDITAR_MOVIMIENTO"
  | "ELIMINAR_MOVIMIENTO"
  | "CREAR_SOCIO"
  | "EDITAR_SOCIO"
  | "APROBAR_RESERVA"
  | "RECHAZAR_RESERVA"
  | "CREAR_RESERVA"
  | "CANCELAR_RESERVA"
  | "EMITIR_CREDENCIAL"
  | "CREAR_USUARIO"
  | "EDITAR_USUARIO"
  | "DESACTIVAR_USUARIO"
  | "CAMBIAR_CONFIGURACION"
  | "LOGIN"
  | "LOGIN_MAGIC_LINK";

export async function registrarAudit(params: {
  accion: AccionAudit;
  entidad: string;
  entidadId?: number;
  detalle?: Record<string, unknown>;
  ip?: string;
  usuarioOverride?: { id?: number; nombre: string };
}) {
  const session = await auth();

  const usuarioId =
    params.usuarioOverride?.id ??
    (session?.user?.id ? parseInt(session.user.id) : null);
  const usuarioNombre =
    params.usuarioOverride?.nombre ?? session?.user?.name ?? "Sistema";

  await prisma.auditLog.create({
    data: {
      accion: params.accion,
      entidad: params.entidad,
      entidadId: params.entidadId ?? null,
      detalle: params.detalle ? JSON.stringify(params.detalle) : null,
      usuarioId,
      usuarioNombre,
      ip: params.ip ?? null,
    },
  });
}
