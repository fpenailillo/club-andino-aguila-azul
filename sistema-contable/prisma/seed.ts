import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed...");

  // ============================================================================
  // CATEGORÍAS DE SOCIOS (extraídas del sistema origen)
  // ============================================================================
  const categoriasData = [
    { nombre: "Activo", porcentajeCuota: 100 },
    { nombre: "Activo prepago", porcentajeCuota: 88 },
    { nombre: "Vitalicio C", porcentajeCuota: 60 },
    { nombre: "Honorario", porcentajeCuota: 0 },
    { nombre: "Cooperador", porcentajeCuota: 0 },
    { nombre: "Congelado", porcentajeCuota: 0 },
  ];

  const categorias = await Promise.all(
    categoriasData.map((c) =>
      prisma.categoria.upsert({
        where: { nombre: c.nombre },
        update: { porcentajeCuota: c.porcentajeCuota },
        create: { nombre: c.nombre, porcentajeCuota: c.porcentajeCuota },
      })
    )
  );
  console.log(`Categorías creadas: ${categorias.length}`);

  const catActivo = categorias.find((c) => c.nombre === "Activo")!;

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
  // CONCEPTOS DE INGRESO (del sistema origen)
  // ============================================================================
  const conceptosIngresoData = [
    { nombre: "Cuota Social", descripcion: "Cuota mensual de socios" },
    { nombre: "Estadia en Refugio", descripcion: "Ingresos por estadías en el refugio de Farellones" },
    { nombre: "Arriendo equipo", descripcion: "Ingresos por arriendo de equipos del club" },
    { nombre: "Campamento/Tour", descripcion: "Ingresos por campamentos y tours organizados" },
    { nombre: "Rifas", descripcion: "Ingresos por rifas y sorteos" },
    { nombre: "Corp. A. Farellones", descripcion: "Aportes de la Corporación Andina de Farellones" },
    { nombre: "Activo fijo", descripcion: "Venta o disposición de activos fijos" },
    { nombre: "Biblioteca", descripcion: "Ingresos por uso de biblioteca" },
    { nombre: "FEACH credencial", descripcion: "Venta de credenciales FEACH a socios" },
    { nombre: "Otros", descripcion: "Otros ingresos (incorporaciones, donaciones, colectas)" },
  ];

  const conceptosIngreso = await Promise.all(
    conceptosIngresoData.map((c) =>
      prisma.concepto.upsert({
        where: { nombre: c.nombre },
        update: {},
        create: { nombre: c.nombre, tipo: "INGRESO", descripcion: c.descripcion },
      })
    )
  );
  console.log(`Conceptos de ingreso creados: ${conceptosIngreso.length}`);

  // ============================================================================
  // CONCEPTOS DE EGRESO (del sistema origen)
  // ============================================================================
  const conceptosEgresoData = [
    { nombre: "Luz", descripcion: "Gastos en electricidad" },
    { nombre: "Agua", descripcion: "Gastos en agua" },
    { nombre: "Gas", descripcion: "Gastos en gas" },
    { nombre: "Telefono", descripcion: "Gastos en teléfono e internet" },
    { nombre: "Aseo", descripcion: "Gastos de aseo y limpieza" },
    { nombre: "Reparaciones", descripcion: "Reparaciones y mantención de instalaciones" },
    { nombre: "Materiales Oficina", descripcion: "Insumos y materiales de oficina" },
    { nombre: "Consumibles", descripcion: "Consumibles generales" },
    { nombre: "Honorarios", descripcion: "Honorarios profesionales" },
    { nombre: "Asesorias", descripcion: "Servicios de asesoría" },
    { nombre: "Servicios", descripcion: "Otros servicios contratados" },
    { nombre: "Casino", descripcion: "Gastos del casino" },
    { nombre: "Gastos Administrativos", descripcion: "Gastos administrativos generales" },
    { nombre: "Nulo", descripcion: "Movimiento anulado" },
  ];

  const conceptosEgreso = await Promise.all(
    conceptosEgresoData.map((c) =>
      prisma.concepto.upsert({
        where: { nombre: c.nombre },
        update: {},
        create: { nombre: c.nombre, tipo: "EGRESO", descripcion: c.descripcion },
      })
    )
  );
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
    prisma.contadorRegistro.upsert({
      where: { tipo: "CARGO" },
      update: {},
      create: { tipo: "CARGO", ultimo: 0 },
    }),
    prisma.contadorRegistro.upsert({
      where: { tipo: "ABONO" },
      update: {},
      create: { tipo: "ABONO", ultimo: 0 },
    }),
  ]);
  console.log("Contadores de registro inicializados (INGRESO, EGRESO, CARGO, ABONO)");

  // ============================================================================
  // USUARIOS DEL SISTEMA
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
  const tesorero = await prisma.usuario.upsert({
    where: { email: "tesorero@club.cl" },
    update: {},
    create: {
      email: "tesorero@club.cl",
      nombre: "Tesorero",
      passwordHash,
      rol: "TESORERO",
    },
  });
  console.log(`Usuarios creados: ${admin.email}, ${tesorero.email}`);

  // ============================================================================
  // SOCIOS DE PRUEBA (refleja socios reales activos del sistema origen)
  // ============================================================================
  const sociosData = [
    { nombre: "Alejandra", apPaterno: "Matus", apMaterno: "Montero", email: "matusmontero@gmail.com", rut: "13458291-k" },
    { nombre: "Alfredo", apPaterno: "Ferran", apMaterno: "Silva", email: "aferransilva@gmail.com" },
    { nombre: "Andres", apPaterno: "Munoz", email: "amunoz.praihuan@gmail.com" },
    { nombre: "Angelica", apPaterno: "Guantiante", email: "guantiante.angelica@gmail.com" },
    { nombre: "Camila", apPaterno: "San Martin", email: "camila.sanmartin@mail.udp.cl" },
    { nombre: "Camila", apPaterno: "Carrasco", email: "camcsilvadlz@gmail.com" },
    { nombre: "Carlos", apPaterno: "Becerra", email: "carlos.becerra@gmail.com" },
    { nombre: "Carlos", apPaterno: "Nilo", email: "nilo.hormazabal@gmail.com" },
    { nombre: "Cesar", apPaterno: "Fortino", email: "fortino@fortino.cl" },
    { nombre: "Francisco", apPaterno: "Penailillo", email: "fpenailillo@club.cl" },
  ];

  const socios = await Promise.all(
    sociosData.map((s) =>
      prisma.socio.upsert({
        where: { email: s.email },
        update: {},
        create: {
          nombre: s.nombre,
          apPaterno: s.apPaterno ?? null,
          apMaterno: s.apMaterno ?? null,
          nombreCompleto: [s.nombre, s.apPaterno, s.apMaterno].filter(Boolean).join(" "),
          email: s.email,
          rut: s.rut ?? null,
          estado: "ACTIVO",
          categoriaId: catActivo.id,
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
  const conceptoReparaciones = conceptosEgreso.find((c) => c.nombre === "Reparaciones")!;
  const conceptoServicios = conceptosEgreso.find((c) => c.nombre === "Servicios")!;

  const centroSede = centros.find((c) => c.nombre === "Sede")!;
  const centroRefugio = centros.find((c) => c.nombre === "Refugio")!;

  type TipoMov = "INGRESO" | "EGRESO" | "CARGO" | "ABONO";
  const prefijo: Record<TipoMov, string> = {
    INGRESO: "ING",
    EGRESO: "EGR",
    CARGO: "CAR",
    ABONO: "ABO",
  };

  const movimientosData: Array<{
    tipo: TipoMov;
    socioId: number | null;
    conceptoId: number;
    centroId: number;
    comentario: string;
    monto: number;
    fecha: Date;
    esSinSocio: boolean;
    motivoSinSocio: string | null;
  }> = [
    // Estadía refugio (sin socio)
    {
      tipo: "INGRESO",
      socioId: null,
      conceptoId: conceptoRefugio.id,
      centroId: centroRefugio.id,
      comentario: "Estadía 2 noches fin de semana",
      monto: 20000,
      fecha: new Date("2025-07-01"),
      esSinSocio: true,
      motivoSinSocio: "REFUGIO",
    },
    // Colecta Osvaldo
    {
      tipo: "INGRESO",
      socioId: null,
      conceptoId: conceptoOtros.id,
      centroId: centroSede.id,
      comentario: "Osvaldo, Cuotas",
      monto: 15000,
      fecha: new Date("2025-07-01"),
      esSinSocio: true,
      motivoSinSocio: "COLECTA_OSVALDO",
    },
    // Egreso reparaciones
    {
      tipo: "EGRESO",
      socioId: null,
      conceptoId: conceptoReparaciones.id,
      centroId: centroRefugio.id,
      comentario: "Reparación cañerías agua caliente",
      monto: 45000,
      fecha: new Date("2025-07-08"),
      esSinSocio: false,
      motivoSinSocio: null,
    },
    // Egreso servicios
    {
      tipo: "EGRESO",
      socioId: null,
      conceptoId: conceptoServicios.id,
      centroId: centroSede.id,
      comentario: "Cuenta electricidad Julio 2025",
      monto: 35000,
      fecha: new Date("2025-07-15"),
      esSinSocio: false,
      motivoSinSocio: null,
    },
    // Cargos de cuota a socios
    ...socios.slice(0, 5).map((s) => ({
      tipo: "CARGO" as TipoMov,
      socioId: s.id,
      conceptoId: conceptoCuota.id,
      centroId: centroSede.id,
      comentario: "Cuota social Julio 2025",
      monto: 9000,
      fecha: new Date("2025-07-01"),
      esSinSocio: false,
      motivoSinSocio: null,
    })),
    // Abonos (pagos de cuota) de algunos socios
    ...socios.slice(0, 3).map((s) => ({
      tipo: "ABONO" as TipoMov,
      socioId: s.id,
      conceptoId: conceptoCuota.id,
      centroId: centroSede.id,
      comentario: "Pago cuota social Julio 2025",
      monto: 9000,
      fecha: new Date("2025-07-10"),
      esSinSocio: false,
      motivoSinSocio: null,
    })),
  ];

  for (const mov of movimientosData) {
    const tipo = mov.tipo as TipoMov;
    const contador = await prisma.contadorRegistro.update({
      where: { tipo },
      data: { ultimo: { increment: 1 } },
    });
    const num = contador.ultimo.toString().padStart(8, "0");
    const numeroRegistro = `${prefijo[tipo]}-${num}`;

    await prisma.movimiento.create({
      data: {
        ...mov,
        numeroRegistro,
        monto: mov.monto,
        creadoPor: "seed",
      },
    });
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
