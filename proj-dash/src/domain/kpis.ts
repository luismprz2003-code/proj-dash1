// ============================================================================
// LOGICA DE DOMINIO: semaforo, KPIs, alertas y datos para graficas.
// Formulas alineadas con la Biblia tablero.xlsx (hoja Tablero).
// ============================================================================

import type {
  ClasificacionSellThru,
  Database,
  Distribucion,
  Estatus,
  Snapshot,
} from "../schema/types";
import {
  calcPctFormatos,
  calcSellThruDollar,
  calcTotalInv,
  clasificarDistribucion,
  clasificarSellThru,
  estatusDeClasificacion,
  rules as defaultRules,
  type Rules,
} from "../config/rules";

import { ultimoPeriodo } from "./importaciones";
import {
  periodoIgual,
  periodoLabel,
  type Periodo,
} from "./periodo";

export interface FiltrosTablero {
  /** "ultimo" = periodo mas reciente importado */
  periodo: Periodo | "ultimo";
  formato: string | "todos";
  categoria: string | "todas";
  estatus: Estatus | "todos";
  banner: string | "todos";
}

export const filtrosVacios: FiltrosTablero = {
  periodo: "ultimo",
  formato: "todos",
  categoria: "todas",
  estatus: "todos",
  banner: "todos",
};

/** Fila del semaforo a nivel SKU (suma de banners del periodo). */
export interface FilaSemaforo {
  itemNbr: string;
  descripcion: string;
  fineline: string;
  categoria: string;
  formato: string;
  periodo: Periodo;
  periodoLabel: string;
  vendidas: number;
  recibido: number;
  inventarioActual: number;
  totalInv: number;
  valorInventario: number;
  ventas: number;
  netShipRetail: number;
  sellThru: number;
  pctFormatos: number;
  distribucion: Distribucion;
  clasificacion: ClasificacionSellThru;
  estatus: Estatus;
  accion: string;
  proveedor: string;
  banners: FilaBanner[];
}

export interface FilaBanner {
  bannerCode: string;
  banner: string;
  vendidas: number;
  recibido: number;
  inventarioActual: number;
  totalInv: number;
  valorInventario: number;
  ventas: number;
  sellThru: number;
  pctFormatos: number;
  distribucion: Distribucion;
  clasificacion: ClasificacionSellThru;
  estatus: Estatus;
}

export interface Kpis {
  comprasActivas: number;
  chequeraMes: number;
  comprasChequera: number;
  sellThruPromedio: number;
  skusEnRiesgo: number;
  dineroEnRiesgo: number;
}

export interface InsightClave {
  icono: string;
  titulo: string;
  texto: string;
}

function resolverPeriodo(db: Database, filtros: FiltrosTablero): Periodo | null {
  if (filtros.periodo !== "ultimo") return filtros.periodo;
  return ultimoPeriodo(db);
}

function metricasSnapshot(s: Snapshot, formato: string, r: Rules) {
  const ventas = s.ventas ?? 0;
  const valorInv = s.valorInventario ?? 0;
  const sellThru = calcSellThruDollar(ventas, valorInv);
  const tiendasValidas = s.tiendasValidas ?? 0;
  const pctFormatos = calcPctFormatos(tiendasValidas, formato, r);
  const clasificacion = clasificarSellThru(sellThru, r);
  return {
    totalInv: calcTotalInv(
      s.inventarioActual ?? 0,
      s.inventarioTransito ?? 0,
      s.inventarioWhse ?? 0,
      s.inventarioOrden ?? 0
    ),
    sellThru,
    pctFormatos,
    distribucion: clasificarDistribucion(pctFormatos, r),
    clasificacion,
    estatus: estatusDeClasificacion(clasificacion),
  };
}

/**
 * Construye las filas del semaforo a nivel SKU para el periodo seleccionado,
 * con drill-down por banner.
 */
