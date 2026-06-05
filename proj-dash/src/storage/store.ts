// ============================================================================
// STORAGE PORTABLE
// - Dentro de Tauri (app de escritorio): lee/escribe data/db.json AL LADO del
//   .exe usando @tauri-apps/plugin-fs. La carpeta data/ la resuelve un comando
//   de Rust (data_dir). Borrar esa carpeta = se borra todo, sin rastro.
// - Fuera de Tauri (npm run dev en el navegador, en Mac): usa localStorage,
//   para poder iterar la UI sin compilar nada nativo.
// ============================================================================

import { type Database, emptyDatabase } from "../schema/types";

const LS_KEY = "proj-dash:db";
const DB_FILE = "db.json";

/** Detecta si corremos dentro de la ventana de Tauri. */
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

/** Carga la base de datos desde disco (o localStorage en dev). */
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

/** Guarda la base de datos en disco (o localStorage en dev). */
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

/** Asegura que un objeto leido tenga la forma minima de Database. */
function normalize(obj: unknown): Database {
  const base = emptyDatabase();
  if (!obj || typeof obj !== "object") return base;
  const o = obj as Partial<Database>;
  return {
    skus: Array.isArray(o.skus) ? o.skus : [],
    snapshots: Array.isArray(o.snapshots) ? o.snapshots : [],
    meta: {
      updatedAt: o.meta?.updatedAt ?? "",
      version: o.meta?.version ?? 1,
      semanas: Array.isArray(o.meta?.semanas) ? o.meta!.semanas : [],
    },
  };
}
