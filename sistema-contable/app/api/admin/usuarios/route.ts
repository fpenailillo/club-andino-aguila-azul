import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { registrarAudit } from "@/lib/services/auditoria";
import bcrypt from "bcryptjs";
import { z } from "zod";

const crearUsuarioSchema = z.object({
  email: z.string().email(),
  nombre: z.string().min(2),
  rol: z.enum(["ADMIN", "TESORERO", "USUARIO", "SOCIO"]),
  password: z.string().min(6).optional(),
});

const editarUsuarioSchema = z.object({
  id: z.number(),
  rol: z.enum(["ADMIN", "TESORERO", "USUARIO", "SOCIO"]).optional(),
  activo: z.boolean().optional(),
  nombre: z.string().min(2).optional(),
});

export async function GET() {
  const { error } = await requireRole("ADMIN", "TESORERO");
  if (error) return error;

  const usuarios = await prisma.usuario.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      nombre: true,
      rol: true,
      activo: true,
      lastLogin: true,
      createdAt: true,
    },
  });

  return NextResponse.json(usuarios);
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireRole("ADMIN");
  if (error) return error;

  const body = await request.json();
  const parsed = crearUsuarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, nombre, rol, password } = parsed.data;

  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) {
    return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
  }

  const passwordHash = password ? await bcrypt.hash(password, 12) : "";

  const usuario = await prisma.usuario.create({
    data: { email, nombre, passwordHash, rol, activo: true },
    select: { id: true, email: true, nombre: true, rol: true, activo: true, createdAt: true },
  });

  await registrarAudit({
    accion: "CREAR_USUARIO",
    entidad: "Usuario",
    entidadId: usuario.id,
    detalle: { email, rol },
  });

  return NextResponse.json(usuario, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const { error, session } = await requireRole("ADMIN");
  if (error) return error;

  const body = await request.json();
  const parsed = editarUsuarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id, ...data } = parsed.data;

  // Proteger: no desactivarse a sí mismo
  if (data.activo === false && session && parseInt(session.user.id) === id) {
    return NextResponse.json({ error: "No puedes desactivarte a ti mismo" }, { status: 400 });
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data,
    select: { id: true, email: true, nombre: true, rol: true, activo: true },
  });

  await registrarAudit({
    accion: data.activo === false ? "DESACTIVAR_USUARIO" : "EDITAR_USUARIO",
    entidad: "Usuario",
    entidadId: id,
    detalle: data,
  });

  return NextResponse.json(usuario);
}
