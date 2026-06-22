// ============================================================================
// ESQUEMA CANONICO (unica fuente de verdad)
// El tablero SOLO lee de estas estructuras. Cualquier fuente de datos (CSV,
// Excel, API, Google Sheets...) debe normalizarse a este esquema via un adaptador.
// ============================================================================

import type { Periodo } from "../domain/periodo";

export type { Periodo };

/** Estatus del semaforo (3 niveles para la UI). */
export type Estatus = "objetivo" | "riesgo" | "critico";

/** Clasificacion de sell thru tal como viene en la Biblia (Excel). */
export type ClasificacionSellThru =
  | "saludable"
  | "seguimiento"
  | "en riesgo"
  | "critico"
  | "concluido";

/** Distribucion por cobertura de tiendas (formula AU del Excel). */
export type Distribucion = "Nacional" | "Regional" | "Local";

/** Registro de una importacion de archivo. */
export interface Importacion {
  id: string;
  fileName: string;
  importadoEn: string;
  periodo: Periodo;
  filas: number;
}

/** Un articulo / SKU (datos que no cambian semana a semana). */
export interface Sku {
  itemNbr: string;
  descripcion: string;
  marca: string;
  fineline: string;
  finelineDesc: string;
  categoria: string;
  formato: string;
  proveedor: string;
}

/**
 * Una "foto" semanal de un SKU dentro de un banner.
 * Granularidad: SKU x banner x periodo (año + mes + semana del mes).
 */
export interface Snapshot {
  itemNbr: string;
  periodo: Periodo;
  bannerCode: string;
  banner: string;
  vendidas: number;
  recibido: number;
  inventarioActual: number;
  valorInventario: number;
  ventas: number;
  markdownQty: number;
  markdownValor: number;
  sellThruArchivo: number | null;
  netShipRetail?: number;
  tiendasValidas?: number;
  inventarioTransito?: number;
  inventarioWhse?: number;
  inventarioOrden?: number;
}

/** Base de datos local completa (se serializa a data/db.json). */
export interface Database {
  skus: Sku[];
  snapshots: Snapshot[];
  meta: {
    updatedAt: string;
    version: number;
    importaciones: Importacion[];
  };
}

export function emptyDatabase(): Database {
  return {
    skus: [],
    snapshots: [],
    meta: { updatedAt: "", version: 2, importaciones: [] },
  };
}