export function construirSemaforo(
  db: Database,
  filtros: FiltrosTablero,
  r: Rules = defaultRules
): FilaSemaforo[] {
  const periodo = resolverPeriodo(db, filtros);
  if (periodo === null) return [];

  const skuInfo = new Map(db.skus.map((s) => [s.itemNbr, s]));

  const porSku = new Map<string, Snapshot[]>();
  for (const s of db.snapshots) {
    if (!periodoIgual(s.periodo, periodo)) continue;
    const arr = porSku.get(s.itemNbr) ?? [];
    arr.push(s);
    porSku.set(s.itemNbr, arr);
  }

  const filas: FilaSemaforo[] = [];

  for (const [itemNbr, snaps] of porSku) {
    const info = skuInfo.get(itemNbr);

    if (filtros.formato !== "todos" && info?.formato !== filtros.formato) continue;
    if (filtros.categoria !== "todas" && info?.categoria !== filtros.categoria) continue;

    const snapsFiltrados =
      filtros.banner === "todos" ? snaps : snaps.filter((s) => s.banner === filtros.banner);
    if (snapsFiltrados.length === 0) continue;

    const formato = info?.formato ?? "";

    const banners: FilaBanner[] = snapsFiltrados.map((s) => {
      const m = metricasSnapshot(s, formato, r);
      return {
        bannerCode: s.bannerCode,
        banner: s.banner,
        vendidas: s.vendidas,
        recibido: s.recibido,
        inventarioActual: s.inventarioActual,
        totalInv: m.totalInv,
        valorInventario: s.valorInventario,
        ventas: s.ventas,
        sellThru: m.sellThru,
        pctFormatos: m.pctFormatos,
        distribucion: m.distribucion,
        clasificacion: m.clasificacion,
        estatus: m.estatus,
      };
    });

    const vendidas = sum(snapsFiltrados, (s) => s.vendidas);
    const recibido = sum(snapsFiltrados, (s) => s.recibido);
    const inventarioActual = sum(snapsFiltrados, (s) => s.inventarioActual);
    const valorInventario = sum(snapsFiltrados, (s) => s.valorInventario);
    const ventas = sum(snapsFiltrados, (s) => s.ventas);
    const netShipRetail = sum(snapsFiltrados, (s) => s.netShipRetail ?? 0);
    const totalInv = sum(banners, (b) => b.totalInv);
    const sellThru = calcSellThruDollar(ventas, valorInventario);
    const tiendasValidas = sum(snapsFiltrados, (s) => s.tiendasValidas ?? 0);
    const pctFormatos = calcPctFormatos(tiendasValidas, formato, r);
    const clasificacion = clasificarSellThru(sellThru, r);
    const estatus = estatusDeClasificacion(clasificacion);

    filas.push({
      itemNbr,
      descripcion: info?.descripcion ?? "",
      fineline: [info?.fineline, info?.finelineDesc].filter(Boolean).join(" - "),
      categoria: info?.categoria ?? "",
      formato,
      periodo,
      periodoLabel: periodoLabel(periodo),
      vendidas,
      recibido,
      inventarioActual,
      totalInv,
      valorInventario,
      ventas,
      netShipRetail,
      sellThru,
      pctFormatos,
      distribucion: clasificarDistribucion(pctFormatos, r),
      clasificacion,
      estatus,
      accion: r.acciones[estatus],
      proveedor: info?.proveedor ?? "",
      banners: banners.sort((a, b) => a.banner.localeCompare(b.banner)),
    });
  }

  const conEstatus =
    filtros.estatus === "todos" ? filas : filas.filter((f) => f.estatus === filtros.estatus);

  return conEstatus.sort((a, b) => a.sellThru - b.sellThru);
}

/** KPIs de las tarjetas superiores. */
export function calcularKpis(filas: FilaSemaforo[]): Kpis {
  if (filas.length === 0) {
    return {
      comprasActivas: 0,
      chequeraMes: 0,
      comprasChequera: 0,
      sellThruPromedio: 0,
      skusEnRiesgo: 0,
      dineroEnRiesgo: 0,
    };
  }

  const enRiesgo = filas.filter((f) => f.estatus !== "objetivo");
  const conCompra = filas.filter((f) => f.recibido > 0 || f.netShipRetail > 0);

  return {
    comprasActivas: filas.length,
    chequeraMes: sum(conCompra, (f) => f.netShipRetail),
    comprasChequera: conCompra.length,
    sellThruPromedio: promedio(filas.map((f) => f.sellThru)),
    skusEnRiesgo: enRiesgo.length,
    dineroEnRiesgo: sum(enRiesgo, (f) => f.valorInventario),
  };
}

