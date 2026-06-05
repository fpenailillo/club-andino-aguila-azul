/**
 * lib/reglas-negocio.ts
 *
 * Todas las reglas de negocio del sistema contable Club Andino Águila Azul.
 * Este módulo implementa las reglas críticas descritas en el documento de contexto.
 */

// ============================================================================
// CONSTANTES
// ============================================================================

export const CONCEPTOS_INGRESO = {
  CUOTA_SOCIAL: "Cuota Social",
  ESTADIA_REFUGIO: "Estadia en Refugio",
  OTROS: "Otros",
  ACTIVO_FIJO: "Activo fijo",
  ARRIENDO_EQUIPO: "Arriendo equipo",
} as const;

export const CENTROS = {
  SEDE: "Sede",
  REFUGIO: "Refugio",
  OFICINA: "Oficina",
  CASINO: "Casino",
} as const;

export type MotivoSinSocio = "REFUGIO" | "COLECTA_OSVALDO";

// ============================================================================
// REGLA #1: ASIGNACIÓN DE SOCIOS
// ============================================================================

/**
 * Determina si un movimiento debe asignarse a un socio.
 *
 * CRÍTICO:
 * - Refugio: NUNCA asignar a socio
 * - Colecta Osvaldo: NUNCA asignar a socio
 * - Todo lo demás: SIEMPRE asignar
 */
export function debeAsignarSocio(concepto: string, motivo: string): boolean {
  const conceptoNorm = concepto.trim();
  const motivoNorm = motivo.toLowerCase().trim();

  // REFUGIO: Nunca asignar
  if (conceptoNorm === CONCEPTOS_INGRESO.ESTADIA_REFUGIO) {
    return false;
  }

  // COLECTA OSVALDO: Nunca asignar
  if (
    conceptoNorm === CONCEPTOS_INGRESO.OTROS &&
    motivoNorm.includes("osvaldo")
  ) {
    return false;
  }

  // RESTO: Siempre asignar
  return true;
}

/**
 * Obtiene el motivo por el cual no se asigna socio a un movimiento.
 */
export function getMotivoSinSocio(
  concepto: string,
  motivo: string
): MotivoSinSocio | null {
  const conceptoNorm = concepto.trim();
  const motivoNorm = motivo.toLowerCase().trim();

  if (conceptoNorm === CONCEPTOS_INGRESO.ESTADIA_REFUGIO) {
    return "REFUGIO";
  }

  if (
    conceptoNorm === CONCEPTOS_INGRESO.OTROS &&
    motivoNorm.includes("osvaldo")
  ) {
    return "COLECTA_OSVALDO";
  }

  return null;
}

// ============================================================================
// REGLA #2: DETERMINACIÓN AUTOMÁTICA DE CENTRO
// ============================================================================

/**
 * Determina el centro de costo según el concepto.
 * - Estadía en Refugio → Centro: Refugio
 * - Todo lo demás → Centro: Sede
 */
export function determinarCentro(concepto: string): string {
  const conceptoNorm = concepto.trim();

  if (conceptoNorm === CONCEPTOS_INGRESO.ESTADIA_REFUGIO) {
    return CENTROS.REFUGIO;
  }

  return CENTROS.SEDE;
}

// ============================================================================
// REGLA #3: BÚSQUEDA TOLERANTE DE SOCIOS
// ============================================================================

/**
 * Normaliza un nombre para búsqueda:
 * - Remueve tildes/diacríticos
 * - Convierte a minúsculas
 * - Normaliza espacios múltiples
 */
export function normalizarNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Compara dos nombres con tolerancia a diferencias.
 * Retorna un score de 0.0 (sin match) a 1.0 (match exacto).
 *
 * Estrategias (en orden de prioridad):
 * 1. Match exacto normalizado → 1.0
 * 2. Uno contiene al otro → 0.8
 * 3. Match por palabras clave → proporcional × 0.7
 */
export function compararNombres(nombre1: string, nombre2: string): number {
  const n1 = normalizarNombre(nombre1);
  const n2 = normalizarNombre(nombre2);

  // Match exacto
  if (n1 === n2) return 1.0;

  // Contención (uno contiene al otro)
  if (n1.includes(n2) || n2.includes(n1)) return 0.8;

  // Match por palabras
  const palabras1 = n1.split(" ").filter((p) => p.length > 1);
  const palabras2 = n2.split(" ").filter((p) => p.length > 1);

  const comunes = palabras1.filter((p1) =>
    palabras2.some(
      (p2) => p1 === p2 || p1.includes(p2) || p2.includes(p1)
    )
  );

  if (comunes.length > 0) {
    return (
      (comunes.length / Math.max(palabras1.length, palabras2.length)) * 0.7
    );
  }

  return 0;
}

export interface ResultadoBusqueda<T> {
  socio: T;
  score: number;
  esMatchExacto: boolean;
  esMatchParcial: boolean;
}

/**
 * Busca el mejor match de socio con tolerancia a errores.
 * Retorna null si no hay match con score >= umbralMinimo (default: 0.7).
 */
export function buscarSocio<T extends { nombreCompleto: string }>(
  nombreBuscado: string,
  socios: T[],
  umbralMinimo = 0.7
): T | null {
  let mejorMatch: T | null = null;
  let mejorScore = 0;

  for (const socio of socios) {
    const score = compararNombres(nombreBuscado, socio.nombreCompleto);

    if (score > mejorScore && score >= umbralMinimo) {
      mejorScore = score;
      mejorMatch = socio;
    }
  }

  return mejorMatch;
}

/**
 * Busca múltiples candidatos de socios con sus scores.
 * Útil para mostrar opciones al usuario.
 */
