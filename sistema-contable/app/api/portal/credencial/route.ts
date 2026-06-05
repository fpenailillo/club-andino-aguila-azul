import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

export async function GET() {
  const { error, session } = await requireRole("SOCIO");
  if (error) return error;

  const socioId = session!.user.socioId;
  if (!socioId) {
    return NextResponse.json({ error: "Socio no vinculado" }, { status: 404 });
  }

  const credencial = await prisma.credencial.findUnique({
    where: { socioId },
  });

  const socio = await prisma.socio.findUnique({
    where: { id: socioId },
    select: {
      nombreCompleto: true,
      estado: true,
      categoria: { select: { nombre: true } },
    },
  });

  return NextResponse.json({ credencial, socio });
}
