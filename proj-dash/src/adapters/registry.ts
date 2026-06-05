// ============================================================================
// REGISTRO DE ADAPTADORES
// Para agregar una fuente nueva (API, Google Sheets, etc.):
//   1) Crea un archivo nuevo que implemente DataAdapter.
//   2) Importalo aqui y agregalo a la lista.
// La UI no cambia.
// ============================================================================

import type { DataAdapter } from "./types";
import { csvExcelAdapter } from "./csvExcelAdapter";

export const adapters: DataAdapter[] = [
  csvExcelAdapter,
  // Futuro:
  // import { apiAdapter } from "./apiAdapter";
  // import { googleSheetsAdapter } from "./googleSheetsAdapter";
];

/** Elige el primer adaptador capaz de manejar el archivo. */
export function elegirAdaptador(fileName: string): DataAdapter | null {
  return adapters.find((a) => a.acepta(fileName)) ?? null;
}
