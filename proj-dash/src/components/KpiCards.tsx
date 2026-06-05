import type { Kpis } from "../domain/kpis";
import { fmtDineroCompacto, fmtNum, fmtPct } from "../utils/format";

interface Props {
  kpis: Kpis;
}

export function KpiCards({ kpis }: Props) {
  const cards = [
    {
      icon: "🛒",
      tono: "azul",
      titulo: "Total compras especiales activas",
      valor: fmtNum(kpis.comprasActivas),
      sub: "SKUs",
    },
    {
      icon: "📊",
      tono: "verde",
      titulo: "% Sell Thru promedio",
      valor: fmtPct(kpis.sellThruPromedio),
      sub: "promedio ponderado",
    },
    {
      icon: "⚠️",
      tono: "amarillo",
      titulo: "SKUs en riesgo",
      valor: fmtNum(kpis.skusEnRiesgo),
      sub: kpis.comprasActivas
        ? `${fmtPct(kpis.skusEnRiesgo / kpis.comprasActivas, 1)} del total`
        : "—",
    },
    {
      icon: "💲",
      tono: "rojo",
      titulo: "$ en riesgo de liquidación",
      valor: fmtDineroCompacto(kpis.dineroEnRiesgo),
      sub: "inventario en riesgo",
    },
    {
      icon: "📦",
      tono: "morado",
      titulo: "% excedente generado",
      valor: fmtPct(kpis.excedentePct),
      sub: "del valor de inventario",
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