export function buscarSociosCandidatos<T extends { nombreCompleto: string }>(
  nombreBuscado: string,
  socios: T[],
  umbralMinimo = 0.5,
  maxResultados = 5
): ResultadoBusqueda<T>[] {
  const resultados: ResultadoBusqueda<T>[] = [];

  for (const socio of socios) {
    const score = compararNombres(nombreBuscado, socio.nombreCompleto);

    if (score >= umbralMinimo) {
      resultados.push({
        socio,
        score,
        esMatchExacto: score >= 0.95,
        esMatchParcial: score >= 0.7 && score < 0.95,
      });
    }
  }

  return resultados
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResultados);
}

// ============================================================================
// REGLA #4: VALIDACIONES
// ============================================================================

export interface ResultadoValidacion {
  valido: boolean;
  error?: string;
}

export function validarMonto(monto: number): ResultadoValidacion {
  if (isNaN(monto) || monto <= 0) {
    return { valido: false, error: "El monto debe ser mayor a 0" };
  }

  if (monto > 999_999_999.99) {
    return { valido: false, error: "El monto excede el máximo permitido ($999.999.999)" };
  }

  return { valido: true };
}

export function validarFecha(fecha: Date): ResultadoValidacion {
  const ahora = new Date();

  if (fecha > ahora) {
    return { valido: false, error: "La fecha no puede ser futura" };
  }

  const hace10Anos = new Date();
  hace10Anos.setFullYear(hace10Anos.getFullYear() - 10);

  if (fecha < hace10Anos) {
    return {
      valido: false,
      error: "La fecha no puede ser anterior a 10 años",
    };
  }

  return { valido: true };
}

export function validarSocioRequerido(
  socioId: number | null | undefined,
  concepto: string,
  motivo: string
): ResultadoValidacion {
  const debeAsignar = debeAsignarSocio(concepto, motivo);

  if (debeAsignar && !socioId) {
    return {
      valido: false,
      error: "Este tipo de movimiento requiere asignar un socio",
    };
  }

  if (!debeAsignar && socioId) {
    return {
      valido: false,
      error: "Este tipo de movimiento NO debe asignarse a un socio (Refugio o Colecta Osvaldo)",
    };
  }

  return { valido: true };
}

// ============================================================================
// REGLA #5: GENERACIÓN DE NÚMEROS DE REGISTRO
// ============================================================================

const PREFIJOS_TIPO = {
  INGRESO: "ING",
  EGRESO: "EGR",
  CARGO: "CAR",
  ABONO: "ABO",
} as const;

/**
 * Genera un número de registro formateado.
 * Formatos: "ING-00019632", "EGR-00003421", "CAR-00001234", "ABO-00000567"
 */
export function generarNumeroRegistro(
  tipo: "INGRESO" | "EGRESO" | "CARGO" | "ABONO",
  numero: number
): string {
  const prefijo = PREFIJOS_TIPO[tipo];
  const numPadded = numero.toString().padStart(8, "0");
  return `${prefijo}-${numPadded}`;
}

/**
 * Los CARGO y ABONO siempre deben asignarse a un socio.
 */
export function tipoRequiereSocio(tipo: "INGRESO" | "EGRESO" | "CARGO" | "ABONO"): boolean {
  return tipo === "CARGO" || tipo === "ABONO";
}

// ============================================================================
// REGLA #6: MAPEO DE CONCEPTOS DESDE EXCEL
// ============================================================================

export const MAPEO_CONCEPTOS: Record<string, string> = {
  Cuotas: CONCEPTOS_INGRESO.CUOTA_SOCIAL,
  Cuota: CONCEPTOS_INGRESO.CUOTA_SOCIAL,
  "Cuota Social": CONCEPTOS_INGRESO.CUOTA_SOCIAL,
  "Cuotas (2x)": CONCEPTOS_INGRESO.CUOTA_SOCIAL,
  "Cuotas (3x)": CONCEPTOS_INGRESO.CUOTA_SOCIAL,
  Refugio: CONCEPTOS_INGRESO.ESTADIA_REFUGIO,
  "Refugio (2N)": CONCEPTOS_INGRESO.ESTADIA_REFUGIO,
  "Refugio (3N)": CONCEPTOS_INGRESO.ESTADIA_REFUGIO,
  "Estadia en Refugio": CONCEPTOS_INGRESO.ESTADIA_REFUGIO,
  Incorporación: CONCEPTOS_INGRESO.CUOTA_SOCIAL,
  Incorporacion: CONCEPTOS_INGRESO.CUOTA_SOCIAL,
  Otro: CONCEPTOS_INGRESO.OTROS,
  Otros: CONCEPTOS_INGRESO.OTROS,
  Osvaldo: CONCEPTOS_INGRESO.OTROS,
};

export function mapearConcepto(conceptoExcel: string): string {
  const key = conceptoExcel.trim();
  return MAPEO_CONCEPTOS[key] ?? CONCEPTOS_INGRESO.OTROS;
}

// ============================================================================
// FORMATO DE MONEDAS
// ============================================================================

/**
 * Formatea un número como moneda CLP.
 * Ejemplo: 8500 → "$8.500"
 */
export function formatearMonto(monto: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(monto);
}

/**
 * Formatea una fecha en formato DD/MM/YYYY.
 */
export function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fecha);
}

/**
 * Etiqueta legible para el motivo sin socio.
 */
export function labelMotivoSinSocio(motivo: string | null | undefined): string {
  if (!motivo) return "";
  switch (motivo) {
    case "REFUGIO":
      return "Sin asignar (Refugio)";
    case "COLECTA_OSVALDO":
      return "Sin asignar (Colecta Osvaldo)";
    default:
      return "Sin asignar";
  }
}
