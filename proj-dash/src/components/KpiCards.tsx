import type { Kpis } from "../domain/kpis";
import { fmtDineroCompacto, fmtNum, fmtPct } from "../utils/format";

interface Props {
  kpis: Kpis;
}

export function KpiCards({ kpis }: Props) {
  const pctRiesgo = kpis.comprasActivas
    ? kpis.skusEnRiesgo / kpis.comprasActivas
    : 0;

  const cards = [
    {
      icon: "🛒",
      tono: "azul",
      titulo: "Compras especiales activas",
      valor: fmtNum(kpis.comprasActivas),
      sub: "SKUs",
    },
    {
      icon: "📋",
      tono: "morado",
      titulo: "Chequera del mes",
      valor: fmtDineroCompacto(kpis.chequeraMes),
      sub: kpis.comprasChequera
        ? `${fmtNum(kpis.comprasChequera)} compras activas`
        : "sin compras registradas",
    },
    {
      icon: "📊",
      tono: "verde",
      titulo: "Sell Thru promedio",
      valor: fmtPct(kpis.sellThruPromedio),
      sub: "ventas $ / (inv. retail + ventas $)",
    },
    {
      icon: "⚠️",
      tono: "amarillo",
      titulo: "SKUs en riesgo",
      valor: fmtNum(kpis.skusEnRiesgo),
      sub: kpis.comprasActivas ? `${fmtPct(pctRiesgo, 1)} del total` : "—",
    },
    {
      icon: "💲",
      tono: "rojo",
      titulo: "Riesgo de liquidación",
      valor: fmtDineroCompacto(kpis.dineroEnRiesgo),
      sub: "valor retail en riesgo",
    },
  ];

  return (
    <div className="kpis">
      {cards.map((c) => (
        <div key={c.titulo} className={`kpi kpi--${c.tono}`}>
          <div className={`kpi__icon kpi__icon--${c.tono}`}>{c.icon}</div>
          <div className="kpi__body">
            <div className="kpi__titulo">{c.titulo}</div>
            <div className="kpi__valor">{c.valor}</div>
            <div className="kpi__sub">{c.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
