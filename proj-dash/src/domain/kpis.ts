// ============================================================================
// LOGICA DE DOMINIO: semaforo, KPIs, alertas y datos para graficas.
// Todo se calcula a partir del esquema canonico + las reglas (config/rules.ts).
// ============================================================================

import type { Database, Estatus, Snapshot } from "../schema/types";
import { rules as defaultRules, type Rules } from "../config/rules";

export interface FiltrosTablero {
  semana: number | "todas";
  formato: string | "todos";
  categoria: string | "todas";
  estatus: Estatus | "todos";
  banner: string | "todos";
}

export const filtrosVacios: FiltrosTablero = {
  semana: "todas",
  formato: "todos",
  categoria: "todas",
  estatus: "todos",
  banner: "todos",
};

/** Fila del semaforo a nivel SKU (suma de banners de esa semana). */
export interface FilaSemaforo {
  itemNbr: string;
  descripcion: string;
  fineline: string;
  categoria: string;
  formato: string;
  semana: number;
  vendidas: number;
  recibido: number;
  inventarioActual: number;
  valorInventario: number;
  sellThru: number;        // 0..1, recalculado de unidades
  objetivoSemana: number;  // 0..1
  avance: number;          // sellThru / objetivoSemana
  estatus: Estatus;
  accion: string;
  proveedor: string;
  /** Detalle por banner (drill-down). */
  banners: FilaBanner[];
}

export interface FilaBanner {
  bannerCode: string;
  banner: string;
  vendidas: number;
  recibido: number;
  inventarioActual: number;
  valorInventario: number;
  sellThru: number;
  avance: number;
  estatus: Estatus;
}

export interface Kpis {
  comprasActivas: number;
  sellThruPromedio: number; // 0..1
  skusEnRiesgo: number;     // riesgo + critico
  dineroEnRiesgo: number;   // $ de inventario de SKUs en riesgo/critico
  excedentePct: number;     // 0..1 (markdown / valor inventario)
}

/** Objetivo de la semana segun la rampa (1a..4a semana). */
export function objetivoDeSemana(semana: number, r: Rules = defaultRules): number {
  const techo = r.objetivoDefault;
  const paso = Math.min(Math.max(semana, 1), r.semanasRampa) / r.semanasRampa;
  return techo * paso;
}

/** Calcula sell thru (0..1) a partir de unidades. */
export function calcSellThru(vendidas: number, recibido: number): number {
  if (recibido <= 0) return 0;
  return vendidas / recibido;
}

/** Determina estatus del semaforo a partir del avance. */
export function estatusDeAvance(avance: number, r: Rules = defaultRules): Estatus {
  if (avance >= r.umbralesAvance.objetivo) return "objetivo";
  if (avance >= r.umbralesAvance.riesgo) return "riesgo";
  return "critico";
}

/** Semanas disponibles en los datos (ordenadas). */
export function semanasDisponibles(db: Database): number[] {
  const set = new Set<number>();
  for (const s of db.snapshots) set.add(s.semana);
  return [...set].sort((a, b) => a - b);
}

/** Semana objetivo: la elegida, o la mas reciente si es "todas". */
function resolverSemana(db: Database, filtros: FiltrosTablero): number | null {
  if (filtros.semana !== "todas") return filtros.semana;
  const semanas = semanasDisponibles(db);
  return semanas.length ? semanas[semanas.length - 1] : null;
}

/**
 * Construye las filas del semaforo a nivel SKU para la semana seleccionada,
 * con drill-down por banner. Aplica los filtros (excepto el de estatus, que se
 * aplica al final porque depende del calculo).
 */
