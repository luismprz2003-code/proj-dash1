// ============================================================================
// Helpers de normalizacion (tolerantes a como venga el archivo).
// ============================================================================

/** Normaliza un encabezado: minusculas, sin acentos, sin simbolos, espacios simples. */
export function normalizeKey(s: unknown): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ") // simbolos ($,%,/,etc) -> espacio
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Convierte texto a numero tolerando $, comas de miles, %, espacios y vacios.
 * Ej: "$110,178 " -> 110178 ; "37.23%" -> 37.23 ; "" -> 0
 */
export function parseNumber(s: unknown): number {
  if (typeof s === "number") return isFinite(s) ? s : 0;
  const str = String(s ?? "").trim();
  if (!str) return 0;
  const cleaned = str.replace(/[^0-9.\-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return 0;
  const n = Number(cleaned);
  return isFinite(n) ? n : 0;
}

/**
 * Convierte un porcentaje de texto a fraccion 0..1.
 * Ej: "90.72%" -> 0.9072 ; "0.45" -> 0.45 ; "45" -> 0.45
 */
export function parsePercent(s: unknown): number {
  const str = String(s ?? "").trim();
  if (!str) return 0;
  const hadPct = str.includes("%");
  const n = parseNumber(str);
  if (hadPct) return n / 100;
  // Sin signo %: si es > 1 asumimos que venia en escala 0..100.
  return n > 1 ? n / 100 : n;
}

export function cleanText(s: unknown): string {
  return String(s ?? "").trim();
}
