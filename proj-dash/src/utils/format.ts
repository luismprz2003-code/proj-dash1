// Helpers de formato para la UI (es-MX).

const pesos = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

const numero = new Intl.NumberFormat("es-MX");

/** $1,234,567 */
export function fmtDinero(n: number): string {
  return pesos.format(Math.round(n || 0));
}

/** Dinero compacto: $1.42M / $980K */
export function fmtDineroCompacto(n: number): string {
  const v = n || 0;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return pesos.format(Math.round(v));
}

/** 78.6% */
export function fmtPct(fraccion: number, dec = 1): string {
  return `${((fraccion || 0) * 100).toFixed(dec)}%`;
}

/** 1,234 */
export function fmtNum(n: number): string {
  return numero.format(Math.round(n || 0));
}
