import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { registrarAudit } from "@/lib/services/auditoria";
import { z } from "zod";

// ── Schemas ────────────────────────────────────────────────────────────────

const conceptoSchema = z.object({
  nombre: z.string().min(2),
  tipo: z.enum(["INGRESO", "EGRESO", "CARGO", "ABONO"]),
  descripcion: z.string().optional(),
});

const centroSchema = z.object({
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
});

const categoriaSchema = z.object({
  nombre: z.string().min(2),
  porcentajeCuota: z.number().min(0).max(100),
});

// ── GET — listar según ?tipo=conceptos|centros|categorias ──────────────────

export async function GET(request: NextRequest) {
  const { error } = await requireRole("ADMIN", "TESORERO");
  if (error) return error;

  const tipo = new URL(request.url).searchParams.get("tipo");

  if (tipo === "conceptos") {
    const data = await prisma.concepto.findMany({ orderBy: { nombre: "asc" } });
    return NextResponse.json(data);
  }
  if (tipo === "centros") {
    const data = await prisma.centro.findMany({ orderBy: { nombre: "asc" } });
    return NextResponse.json(data);
  }
  if (tipo === "categorias") {
    const data = await prisma.categoria.findMany({ orderBy: { nombre: "asc" } });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "tipo inválido (conceptos|centros|categorias)" }, { status: 400 });
}

// ── POST — crear ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { error } = await requireRole("ADMIN", "TESORERO");
  if (error) return error;

  const body = await request.json();
  const tipo = new URL(request.url).searchParams.get("tipo");

  if (tipo === "conceptos") {
    const parsed = conceptoSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const record = await prisma.concepto.create({ data: parsed.data });
    await registrarAudit({ accion: "CAMBIAR_CONFIGURACION", entidad: "Concepto", entidadId: record.id, detalle: { accion: "crear", nombre: parsed.data.nombre } });
    return NextResponse.json(record, { status: 201 });
  }

  if (tipo === "centros") {
    const parsed = centroSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const record = await prisma.centro.create({ data: parsed.data });
    await registrarAudit({ accion: "CAMBIAR_CONFIGURACION", entidad: "Centro", entidadId: record.id, detalle: { accion: "crear", nombre: parsed.data.nombre } });
    return NextResponse.json(record, { status: 201 });
  }

  if (tipo === "categorias") {
    const parsed = categoriaSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const record = await prisma.categoria.create({ data: parsed.data });
    await registrarAudit({ accion: "CAMBIAR_CONFIGURACION", entidad: "Categoria", entidadId: record.id, detalle: { accion: "crear", nombre: parsed.data.nombre } });
    return NextResponse.json(record, { status: 201 });
  }

  return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
}

// ── PUT — editar (activar/desactivar o renombrar) ──────────────────────────

export async function PUT(request: NextRequest) {
  const { error } = await requireRole("ADMIN", "TESORERO");
  if (error) return error;

  const body = await request.json();
  const tipo = new URL(request.url).searchParams.get("tipo");
  const { id, ...data } = body;

  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  if (tipo === "conceptos") {
    const record = await prisma.concepto.update({ where: { id }, data });
    await registrarAudit({ accion: "CAMBIAR_CONFIGURACION", entidad: "Concepto", entidadId: id, detalle: { accion: "editar", cambios: data } });
    return NextResponse.json(record);
  }

  if (tipo === "centros") {
    const record = await prisma.centro.update({ where: { id }, data });
    await registrarAudit({ accion: "CAMBIAR_CONFIGURACION", entidad: "Centro", entidadId: id, detalle: { accion: "editar", cambios: data } });
    return NextResponse.json(record);
  }

  if (tipo === "categorias") {
    const record = await prisma.categoria.update({ where: { id }, data });
    await registrarAudit({ accion: "CAMBIAR_CONFIGURACION", entidad: "Categoria", entidadId: id, detalle: { accion: "editar", cambios: data } });
    return NextResponse.json(record);
  }

  return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
}
