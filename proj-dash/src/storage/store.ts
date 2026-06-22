// ============================================================================
// STORAGE PORTABLE
// ============================================================================

import { type Database, emptyDatabase, type Snapshot } from "../schema/types";
import { migrarSemanaLegacy } from "../domain/periodo";

const LS_KEY = "proj-dash:db";
const DB_FILE = "db.json";

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function tauriDataDir(): Promise<string> {
  const { invoke } = await import("@tauri-apps/api/core");
  return await invoke<string>("data_dir");
}

function joinPath(dir: string, file: string): string {
  const sep = dir.includes("\\") ? "\\" : "/";
  return dir.endsWith(sep) ? `${dir}${file}` : `${dir}${sep}${file}`;
}

export async function loadDb(): Promise<Database> {
  try {
    if (isTauri()) {
      const fs = await import("@tauri-apps/plugin-fs");
      const dir = await tauriDataDir();
      const path = joinPath(dir, DB_FILE);
      if (await fs.exists(path)) {
        const text = await fs.readTextFile(path);
        return normalize(JSON.parse(text));
      }
      return emptyDatabase();
    }
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? normalize(JSON.parse(raw)) : emptyDatabase();
  } catch (err) {
    console.error("No se pudo cargar la base de datos:", err);
    return emptyDatabase();
  }
}

export async function saveDb(db: Database): Promise<void> {
  db.meta.updatedAt = new Date().toISOString();
  const text = JSON.stringify(db, null, 2);
  if (isTauri()) {
    const fs = await import("@tauri-apps/plugin-fs");
    const dir = await tauriDataDir();
    const path = joinPath(dir, DB_FILE);
    await fs.writeTextFile(path, text);
    return;
  }
  window.localStorage.setItem(LS_KEY, text);
}

function migrarSnapshot(raw: Record<string, unknown>, ref: Date): Snapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const itemNbr = String(raw.itemNbr ?? "");
  if (!itemNbr) return null;

  let periodo = raw.periodo as Snapshot["periodo"] | undefined;
  if (!periodo || typeof periodo !== "object") {
    const semanaLegacy = typeof raw.semana === "number" ? raw.semana : 1;
    periodo = migrarSemanaLegacy(semanaLegacy, ref);
  }

  return {
    itemNbr,
    periodo: {
      anio: Number(periodo.anio) || ref.getFullYear(),
      mes: Number(periodo.mes) || 1,
      semanaMes: Number(periodo.semanaMes) || 1,
    },
    bannerCode: String(raw.bannerCode ?? ""),
    banner: String(raw.banner ?? ""),
    vendidas: Number(raw.vendidas) || 0,
    recibido: Number(raw.recibido) || 0,
    inventarioActual: Number(raw.inventarioActual) || 0,
    valorInventario: Number(raw.valorInventario) || 0,
    ventas: Number(raw.ventas) || 0,
    markdownQty: Number(raw.markdownQty) || 0,
    markdownValor: Number(raw.markdownValor) || 0,
    sellThruArchivo:
      raw.sellThruArchivo === null || raw.sellThruArchivo === undefined
        ? null
        : Number(raw.sellThruArchivo),
    netShipRetail: raw.netShipRetail !== undefined ? Number(raw.netShipRetail) : undefined,
    tiendasValidas: raw.tiendasValidas !== undefined ? Number(raw.tiendasValidas) : undefined,
    inventarioTransito:
      raw.inventarioTransito !== undefined ? Number(raw.inventarioTransito) : undefined,
    inventarioWhse: raw.inventarioWhse !== undefined ? Number(raw.inventarioWhse) : undefined,
    inventarioOrden: raw.inventarioOrden !== undefined ? Number(raw.inventarioOrden) : undefined,
  };
}

function normalize(obj: unknown): Database {
  const base = emptyDatabase();
  if (!obj || typeof obj !== "object") return base;
  const o = obj as Partial<Database> & { meta?: { semanas?: number[] } };
  const ref = o.meta?.updatedAt ? new Date(o.meta.updatedAt) : new Date();

  const snapshots: Snapshot[] = [];
  if (Array.isArray(o.snapshots)) {
    for (const s of o.snapshots) {
      const snap = migrarSnapshot(s as Record<string, unknown>, ref);
      if (snap) snapshots.push(snap);
    }
  }

  return {
    skus: Array.isArray(o.skus) ? o.skus : [],
    snapshots,
    meta: {
      updatedAt: o.meta?.updatedAt ?? "",
      version: o.meta?.version ?? 2,
      importaciones: Array.isArray(o.meta?.importaciones) ? o.meta!.importaciones : [],
    },
  };
}
