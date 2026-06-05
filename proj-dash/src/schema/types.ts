// ============================================================================
// ESQUEMA CANONICO (unica fuente de verdad)
// El tablero SOLO lee de estas estructuras. Cualquier fuente de datos (CSV,
// Excel, API, Google Sheets...) debe normalizarse a este esquema via un adaptador.
// ============================================================================

/** Estatus del semaforo. */
export type Estatus = "objetivo" | "riesgo" | "critico";

/** Un articulo / SKU (datos que no cambian semana a semana). */
export interface Sku {
  /** Identificador del producto (columna "Item Nbr"). */
  itemNbr: string;
  descripcion: string;
  marca: string;
  fineline: string;
  finelineDesc: string;
  categoria: string;
  /** Formato de tienda (columna "Store Type Descr"). */
  formato: string;
  proveedor: string;
}

/**
 * Una "foto" semanal de un SKU dentro de un banner.
 * Granularidad: SKU x banner x semana.
 */
export interface Snapshot {
  itemNbr: string;
  /** Numero de semana (se elige al importar el archivo). */
  semana: number;
  /** Codigo crudo del banner (columna "Sel Store Trait"). */
  bannerCode: string;
  /** Nombre legible del banner (mapeado en rules.banners). */
  banner: string;
  /** Unidades vendidas (columna "POS Qty"). */
  vendidas: number;
  /** Unidades recibidas / inventario inicial (columna "Net Ship Qty"). */
  recibido: number;
  /** Inventario actual en piso (columna "Curr Str On Hand Qty"). */
  inventarioActual: number;
  /** Valor retail del inventario en piso (columna "Curr Str On Hand Retail"). */
  valorInventario: number;
  /** Ventas en $ (columna "POS Sales"). */
  ventas: number;
  /** Unidades en markdown / liquidacion (columna "SI MUMD Qty"). */
  markdownQty: number;
  /** Valor en markdown / liquidacion (columna "SI Total MUMD $"). */
  markdownValor: number;
  /** Sell Thru tal cual venia en el archivo (referencia; el oficial se recalcula). */
  sellThruArchivo: number | null;
}

/** Base de datos local completa (se serializa a data/db.json). */
export interface Database {
  skus: Sku[];
  snapshots: Snapshot[];
  meta: {
    updatedAt: string;
    version: number;
    /** Semanas presentes en los datos (ordenadas). */
    semanas: number[];
  };
}

export function emptyDatabase(): Database {
  return {
    skus: [],
    snapshots: [],
    meta: { updatedAt: "", version: 1, semanas: [] },
  };
}
