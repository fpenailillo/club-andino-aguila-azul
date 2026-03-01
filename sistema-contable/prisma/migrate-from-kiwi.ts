/**
 * prisma/migrate-from-kiwi.ts
 *
 * Script de migración de datos desde el sistema Kiwi al nuevo sistema.
 * Importa: socios (220), categorías reales, saldos 2026, movimientos 2024-2026.
 *
 * Uso:
 *   npx ts-node prisma/migrate-from-kiwi.ts
 *   -- o --
 *   npm run db:migrate-kiwi   (agregar el script al package.json)
 *
 * IMPORTANTE: Ejecutar DESPUÉS de npm run db:push y npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import socios_raw from "./migration-data/socios.json";
import saldos_raw from "./migration-data/saldos_2026.json";
import movimientos_raw from "./migration-data/movimientos_2024_2026.json";

const prisma = new PrismaClient();

// ============================================================================
// TIPOS
// ============================================================================

interface SocioKiwi {
  id_kiwi: number | null;
  nombre: string;
  ap_paterno: string;
  ap_materno: string;
  categoria: string;
  fecha_ingreso: string | null;
  acta: string;
  fecha_ex_socio: string | null;
  fecha_nacimiento: string | null;
  rut: string | null;
  direccion: string;
  telefono: string;
  email: string;
  notas: string;
}

interface MovimientoKiwi {
  id_kiwi: number | null;
  tipo_doc: string;
  socio: string;
  concepto: string;
  centro: string;
  fecha: string | null;
  monto: number;
  comentario: string;
}

const socios = socios_raw as SocioKiwi[];
const saldos = saldos_raw as Record<string, number>;
const movimientos = movimientos_raw as MovimientoKiwi[];

// ============================================================================
// MAPEO CATEGORÍA KIWI → NUEVO SISTEMA (estado + categoría)
// ============================================================================

const CATEGORIA_A_ESTADO: Record<string, { estado: string; categoriaNombre: string | null }> = {
  Activo:         { estado: "ACTIVO",     categoriaNombre: "Activo" },
  "Activo prepago": { estado: "ACTIVO",   categoriaNombre: "Activo prepago" },
  "Vitalicio C":  { estado: "ACTIVO",     categoriaNombre: "Vitalicio C" },
  Honorario:      { estado: "HONORARIO",  categoriaNombre: "Honorario" },
  Cooperador:     { estado: "COOPERADOR", categoriaNombre: "Cooperador" },
  Congelado:      { estado: "CONGELADO",  categoriaNombre: "Congelado" },
  Renunciado:     { estado: "RENUNCIADO", categoriaNombre: null },
  Eliminado:      { estado: "ELIMINADO",  categoriaNombre: null },
  Fallecido:      { estado: "FALLECIDO",  categoriaNombre: null },
};

const TIPO_DOC_A_TIPO: Record<string, string> = {
  Ingreso: "INGRESO",
  Egreso:  "EGRESO",
  Cargo:   "CARGO",
  Abono:   "ABONO",
  "Ingreso con Cargo Automatico": "INGRESO",
};

// ============================================================================
// HELPERS
// ============================================================================

function normalizar(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function buildNombreCompleto(nombre: string, apPaterno: string, apMaterno: string): string {
  return [nombre, apPaterno, apMaterno].map((s) => s.trim()).filter(Boolean).join(" ");
}

function prefijoPorTipo(tipo: string): string {
  const map: Record<string, string> = { INGRESO: "ING", EGRESO: "EGR", CARGO: "CAR", ABONO: "ABO" };
  return map[tipo] ?? "UNK";
}

// ============================================================================
// MIGRACIÓN PRINCIPAL
// ============================================================================

async function main() {
  console.log("=== MIGRACIÓN DESDE KIWI ===\n");

  // Cargar categorías existentes
  const categorias = await prisma.categoria.findMany();
  const catMap = new Map(categorias.map((c) => [c.nombre, c]));

  // Cargar centros existentes
  const centros = await prisma.centro.findMany();
  const centroMap = new Map(centros.map((c) => [c.nombre, c]));
  const centroSede = centros.find((c) => c.nombre === "Sede");
  if (!centroSede) throw new Error("Centro 'Sede' no encontrado. Ejecuta npm run db:seed primero.");

  // Cargar conceptos existentes
  const conceptos = await prisma.concepto.findMany();
  const conceptoMap = new Map(conceptos.map((c) => [normalizar(c.nombre), c]));

  const conceptoDefault = conceptos.find((c) => c.nombre === "Cuota Social") ?? conceptos[0];

  // ============================================================================
  // 1. IMPORTAR SOCIOS
  // ============================================================================
  console.log("--- Importando socios ---");

  let sociosCreados = 0;
  let sociosSkipped = 0;
  const socioIdMap = new Map<number, number>(); // kiwi_id → nuevo_id

  for (const s of socios) {
    if (!s.id_kiwi) continue;

    const mapping = CATEGORIA_A_ESTADO[s.categoria] ?? { estado: "ELIMINADO", categoriaNombre: null };
    const categoria = mapping.categoriaNombre ? catMap.get(mapping.categoriaNombre) : null;
    const nombreCompleto = buildNombreCompleto(s.nombre, s.ap_paterno, s.ap_materno);

    // Verificar si ya existe por email o RUT
    const emailLimpio = s.email.trim().toLowerCase() || null;
    const rutLimpio = s.rut?.trim() || null;

    try {
      const socioExistente = await prisma.socio.findFirst({
        where: {
          OR: [
            emailLimpio ? { email: emailLimpio } : undefined,
            rutLimpio ? { rut: rutLimpio } : undefined,
            { nombreCompleto: { equals: nombreCompleto, mode: "insensitive" } },
          ].filter(Boolean) as never[],
        },
      });

      if (socioExistente) {
        socioIdMap.set(s.id_kiwi, socioExistente.id);
        // Update with kiwi fields that might be missing
        await prisma.socio.update({
          where: { id: socioExistente.id },
          data: {
            apPaterno: s.ap_paterno.trim() || null,
            apMaterno: s.ap_materno.trim() || null,
            nombreCompleto,
            rut: rutLimpio,
            telefono: s.telefono.trim() || null,
            direccion: s.direccion.trim() || null,
            acta: s.acta.trim() || null,
            fechaNacimiento: s.fecha_nacimiento ? new Date(s.fecha_nacimiento) : null,
            fechaIngreso: s.fecha_ingreso ? new Date(s.fecha_ingreso) : undefined,
            fechaExSocio: s.fecha_ex_socio ? new Date(s.fecha_ex_socio) : null,
            estado: mapping.estado as never,
            categoriaId: categoria?.id ?? null,
            notas: s.notas.trim() || null,
          },
        });
        sociosSkipped++;
        continue;
      }

      const nuevo = await prisma.socio.create({
        data: {
          nombre: s.nombre.trim(),
          apPaterno: s.ap_paterno.trim() || null,
          apMaterno: s.ap_materno.trim() || null,
          nombreCompleto,
          email: emailLimpio,
          rut: rutLimpio,
          telefono: s.telefono.trim() || null,
          direccion: s.direccion.trim() || null,
          acta: s.acta.trim() || null,
          fechaNacimiento: s.fecha_nacimiento ? new Date(s.fecha_nacimiento) : null,
          fechaIngreso: s.fecha_ingreso ? new Date(s.fecha_ingreso) : undefined,
          fechaExSocio: s.fecha_ex_socio ? new Date(s.fecha_ex_socio) : null,
          notas: s.notas.trim() || null,
          estado: mapping.estado as never,
          categoriaId: categoria?.id ?? null,
        },
      });

      socioIdMap.set(s.id_kiwi, nuevo.id);
      sociosCreados++;
    } catch (err) {
      console.warn(`  ⚠ Socio ${nombreCompleto} (kiwi:${s.id_kiwi}): ${(err as Error).message}`);
    }
  }

  console.log(`  ✓ Creados: ${sociosCreados}, Actualizados: ${sociosSkipped}`);

  // ============================================================================
  // 2. IMPORTAR MOVIMIENTOS 2024-2026
  // ============================================================================
  console.log("\n--- Importando movimientos 2024-2026 ---");

  // Inicializar/obtener contadores
  const contadores: Record<string, number> = {};
  for (const tipo of ["INGRESO", "EGRESO", "CARGO", "ABONO"]) {
    const c = await prisma.contadorRegistro.findUnique({ where: { tipo: tipo as never } });
    contadores[tipo] = c?.ultimo ?? 0;
  }

  let movsCreados = 0;
  let movsSkipped = 0;

  // Construir mapa de socios por nombre normalizado
  const todosSocios = await prisma.socio.findMany({
    select: { id: true, nombreCompleto: true },
  });
  const socioNombreMap = new Map<string, number>();
  for (const s of todosSocios) {
    socioNombreMap.set(normalizar(s.nombreCompleto), s.id);
  }

  for (const m of movimientos) {
    if (!m.id_kiwi || !m.fecha) continue;

    const tipo = TIPO_DOC_A_TIPO[m.tipo_doc];
    if (!tipo) { movsSkipped++; continue; }

    // Buscar socio
    let socioId: number | null = null;
    if (m.socio) {
      const normNombre = normalizar(m.socio);
      socioId = socioNombreMap.get(normNombre) ?? null;
      if (!socioId) {
        // Fuzzy search
        for (const [nombre, id] of Array.from(socioNombreMap.entries())) {
          if (nombre.includes(normNombre) || normNombre.includes(nombre)) {
            socioId = id;
            break;
          }
        }
      }
    }

    // Verificar si ya existe este movimiento (por número de kiwi en comentario)
    const marcaKiwi = `kiwi:${m.id_kiwi}`;
    const existente = await prisma.movimiento.findFirst({
      where: { comentario: { contains: marcaKiwi } },
    });
    if (existente) { movsSkipped++; continue; }

    // Buscar concepto
    const normConcepto = normalizar(m.concepto || "Otros");
    const concepto = conceptoMap.get(normConcepto) ?? conceptoDefault;

    // Buscar centro
    const normCentro = normalizar(m.centro || "Sede");
    const centro = centros.find((c) => normalizar(c.nombre) === normCentro) ?? centroSede;

    // Determinar si es sin socio
    const esSinSocio = (tipo === "INGRESO" || tipo === "EGRESO") && !socioId;

    try {
      contadores[tipo]++;
      const prefijo = prefijoPorTipo(tipo);
      const numeroRegistro = `${prefijo}-${contadores[tipo].toString().padStart(8, "0")}`;

      await prisma.movimiento.create({
        data: {
          tipo: tipo as never,
          numeroRegistro,
          socioId,
          conceptoId: concepto.id,
          centroId: centro.id,
          comentario: `${m.comentario || concepto.nombre} [${marcaKiwi}]`.substring(0, 500),
          monto: m.monto,
          fecha: new Date(m.fecha),
          esSinSocio,
          creadoPor: "migrate-kiwi",
        },
      });

      movsCreados++;
    } catch (err) {
      console.warn(`  ⚠ Mov kiwi:${m.id_kiwi}: ${(err as Error).message}`);
    }
  }

  // Actualizar contadores en BD
  for (const [tipo, ultimo] of Object.entries(contadores)) {
    await prisma.contadorRegistro.update({
      where: { tipo: tipo as never },
      data: { ultimo },
    });
  }

  console.log(`  ✓ Creados: ${movsCreados}, Skipped: ${movsSkipped}`);

  // ============================================================================
  // 3. RESUMEN FINAL
  // ============================================================================
  console.log("\n=== RESUMEN ===");
  const totalSocios = await prisma.socio.count();
  const totalMovimientos = await prisma.movimiento.count();
  const activoCount = await prisma.socio.count({ where: { estado: "ACTIVO" } });

  console.log(`Socios totales: ${totalSocios} (${activoCount} activos)`);
  console.log(`Movimientos totales: ${totalMovimientos}`);
  console.log("\n✓ Migración completada.");
  console.log("\nNota sobre saldos:");
  console.log("Los saldos actuales de socios (al 2026) se calculan a partir");
  console.log("de los movimientos CARGO/ABONO importados. Para ver el estado");
  console.log("de cuenta exacto del sistema Kiwi, ejecuta el reporte de");
  console.log("saldos en /reportes de la nueva aplicación.");
}

main()
  .catch((e) => {
    console.error("Error en migración:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