/** Alertas: criticos (rojo) y en riesgo (amarillo) de la semana. */
export function construirAlertas(filas: FilaSemaforo[]) {
  return {
    criticos: filas.filter((f) => f.estatus === "critico"),
    enRiesgo: filas.filter((f) => f.estatus === "riesgo"),
  };
}

/** Insights dinamicos para el footer (4 bullets). */
export function construirInsights(filas: FilaSemaforo[], kpis: Kpis): InsightClave[] {
  if (filas.length === 0) {
    return [
      {
        icono: "ℹ️",
        titulo: "Sin datos",
        texto: "Importa un archivo CSV o Excel para ver insights del tablero.",
      },
    ];
  }

  const pctRiesgo = kpis.comprasActivas
    ? (kpis.skusEnRiesgo / kpis.comprasActivas) * 100
    : 0;
  const mejor = [...filas].sort((a, b) => b.sellThru - a.sellThru)[0];
  const peor = filas[0];

  return [
    {
      icono: "📊",
      titulo: "Sell Thru promedio",
      texto: `El sell thru promedio del periodo es ${(kpis.sellThruPromedio * 100).toFixed(1)}%, calculado como ventas $ ÷ (inventario retail + ventas $).`,
    },
    {
      icono: "⚠️",
      titulo: "SKUs en riesgo",
      texto: `${kpis.skusEnRiesgo} SKUs (${pctRiesgo.toFixed(1)}%) requieren acción: promoción o markdown según su clasificación.`,
    },
    {
      icono: "💲",
      titulo: "Riesgo de liquidación",
      texto: `$${(kpis.dineroEnRiesgo / 1_000_000).toFixed(2)}M en inventario retail de SKUs en riesgo o críticos.`,
    },
    {
      icono: "🎯",
      titulo: "Extremos del periodo",
      texto: `Mejor: ${mejor.descripcion || mejor.itemNbr} (${(mejor.sellThru * 100).toFixed(0)}%). Peor: ${peor.descripcion || peor.itemNbr} (${(peor.sellThru * 100).toFixed(0)}%).`,
    },
  ];
}

// ---- Datos para graficas -----------------------------------------------------

export interface SegmentoEstatus {
  estatus: Estatus;
  etiqueta: string;
  cantidad: number;
}

/** Conteo de SKUs por estatus para el donut. */
export function semaforoPorEstatus(
  filas: FilaSemaforo[],
  r: Rules = defaultRules
): SegmentoEstatus[] {
  const mapa = new Map<Estatus, number>();
  for (const f of filas) {
    mapa.set(f.estatus, (mapa.get(f.estatus) ?? 0) + 1);
  }
  const orden: Estatus[] = ["objetivo", "riesgo", "critico"];
  return orden
    .filter((e) => (mapa.get(e) ?? 0) > 0)
    .map((e) => ({
      estatus: e,
      etiqueta: r.etiquetas[e],
      cantidad: mapa.get(e) ?? 0,
    }));
}

export interface BarraSellThru {
  nombre: string;
  sellThru: number;
}

/** Sell thru promedio por formato (barras horizontales). */
export function sellThruPorFormato(filas: FilaSemaforo[]): BarraSellThru[] {
  const mapa = new Map<string, number[]>();
  for (const f of filas) {
    const k = f.formato || "Otros";
    const arr = mapa.get(k) ?? [];
    arr.push(f.sellThru);
    mapa.set(k, arr);
  }
  return [...mapa.entries()]
    .map(([nombre, vals]) => ({ nombre, sellThru: promedio(vals) }))
    .sort((a, b) => b.sellThru - a.sellThru);
}

// ---- util --------------------------------------------------------------------

function sum<T>(arr: T[], fn: (x: T) => number): number {
  let t = 0;
  for (const x of arr) t += fn(x);
  return t;
}

function promedio(vals: number[]): number {
  if (vals.length === 0) return 0;
  return sum(vals, (v) => v) / vals.length;
}
