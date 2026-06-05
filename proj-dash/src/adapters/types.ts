// ============================================================================
// INTERFAZ DE ADAPTADORES (arquitectura tipo "plugin")
// Cada fuente de datos (CSV/Excel hoy; API / Google Sheets manana) implementa
// esta misma interfaz. La UI NO conoce las fuentes: solo pide filas normalizadas.
// Agregar una fuente nueva = un archivo nuevo aqui + registrarlo en registry.ts,
// SIN tocar la UI.
// ============================================================================

import type { Sku, Snapshot } from "../schema/types";

/** Una fila ya normalizada al esquema canonico. La semana se asigna al importar. */
export interface FilaNormalizada {
  sku: Sku;
  snapshot: Omit<Snapshot, "semana">;
}

/** Entrada que recibe un adaptador de archivo. */
export interface EntradaArchivo {
  fileName: string;
  arrayBuffer: ArrayBuffer;
}

/** Resultado de una importacion (filas + avisos legibles para el usuario). */
export interface ResultadoAdaptador {
  filas: FilaNormalizada[];
  avisos: string[];
}

/** Contrato comun de todas las fuentes de datos. */
export interface DataAdapter {
  /** Identificador unico del adaptador. */
  id: string;
  /** Nombre legible. */
  nombre: string;
  /** True si este adaptador puede manejar el archivo dado. */
  acepta(fileName: string): boolean;
  /** Lee la entrada y devuelve filas normalizadas. */
  obtenerDatos(entrada: EntradaArchivo): Promise<ResultadoAdaptador>;
}
