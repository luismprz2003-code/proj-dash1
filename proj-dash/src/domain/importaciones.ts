// ============================================================================
// Gestion de importaciones: registro, listado y borrado por periodo.
// ============================================================================

import type { Database, Importacion, Snapshot } from "../schema/types";
import { emptyDatabase } from "../schema/types";
import type { FilaNormalizada } from "../adapters/types";
import {
  compararPeriodos,
  periodoIgual,
  periodoKey,
  periodosUnicos,
  type Periodo,
} from "./periodo";

export type ModoImport = "acumular" | "reemplazar";

function nuevoId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function dedupeSkus<T extends { itemNbr: string }>(skus: T[]): T[] {
  const mapa = new Map<string, T>();
  for (const s of skus) mapa.set(s.itemNbr, s);
  return [...mapa.values()];
}

function upsertSkus<T extends { itemNbr: string }>(existentes: T[], nuevos: T[]): T[] {
  const mapa = new Map(existentes.map((s) => [s.itemNbr, s]));
  for (const s of nuevos) mapa.set(s.itemNbr, s);
  return [...mapa.values()];
}

function limpiarSkusHuerfanos(db: Database): Database {
  const activos = new Set(db.snapshots.map((s) => s.itemNbr));
  return { ...db, skus: db.skus.filter((s) => activos.has(s.itemNbr)) };
}

function reconstruirImportaciones(db: Database): Importacion[] {
  const porPeriodo = new Map<string, Importacion>();
  for (const imp of db.meta.importaciones ?? []) {
    porPeriodo.set(periodoKey(imp.periodo), imp);
  }
  const periodos = periodosUnicos(db.snapshots.map((s) => s.periodo));
  return periodos
    .map((p) => {
      const key = periodoKey(p);
      const existente = porPeriodo.get(key);
      if (existente) return existente;
      const filas = db.snapshots.filter((s) => periodoIgual(s.periodo, p)).length;
      return {
        id: `legacy-${key}`,
        fileName: "—",
        importadoEn: db.meta.updatedAt || new Date().toISOString(),
        periodo: p,
        filas,
      };
    })
    .sort((a, b) => compararPeriodos(a.periodo, b.periodo));
}

function actualizarMeta(db: Database): Database["meta"] {
  return {
    ...db.meta,
    version: 2,
    importaciones: reconstruirImportaciones(db),
  };
}

export function aplicarImportacion(
  db: Database,
  filas: FilaNormalizada[],
  periodo: Periodo,
  modo: ModoImport,
  fileName: string
): Database {
  const nuevosSnapshots: Snapshot[] = filas.map((f) => ({
    ...f.snapshot,
    periodo,
  }));

  const registro: Importacion = {
    id: nuevoId(),
    fileName,
    importadoEn: new Date().toISOString(),
    periodo,
    filas: filas.length,
  };

  if (modo === "reemplazar") {
    const out: Database = {
      ...emptyDatabase(),
      skus: dedupeSkus(filas.map((f) => f.sku)),
      snapshots: nuevosSnapshots,
      meta: { updatedAt: "", version: 2, importaciones: [registro] },
    };
    return limpiarSkusHuerfanos(out);
  }

  const snapshots = [
    ...db.snapshots.filter((s) => !periodoIgual(s.periodo, periodo)),
    ...nuevosSnapshots,
  ];
  const importaciones = [
    ...(db.meta.importaciones ?? []).filter((i) => !periodoIgual(i.periodo, periodo)),
    registro,
  ];

  const out: Database = {
    skus: upsertSkus(db.skus, filas.map((f) => f.sku)),
    snapshots,
    meta: { ...db.meta, version: 2, importaciones },
  };
  return limpiarSkusHuerfanos(out);
}

/** Elimina una importacion (todos los snapshots de ese periodo). */
export function eliminarImportacion(db: Database, id: string): Database {
  const imp = reconstruirImportaciones(db).find((i) => i.id === id);
  if (!imp) return db;

  const snapshots = db.snapshots.filter((s) => !periodoIgual(s.periodo, imp.periodo));
  const importaciones = (db.meta.importaciones ?? []).filter((i) => i.id !== id);

  let out: Database = {
    ...db,
    snapshots,
    meta: { ...db.meta, importaciones },
  };
  out = limpiarSkusHuerfanos(out);
  out.meta = actualizarMeta(out);
  return out;
}

/** Periodos presentes en la base, ordenados. */
export function periodosDisponibles(db: Database): Periodo[] {
  return periodosUnicos(db.snapshots.map((s) => s.periodo));
}

/** Ultimo periodo importado (el mas reciente). */
export function ultimoPeriodo(db: Database): Periodo | null {
  const ps = periodosDisponibles(db);
  return ps.length ? ps[ps.length - 1] : null;
}

/** Lista de importaciones para la pestaña Datos. */
export function listarImportaciones(db: Database): Importacion[] {
  return reconstruirImportaciones(db).sort((a, b) =>
    compararPeriodos(b.periodo, a.periodo)
  );
}
