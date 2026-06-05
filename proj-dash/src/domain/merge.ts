// ============================================================================
// Fusion de una importacion con la base de datos existente.
//  - "acumular": conserva el historial. Reemplaza solo la semana importada
//    (para no duplicar si se reimporta la misma semana) y hace upsert de SKUs.
//  - "reemplazar": descarta todo lo anterior y deja solo lo recien importado.
// ============================================================================

import type { Database, Sku, Snapshot } from "../schema/types";
import { emptyDatabase } from "../schema/types";
import type { FilaNormalizada } from "../adapters/types";

export type ModoImport = "acumular" | "reemplazar";

export function aplicarImportacion(
  db: Database,
  filas: FilaNormalizada[],
  semana: number,
  modo: ModoImport
): Database {
  const nuevosSnapshots: Snapshot[] = filas.map((f) => ({ ...f.snapshot, semana }));

  if (modo === "reemplazar") {
    const out = emptyDatabase();
    out.skus = dedupeSkus(filas.map((f) => f.sku));
    out.snapshots = nuevosSnapshots;
    out.meta.semanas = [semana];
    return out;
  }

  // acumular
  const skus = upsertSkus(db.skus, filas.map((f) => f.sku));
  const snapshots = [
    ...db.snapshots.filter((s) => s.semana !== semana),
    ...nuevosSnapshots,
  ];
  const semanas = [...new Set(snapshots.map((s) => s.semana))].sort((a, b) => a - b);

  return {
    skus,
    snapshots,
    meta: { ...db.meta, semanas },
  };
}

function dedupeSkus(skus: Sku[]): Sku[] {
  const mapa = new Map<string, Sku>();
  for (const s of skus) mapa.set(s.itemNbr, s);
  return [...mapa.values()];
}

function upsertSkus(existentes: Sku[], nuevos: Sku[]): Sku[] {
  const mapa = new Map(existentes.map((s) => [s.itemNbr, s]));
  for (const s of nuevos) mapa.set(s.itemNbr, s);
  return [...mapa.values()];
}
