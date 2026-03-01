/**
 * Script: create-socio-users
 * Crea usuarios de portal (rol SOCIO) para los socios activos que tienen email
 * y vincula cada socio con su usuario correspondiente (usuarioId).
 *
 * Uso: npm run db:create-socio-users
 * Es idempotente: puede ejecutarse múltiples veces sin duplicar datos.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Creando usuarios SOCIO ===\n");

  const sociosSinUsuario = await prisma.socio.findMany({
    where: {
      email: { not: null },
      estado: { in: ["ACTIVO", "HONORARIO", "COOPERADOR"] },
      usuarioId: null,
    },
    select: { id: true, email: true, nombreCompleto: true, estado: true },
  });

  console.log(`Socios activos con email y sin usuario: ${sociosSinUsuario.length}`);

  let creados = 0;
  let vinculados = 0;
  let omitidos = 0;

  for (const socio of sociosSinUsuario) {
    if (!socio.email) continue;

    // Verificar si ya existe un usuario con ese email
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: socio.email },
    });

    if (usuarioExistente) {
      // Solo vincular si aún no está vinculado a este socio
      if (usuarioExistente.rol !== "SOCIO") {
        console.log(
          `  [OMITIDO] ${socio.email} — ya existe con rol ${usuarioExistente.rol}`
        );
        omitidos++;
        continue;
      }

      await prisma.socio.update({
        where: { id: socio.id },
        data: { usuarioId: usuarioExistente.id },
      });
      console.log(`  [VINCULADO] ${socio.email} → usuarioId=${usuarioExistente.id}`);
      vinculados++;
    } else {
      // Crear nuevo usuario SOCIO
      const usuario = await prisma.usuario.create({
        data: {
          email: socio.email,
          nombre: socio.nombreCompleto,
          passwordHash: "", // No necesita contraseña — usa magic link
          rol: "SOCIO",
          activo: true,
        },
      });

      await prisma.socio.update({
        where: { id: socio.id },
        data: { usuarioId: usuario.id },
      });

      console.log(`  [CREADO]   ${socio.email} → usuarioId=${usuario.id}`);
      creados++;
    }
  }

  console.log(`
=== Resumen ===
Creados:   ${creados}
Vinculados: ${vinculados}
Omitidos:  ${omitidos}
Total:     ${sociosSinUsuario.length}
`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
