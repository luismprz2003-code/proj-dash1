import type { FilaSemaforo } from "../domain/kpis";
import { fmtNum, fmtPct } from "../utils/format";

interface Props {
  criticos: FilaSemaforo[];
  enRiesgo: FilaSemaforo[];
}

export function AlertsPanel({ criticos, enRiesgo }: Props) {
  return (
    <section className="card">
      <header className="card__head">
        <h2 className="card__title">Alertas y Acciones Recomendadas</h2>
      </header>

      <div className="alerts">
        <BloqueAlerta
          tono="critico"
          titulo="SKUs críticos esta semana"
          subtitulo="Por debajo del ritmo objetivo"
          filas={criticos}
        />
        <BloqueAlerta
          tono="riesgo"
          titulo="SKUs en riesgo"
          subtitulo="Cerca del límite del objetivo"
          filas={enRiesgo}
        />
      </div>
    </section>
  );
}

function BloqueAlerta({
  tono,
  titulo,
  subtitulo,
  filas,
}: {
  tono: "critico" | "riesgo";
  titulo: string;
  subtitulo: string;
  filas: FilaSemaforo[];
}) {
  return (
    <div className={`alert-box alert-box--${tono}`}>
      <div className="alert-box__head">
        <strong>{titulo}</strong>
        <span className="alert-box__sub">{subtitulo}</span>
      </div>
      {filas.length === 0 ? (
        <p className="alert-box__empty">Sin SKUs en este estado.</p>
      ) : (
        <ul className="alert-list">
          {filas.slice(0, 8).map((f) => (
            <li key={f.itemNbr} className="alert-item">
              <span className="alert-item__sku mono">{f.itemNbr}</span>
              <span className="alert-item__desc">{f.descripcion || "—"}</span>
              <span className="alert-item__st">Sell Thru {fmtPct(f.sellThru, 0)}</span>
              <span className="alert-item__inv">Inv. {fmtNum(f.inventarioActual)}</span>
              <span className="alert-item__accion">{f.accion}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
