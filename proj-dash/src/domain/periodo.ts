// ============================================================================
// Periodo de importacion: año + mes + semana calendario del mes (1-5).
// Semana del mes (opcion A): dias 1-7 = sem 1, 8-14 = sem 2, etc.
// ============================================================================

export interface Periodo {
  anio: number;
  /** 1-12 */
  mes: number;
  /** 1-5, semana calendario dentro del mes */
  semanaMes: number;
}

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export function periodoKey(p: Periodo): string {
  return `${p.anio}-${String(p.mes).padStart(2, "0")}-${p.semanaMes}`;
}

export function periodoIgual(a: Periodo, b: Periodo): boolean {
  return a.anio === b.anio && a.mes === b.mes && a.semanaMes === b.semanaMes;
}

/** Etiqueta corta: "Jun 2025 · Sem 3" */
export function periodoLabel(p: Periodo): string {
  const mes = MESES[p.mes - 1]?.slice(0, 3) ?? String(p.mes);
  return `${mes} ${p.anio} · Sem ${p.semanaMes}`;
}

/** Etiqueta larga para tablas. */
export function periodoLabelLargo(p: Periodo): string {
  return `${MESES[p.mes - 1] ?? p.mes} ${p.anio}, semana ${p.semanaMes}`;
}

/** Semana calendario del mes a partir del dia (1-31). */
export function semanaMesDesdeDia(dia: number): number {
  return Math.min(5, Math.max(1, Math.ceil(dia / 7)));
}

/** Periodo sugerido para una nueva importacion (hoy + incremento logico). */
export function periodoDesdeFecha(fecha = new Date()): Periodo {
  return {
    anio: fecha.getFullYear(),
    mes: fecha.getMonth() + 1,
    semanaMes: semanaMesDesdeDia(fecha.getDate()),
  };
}

/** Siguiente periodo despues del ultimo importado. */
export function periodoSiguiente(ultimo: Periodo | null): Periodo {
  if (!ultimo) return periodoDesdeFecha();
  let { anio, mes, semanaMes } = ultimo;
  semanaMes += 1;
  if (semanaMes > 5) {
    semanaMes = 1;
    mes += 1;
    if (mes > 12) {
      mes = 1;
      anio += 1;
    }
  }
  return { anio, mes, semanaMes };
}

/** Ordena periodos cronologicamente (mas antiguo primero). */
export function compararPeriodos(a: Periodo, b: Periodo): number {
  if (a.anio !== b.anio) return a.anio - b.anio;
  if (a.mes !== b.mes) return a.mes - b.mes;
  return a.semanaMes - b.semanaMes;
}

/** Lista unica de periodos presentes en snapshots, ordenados. */
export function periodosUnicos(periodos: Periodo[]): Periodo[] {
  const mapa = new Map<string, Periodo>();
  for (const p of periodos) {
    mapa.set(periodoKey(p), p);
  }
  return [...mapa.values()].sort(compararPeriodos);
}

/** Migra snapshot legacy con `semana: number` a Periodo. */
export function migrarSemanaLegacy(semana: number, ref = new Date()): Periodo {
  return {
    anio: ref.getFullYear(),
    mes: ref.getMonth() + 1,
    semanaMes: Math.min(5, Math.max(1, semana)),
  };
}

export function anosDisponibles(base = new Date().getFullYear()): number[] {
  return [base - 1, base, base + 1];
}
