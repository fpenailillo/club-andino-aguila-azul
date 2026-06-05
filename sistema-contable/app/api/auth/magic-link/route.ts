import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMagicLinkEmail } from "@/lib/services/email";
import { randomBytes } from "crypto";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

// Mensaje genérico para no revelar si el email existe
const RESPUESTA_GENERICA = {
  message: "Si tu email está registrado, recibirás un enlace de acceso en los próximos minutos.",
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const { email } = parsed.data;

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // Silenciosamente ignorar si no existe o no es SOCIO activo
  if (!usuario || usuario.rol !== "SOCIO" || !usuario.activo) {
    return NextResponse.json(RESPUESTA_GENERICA);
  }

  // Generar token seguro
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

  await prisma.magicLinkToken.create({
    data: { token, email, expiresAt },
  });

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const magicUrl = `${baseUrl}/portal/verify?token=${token}`;

  try {
    await sendMagicLinkEmail(email, usuario.nombre, magicUrl);
  } catch (err) {
    console.error("Error enviando magic link email:", err);
    // No revelar el error al cliente
  }

  return NextResponse.json(RESPUESTA_GENERICA);
}
