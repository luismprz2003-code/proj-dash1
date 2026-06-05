// ============================================================================
// ADAPTADOR v1: CSV / Excel (parseo en el frontend con SheetJS).
// Mapea las columnas del reporte real al esquema canonico, tolerando:
//  - filas iniciales de basura (ej. "Tabla 1") antes del encabezado real
//  - acentos / mayusculas / nombres con espacios
//  - numeros con $, comas de miles, % y espacios
// ============================================================================

import * as XLSX from "xlsx";
import type { DataAdapter, EntradaArchivo, FilaNormalizada, ResultadoAdaptador } from "./types";
import { normalizeKey, parseNumber, parsePercent, cleanText } from "../schema/normalize";
import { nombreBanner } from "../config/rules";

/** Campos canonicos -> posibles nombres de columna (ya normalizados). */
const ALIAS: Record<string, string[]> = {
  itemNbr: ["item nbr", "sku"],
  descripcion: ["item desc 1", "item desc", "descripcion"],
  marca: ["marca", "brand"],
  fineline: ["fineline"],
  finelineDesc: ["fineline desc"],
  categoria: ["cat", "categoria", "category"],
  formato: ["store type descr", "formato"],
  bannerCode: ["sel store trait"],
  vendidas: ["pos qty"],
  recibido: ["net ship qty"],
  inventarioActual: ["curr str on hand qty"],
  valorInventario: ["curr str on hand retail"],
  ventas: ["pos sales"],
  markdownQty: ["si mumd qty"],
  markdownValor: ["si total mumd"],
  sellThru: ["sellthru", "sell thru"],
  proveedor: ["vendor name", "proveedor"],
};

/** Columnas minimas para que un archivo sea valido. */
const REQUERIDAS = ["itemNbr"];

function esArchivoSoportado(fileName: string): boolean {
  return /\.(csv|xlsx|xls)$/i.test(fileName.trim());
}

/** Busca la fila de encabezados reales (la que contiene "item nbr"). */
function encontrarFilaEncabezado(matriz: string[][]): number {
  const limite = Math.min(matriz.length, 25);
  for (let i = 0; i < limite; i++) {
    const fila = matriz[i] ?? [];
    const set = new Set(fila.map(normalizeKey));
    if (set.has("item nbr") || set.has("sku")) return i;
  }
  return 0;
}

/** Mapea cada campo canonico a su indice de columna. */
function mapearColumnas(encabezados: string[]): Record<string, number> {
  const norm = encabezados.map(normalizeKey);
  const mapa: Record<string, number> = {};
  for (const [campo, alias] of Object.entries(ALIAS)) {
    let idx = -1;
    for (const a of alias) {
      idx = norm.indexOf(a);
      if (idx >= 0) break;
    }
    if (idx >= 0) mapa[campo] = idx;
  }
  return mapa;
}

export const csvExcelAdapter: DataAdapter = {
  id: "csv-excel",
  nombre: "Archivo CSV / Excel",
  acepta: esArchivoSoportado,

  async obtenerDatos(entrada: EntradaArchivo): Promise<ResultadoAdaptador> {
    const avisos: string[] = [];
    const wb = XLSX.read(new Uint8Array(entrada.arrayBuffer), { type: "array" });
    const hoja = wb.Sheets[wb.SheetNames[0]];
    if (!hoja) {
      return { filas: [], avisos: ["El archivo no contiene ninguna hoja de datos."] };
    }

    const matriz = XLSX.utils.sheet_to_json<string[]>(hoja, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    });

    if (matriz.length === 0) {
      return { filas: [], avisos: ["El archivo esta vacio."] };
    }

    const filaEnc = encontrarFilaEncabezado(matriz);
    const encabezados = matriz[filaEnc] ?? [];
    const mapa = mapearColumnas(encabezados);

    const faltantes = REQUERIDAS.filter((c) => !(c in mapa));
    if (faltantes.length > 0) {
      return {
        filas: [],
        avisos: [
          `No se encontro la columna obligatoria "Item Nbr" (SKU). Revisa que el archivo tenga los mismos encabezados del ejemplo.`,
        ],
      };
    }

    const get = (fila: string[], campo: string): string => {
      const idx = mapa[campo];
      return idx === undefined ? "" : cleanText(fila[idx]);
    };

    const filas: FilaNormalizada[] = [];
    let ignoradas = 0;

    for (let i = filaEnc + 1; i < matriz.length; i++) {
      const fila = matriz[i] ?? [];
      const itemNbr = get(fila, "itemNbr");
      if (!itemNbr) {
        ignoradas++;
        continue;
      }

      const bannerCode = get(fila, "bannerCode");

      filas.push({
        sku: {
          itemNbr,
          descripcion: get(fila, "descripcion"),
          marca: get(fila, "marca"),
          fineline: get(fila, "fineline"),
          finelineDesc: get(fila, "finelineDesc"),
          categoria: get(fila, "categoria"),
          formato: get(fila, "formato"),
          proveedor: get(fila, "proveedor"),
        },
        snapshot: {
          itemNbr,
          bannerCode,
          banner: nombreBanner(bannerCode),
          vendidas: parseNumber(get(fila, "vendidas")),
          recibido: parseNumber(get(fila, "recibido")),
          inventarioActual: parseNumber(get(fila, "inventarioActual")),
          valorInventario: parseNumber(get(fila, "valorInventario")),
          ventas: parseNumber(get(fila, "ventas")),
          markdownQty: parseNumber(get(fila, "markdownQty")),
          markdownValor: parseNumber(get(fila, "markdownValor")),
          sellThruArchivo: "sellThru" in mapa ? parsePercent(get(fila, "sellThru")) : null,
        },
      });
    }

    if (filas.length === 0) {
      avisos.push("No se encontraron filas con SKU validas en el archivo.");
    }
    if (ignoradas > 0) {
      avisos.push(`Se ignoraron ${ignoradas} fila(s) sin SKU.`);
    }
    const noMapeadas = Object.keys(ALIAS).filter((c) => !(c in mapa));
    if (noMapeadas.length > 0) {
      avisos.push(
        `Columnas no encontradas (se usaran en blanco): ${noMapeadas.join(", ")}.`
      );
    }

    return { filas, avisos };
  },
};
