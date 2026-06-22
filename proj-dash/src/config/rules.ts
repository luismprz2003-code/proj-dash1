// ============================================================================
// REGLAS DE LIQUIDACION (editables - NO hardcodeadas en la UI)
// Aqui se ajustan umbrales, objetivos, rampa, mapeo de banners y acciones.
// Cambiar este archivo NO requiere tocar ningun componente.
// ============================================================================

import type { ClasificacionSellThru, Distribucion, Estatus } from "../schema/types";

export interface Rules {
  /**
   * Total de tiendas por formato (Store Type Descr) para la formula
   * % de formatos = (tiendasValidas / totalTiendas) * 100.
   * Valores tomados de la hoja Guia del Excel Biblia.
   */
  tiendasPorFormato: Record<string, number>;

  /**
   * Umbrales de distribucion (formula AU): compara el % de formatos (0..100).
   * IF pct > nacional -> "Nacional", IF pct > regional -> "Regional", else "Local".
   */
  umbralesDistribucion: {
    nacional: number;
    regional: number;
  };

  /**
   * Umbrales de clasificacion de sell thru (formula AV), en fraccion 0..1.
   * SellThru = POS Sales / (Curr Str On Hand Retail + POS Sales).
   */
  umbralesSellThru: {
    saludable: number;
    seguimiento: number;
    enRiesgo: number;
  };

  /** Mapeo de codigos numericos de banner a nombre legible (CSV legacy). */
  banners: Record<string, string>;

  /** Accion sugerida segun el estatus del semaforo. */
  acciones: Record<Estatus, string>;

  /** Etiquetas legibles del estatus. */
  etiquetas: Record<Estatus, string>;

  /** Etiquetas de la clasificacion Excel. */
  etiquetasClasificacion: Record<ClasificacionSellThru, string>;
}

export const rules: Rules = {
  tiendasPorFormato: {
    Bodega: 640,
    WME: 104,
    SC: 338,
    B3: 640,
  },

  umbralesDistribucion: {
    nacional: 0.8,
    regional: 0.4,
  },

  umbralesSellThru: {
    saludable: 0.8,
    seguimiento: 0.6,
    enRiesgo: 0.4,
  },

  banners: {
    "297": "Supercenter",
    "9": "Bodega",
    "11": "WME",
    "969": "BAE",
    "1312": "Mi Bodega",
  },

  acciones: {
    objetivo: "Seguimiento",
    riesgo: "Promoción",
    critico: "Markdown / Negociación",
  },

  etiquetas: {
    objetivo: "En objetivo",
    riesgo: "En riesgo",
    critico: "Crítico",
  },

  etiquetasClasificacion: {
    saludable: "Saludable",
    seguimiento: "Seguimiento",
    "en riesgo": "En riesgo",
    critico: "Crítico",
    concluido: "Concluido",
  },
};

/** Devuelve el nombre legible de un banner a partir de su codigo o nombre. */
export function nombreBanner(codigo: string, r: Rules = rules): string {
  const c = (codigo ?? "").trim();
  if (!c) return "Sin banner";
  if (r.banners[c]) return r.banners[c];
  if (/^\d+$/.test(c)) return `Banner ${c}`;
  return c;
}

/** Total de tiendas del formato para calcular % de formatos. */
export function totalTiendasFormato(formato: string, r: Rules = rules): number {
  const f = (formato ?? "").trim();
  return r.tiendasPorFormato[f] ?? 640;
}

/** Sell thru en $: POS Sales / (On Hand Retail + POS Sales). */
export function calcSellThruDollar(ventas: number, valorInventario: number): number {
  const denom = valorInventario + ventas;
  if (denom <= 0) return 0;
  return ventas / denom;
}

/** Total inventario: On Hand + In Transit + In Whse + On Order. */
export function calcTotalInv(
  onHand: number,
  transit: number,
  whse: number,
  orden: number
): number {
  return onHand + transit + whse + orden;
}

/** % de formatos (0..100) = (tiendasValidas / totalTiendas) * 100. */
export function calcPctFormatos(
  tiendasValidas: number,
  formato: string,
  r: Rules = rules
): number {
  const total = totalTiendasFormato(formato, r);
  if (total <= 0) return 0;
  return (tiendasValidas / total) * 100;
}

/** Distribucion segun formula AU del Excel. */
export function clasificarDistribucion(pctFormatos: number, r: Rules = rules): Distribucion {
  if (pctFormatos > r.umbralesDistribucion.nacional) return "Nacional";
  if (pctFormatos > r.umbralesDistribucion.regional) return "Regional";
  return "Local";
}

/** Clasificacion segun formula AV del Excel. */
export function clasificarSellThru(
  sellThru: number,
  r: Rules = rules
): ClasificacionSellThru {
  if (sellThru >= 1) return "concluido";
  if (sellThru >= r.umbralesSellThru.saludable) return "saludable";
  if (sellThru >= r.umbralesSellThru.seguimiento) return "seguimiento";
  if (sellThru >= r.umbralesSellThru.enRiesgo) return "en riesgo";
  return "critico";
}

/** Mapea la clasificacion Excel al semaforo de 3 colores. */
export function estatusDeClasificacion(c: ClasificacionSellThru): Estatus {
  if (c === "saludable" || c === "concluido") return "objetivo";
  if (c === "seguimiento" || c === "en riesgo") return "riesgo";
  return "critico";
}