export function construirSemaforo(
  db: Database,
  filtros: FiltrosTablero,
  r: Rules = defaultRules
): FilaSemaforo[] {
  const semana = resolverSemana(db, filtros);
  if (semana === null) return [];

  const objetivoSemana = objetivoDeSemana(semana, r);
  const skuInfo = new Map(db.skus.map((s) => [s.itemNbr, s]));

  // Agrupa snapshots de esa semana por SKU (y dentro, por banner).
  const porSku = new Map<string, Snapshot[]>();
  for (const s of db.snapshots) {
    if (s.semana !== semana) continue;
    const arr = porSku.get(s.itemNbr) ?? [];
    arr.push(s);
    porSku.set(s.itemNbr, arr);
  }

  const filas: FilaSemaforo[] = [];

  for (const [itemNbr, snaps] of porSku) {
    const info = skuInfo.get(itemNbr);

    // Filtros de catalogo (formato/categoria/banner) antes de agregar.
    if (filtros.formato !== "todos" && info?.formato !== filtros.formato) continue;
    if (filtros.categoria !== "todas" && info?.categoria !== filtros.categoria) continue;

    const snapsFiltrados =
      filtros.banner === "todos" ? snaps : snaps.filter((s) => s.banner === filtros.banner);
    if (snapsFiltrados.length === 0) continue;

    const banners: FilaBanner[] = snapsFiltrados.map((s) => {
      const st = calcSellThru(s.vendidas, s.recibido);
      const av = objetivoSemana > 0 ? st / objetivoSemana : 0;
      return {
        bannerCode: s.bannerCode,
        banner: s.banner,
        vendidas: s.vendidas,
        recibido: s.recibido,
        inventarioActual: s.inventarioActual,
        valorInventario: s.valorInventario,
        sellThru: st,
        avance: av,
        estatus: estatusDeAvance(av, r),
      };
    });

    const vendidas = sum(snapsFiltrados, (s) => s.vendidas);
    const recibido = sum(snapsFiltrados, (s) => s.recibido);
    const inventarioActual = sum(snapsFiltrados, (s) => s.inventarioActual);
    const valorInventario = sum(snapsFiltrados, (s) => s.valorInventario);
    const sellThru = calcSellThru(vendidas, recibido);
    const avance = objetivoSemana > 0 ? sellThru / objetivoSemana : 0;
    const estatus = estatusDeAvance(avance, r);

    filas.push({
      itemNbr,
      descripcion: info?.descripcion ?? "",
      fineline: [info?.fineline, info?.finelineDesc].filter(Boolean).join(" - "),
      categoria: info?.categoria ?? "",
      formato: info?.formato ?? "",
      semana,
      vendidas,
      recibido,
      inventarioActual,
      valorInventario,
      sellThru,
      objetivoSemana,
      avance,
      estatus,
      accion: r.acciones[estatus],
      proveedor: info?.proveedor ?? "",
      banners: banners.sort((a, b) => a.banner.localeCompare(b.banner)),
    });
  }

  const conEstatus =
    filtros.estatus === "todos" ? filas : filas.filter((f) => f.estatus === filtros.estatus);

  return conEstatus.sort((a, b) => a.avance - b.avance);
}

/** KPIs de las tarjetas superiores. */
export function calcularKpis(filas: FilaSemaforo[]): Kpis {
  if (filas.length === 0) {
    return {
      comprasActivas: 0,
      sellThruPromedio: 0,
      skusEnRiesgo: 0,
      dineroEnRiesgo: 0,
      excedentePct: 0,
    };
  }
  const vendidas = sum(filas, (f) => f.vendidas);
  const recibido = sum(filas, (f) => f.recibido);
  const enRiesgo = filas.filter((f) => f.estatus !== "objetivo");
  const valorTotal = sum(filas, (f) => f.valorInventario);
  const dineroEnRiesgo = sum(enRiesgo, (f) => f.valorInventario);

  return {
    comprasActivas: filas.length,
    sellThruPromedio: calcSellThru(vendidas, recibido),
    skusEnRiesgo: enRiesgo.length,
    dineroEnRiesgo,
    excedentePct: valorTotal > 0 ? dineroEnRiesgo / valorTotal : 0,
  };
}

/** Alertas: criticos (rojo) y en riesgo (amarillo) de la semana. */
export function construirAlertas(filas: FilaSemaforo[]) {
  return {
    criticos: filas.filter((f) => f.estatus === "critico"),
    enRiesgo: filas.filter((f) => f.estatus === "riesgo"),
  };
}

// ---- Datos para graficas -----------------------------------------------------

export interface PuntoEvolucion {
  semana: number;
  sellThru: number; // 0..1
}

/** Evolucion de sell thru promedio por semana (todas las semanas de la base). */
export function evolucionSellThru(db: Database, r: Rules = defaultRules): PuntoEvolucion[] {
  void r;
  const semanas = semanasDisponibles(db);
  return semanas.map((semana) => {
    const snaps = db.snapshots.filter((s) => s.semana === semana);
    const vendidas = sum(snaps, (s) => s.vendidas);
    const recibido = sum(snaps, (s) => s.recibido);
    return { semana, sellThru: calcSellThru(vendidas, recibido) };
  });
}

export interface BarraExcedente {
  nombre: string;
  valor: number;
}

/** Excedente ($ en riesgo) agrupado por una clave del SKU (formato o categoria). */
export function excedentePorClave(
  filas: FilaSemaforo[],
  clave: "formato" | "categoria"
): BarraExcedente[] {
  const mapa = new Map<string, number>();
  for (const f of filas) {
    if (f.estatus === "objetivo") continue;
    const k = (f[clave] || "Otros").toString();
    mapa.set(k, (mapa.get(k) ?? 0) + f.valorInventario);
  }
  return [...mapa.entries()]
    .map(([nombre, valor]) => ({ nombre, valor }))
    .sort((a, b) => b.valor - a.valor);
}

// ---- util --------------------------------------------------------------------

function sum<T>(arr: T[], fn: (x: T) => number): number {
  let t = 0;
  for (const x of arr) t += fn(x);
  return t;
}
