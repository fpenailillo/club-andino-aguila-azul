import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed...");

  // ============================================================================
  // CENTROS
  // ============================================================================
  const centros = await Promise.all([
    prisma.centro.upsert({
      where: { nombre: "Sede" },
      update: {},
      create: { nombre: "Sede", descripcion: "Sede central del club en Santiago" },
    }),
    prisma.centro.upsert({
      where: { nombre: "Refugio" },
      update: {},
      create: { nombre: "Refugio", descripcion: "Refugio en Farellones, Valle Nevado (2.400 msnm)" },
    }),
    prisma.centro.upsert({
      where: { nombre: "Oficina" },
      update: {},
      create: { nombre: "Oficina", descripcion: "Oficina administrativa" },
    }),
    prisma.centro.upsert({
      where: { nombre: "Casino" },
      update: {},
      create: { nombre: "Casino", descripcion: "Casino del club" },
    }),
  ]);
  console.log(`Centros creados: ${centros.length}`);

  // ============================================================================
  // CONCEPTOS DE INGRESO
  // ============================================================================
  const conceptosIngreso = await Promise.all([
    prisma.concepto.upsert({
      where: { nombre: "Cuota Social" },
      update: {},
      create: {
        nombre: "Cuota Social",
        tipo: "INGRESO",
        descripcion: "Cuota mensual de socios (~$8.500/mes)",
      },
    }),
    prisma.concepto.upsert({
      where: { nombre: "Estadia en Refugio" },
      update: {},
      create: {
        nombre: "Estadia en Refugio",
        tipo: "INGRESO",
        descripcion: "Ingresos por estadías en el refugio de Farellones",
      },
    }),
    prisma.concepto.upsert({
      where: { nombre: "Otros" },
      update: {},
      create: {
        nombre: "Otros",
        tipo: "INGRESO",
        descripcion: "Otros ingresos (incorporaciones, donaciones, colectas)",
      },
    }),
    prisma.concepto.upsert({
      where: { nombre: "Activo fijo" },
      update: {},
      create: {
        nombre: "Activo fijo",
        tipo: "INGRESO",
        descripcion: "Venta o disposición de activos fijos",
      },
    }),
    prisma.concepto.upsert({
      where: { nombre: "Arriendo equipo" },
      update: {},
      create: {
        nombre: "Arriendo equipo",
        tipo: "INGRESO",
        descripcion: "Ingresos por arriendo de equipos del club",
      },
    }),
  ]);
  console.log(`Conceptos de ingreso creados: ${conceptosIngreso.length}`);

  // ============================================================================
  // CONCEPTOS DE EGRESO
  // ============================================================================
  const conceptosEgreso = await Promise.all([
    prisma.concepto.upsert({
      where: { nombre: "Mantención Refugio" },
      update: {},
      create: {
        nombre: "Mantención Refugio",
        tipo: "EGRESO",
        descripcion: "Gastos de mantención del refugio en Farellones",
      },
    }),
    prisma.concepto.upsert({
      where: { nombre: "Servicios" },
      update: {},
      create: {
        nombre: "Servicios",
        tipo: "EGRESO",
        descripcion: "Agua, luz, gas, internet y otros servicios",
      },
    }),
    prisma.concepto.upsert({
      where: { nombre: "Seguros" },
      update: {},
      create: {
        nombre: "Seguros",
        tipo: "EGRESO",
        descripcion: "Seguros del club, socios y equipos",
      },
    }),
    prisma.concepto.upsert({
      where: { nombre: "Eventos y Actividades" },
      update: {},
      create: {
        nombre: "Eventos y Actividades",
        tipo: "EGRESO",
        descripcion: "Gastos en eventos, salidas y actividades del club",
      },
    }),
    prisma.concepto.upsert({
      where: { nombre: "Gastos Administrativos" },
      update: {},
      create: {
        nombre: "Gastos Administrativos",
        tipo: "EGRESO",
        descripcion: "Gastos administrativos generales",
      },
    }),
  ]);
  console.log(`Conceptos de egreso creados: ${conceptosEgreso.length}`);

  // ============================================================================
  // CONTADORES DE REGISTRO
  // ============================================================================
  await Promise.all([
    prisma.contadorRegistro.upsert({
      where: { tipo: "INGRESO" },
      update: {},
      create: { tipo: "INGRESO", ultimo: 0 },
    }),
    prisma.contadorRegistro.upsert({
      where: { tipo: "EGRESO" },
      update: {},
      create: { tipo: "EGRESO", ultimo: 0 },
    }),
  ]);
  console.log("Contadores de registro inicializados");

  // ============================================================================
  // USUARIO ADMIN
  // ============================================================================
  const passwordHash = await bcrypt.hash("cambiar_en_produccion", 12);
  const admin = await prisma.usuario.upsert({
    where: { email: "admin@club.cl" },
    update: {},
    create: {
      email: "admin@club.cl",
      nombre: "Administrador",
      passwordHash,
      rol: "ADMIN",
    },
  });
  console.log(`Usuario admin creado: ${admin.email}`);

  // ============================================================================
  // SOCIOS DE PRUEBA
  // ============================================================================
  const sociosData = [
    { nombre: "Pablo", apellido: "Crisostomo", email: "pablo@club.cl" },
    { nombre: "Lidia", apellido: "Gonzalez", email: "lidia@club.cl" },
    { nombre: "Emilio", apellido: "Nilo", email: "emilio@club.cl" },
    { nombre: "Jorge", apellido: "González", email: "jorge@club.cl" },
    { nombre: "María Magdalena", apellido: "San Martin", email: "maria@club.cl" },
    { nombre: "Carlos", apellido: "Pérez", email: "carlos@club.cl" },
    { nombre: "Ana", apellido: "López", email: "ana@club.cl" },
    { nombre: "Roberto", apellido: "Muñoz", email: "roberto@club.cl" },
  ];

  const socios = await Promise.all(
    sociosData.map((s) =>
      prisma.socio.upsert({
        where: { email: s.email },
        update: {},
        create: {
          nombre: s.nombre,
          apellido: s.apellido,
          nombreCompleto: `${s.nombre} ${s.apellido}`,
          email: s.email,
          estado: "ACTIVO",
        },
      })
    )
  );
  console.log(`Socios creados: ${socios.length}`);

  // ============================================================================
  // MOVIMIENTOS DE EJEMPLO
  // ============================================================================
  const conceptoCuota = conceptosIngreso.find((c) => c.nombre === "Cuota Social")!;
  const conceptoRefugio = conceptosIngreso.find((c) => c.nombre === "Estadia en Refugio")!;
  const conceptoOtros = conceptosIngreso.find((c) => c.nombre === "Otros")!;
  const conceptoMantencion = conceptosEgreso.find((c) => c.nombre === "Mantención Refugio")!;
  const conceptoServicios = conceptosEgreso.find((c) => c.nombre === "Servicios")!;

  const centroSede = centros.find((c) => c.nombre === "Sede")!;
  const centroRefugio = centros.find((c) => c.nombre === "Refugio")!;

  const socio1 = socios[0]; // Pablo Crisostomo
  const socio2 = socios[1]; // Lidia Gonzalez
  const socio3 = socios[2]; // Emilio Nilo

  // Obtener contadores actuales
  let contadorIngreso = await prisma.contadorRegistro.findUnique({
    where: { tipo: "INGRESO" },
  });
  let contadorEgreso = await prisma.contadorRegistro.findUnique({
    where: { tipo: "EGRESO" },
  });

  const movimientosData = [
    // Ingreso Refugio (sin socio)
    {
      tipo: "INGRESO" as const,
      socioId: null,
      conceptoId: conceptoRefugio.id,
      centroId: centroRefugio.id,
      comentario: "Estadía 2 noches - Pablo Crisostomo",
      monto: 10000,
      fecha: new Date("2025-07-01"),
      esSinSocio: true,
      motivoSinSocio: "REFUGIO",
    },
    // Colecta Osvaldo (sin socio)
    {
      tipo: "INGRESO" as const,
      socioId: null,
      conceptoId: conceptoOtros.id,
      centroId: centroSede.id,
      comentario: "Osvaldo, Cuotas",
      monto: 15000,
      fecha: new Date("2025-07-01"),
      esSinSocio: true,
      motivoSinSocio: "COLECTA_OSVALDO",
    },
    // Cuota Social Lidia
    {
      tipo: "INGRESO" as const,
      socioId: socio2.id,
      conceptoId: conceptoCuota.id,
      centroId: centroSede.id,
      comentario: "Cuota mensual Julio 2025",
      monto: 8500,
      fecha: new Date("2025-07-01"),
      esSinSocio: false,
      motivoSinSocio: null,
    },
    // Cuota Social Pablo
    {
      tipo: "INGRESO" as const,
      socioId: socio1.id,
      conceptoId: conceptoCuota.id,
      centroId: centroSede.id,
      comentario: "Cuota mensual Julio 2025",
      monto: 8500,
      fecha: new Date("2025-07-05"),
      esSinSocio: false,
      motivoSinSocio: null,
    },
    // Cuota Social Emilio
    {
      tipo: "INGRESO" as const,
      socioId: socio3.id,
      conceptoId: conceptoCuota.id,
      centroId: centroSede.id,
      comentario: "Cuota mensual Julio 2025",
      monto: 8500,
      fecha: new Date("2025-07-10"),
      esSinSocio: false,
      motivoSinSocio: null,
    },
    // Refugio fin de semana
    {
      tipo: "INGRESO" as const,
      socioId: null,
      conceptoId: conceptoRefugio.id,
      centroId: centroRefugio.id,
      comentario: "Estadía fin de semana - Grupo de socios",
      monto: 25000,
      fecha: new Date("2025-07-12"),
      esSinSocio: true,
      motivoSinSocio: "REFUGIO",
    },
    // Egreso mantención
    {
      tipo: "EGRESO" as const,
      socioId: null,
      conceptoId: conceptoMantencion.id,
      centroId: centroRefugio.id,
      comentario: "Reparación cañerías agua caliente",
      monto: 45000,
      fecha: new Date("2025-07-08"),
      esSinSocio: false,
      motivoSinSocio: null,
    },
    // Egreso servicios
    {
      tipo: "EGRESO" as const,
      socioId: null,
      conceptoId: conceptoServicios.id,
      centroId: centroSede.id,
      comentario: "Cuenta electricidad Julio 2025",
      monto: 35000,
      fecha: new Date("2025-07-15"),
      esSinSocio: false,
      motivoSinSocio: null,
    },
  ];

  for (const mov of movimientosData) {
    if (mov.tipo === "INGRESO") {
      contadorIngreso = await prisma.contadorRegistro.update({
        where: { tipo: "INGRESO" },
        data: { ultimo: { increment: 1 } },
      });
      const num = contadorIngreso.ultimo.toString().padStart(8, "0");
      const numeroRegistro = `ING-${num}`;

      await prisma.movimiento.create({
        data: {
          ...mov,
          numeroRegistro,
          monto: mov.monto,
          creadoPor: "seed",
        },
      });
    } else {
      contadorEgreso = await prisma.contadorRegistro.update({
        where: { tipo: "EGRESO" },
        data: { ultimo: { increment: 1 } },
      });
      const num = contadorEgreso.ultimo.toString().padStart(8, "0");
      const numeroRegistro = `EGR-${num}`;

      await prisma.movimiento.create({
        data: {
          ...mov,
          numeroRegistro,
          monto: mov.monto,
          creadoPor: "seed",
        },
      });
    }
  }

  console.log(`Movimientos de ejemplo creados: ${movimientosData.length}`);
  console.log("Seed completado exitosamente!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
