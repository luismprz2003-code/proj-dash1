import { useState } from "react";
import type { FilaSemaforo } from "../domain/kpis";
import { StatusChip } from "./StatusChip";
import { fmtDinero, fmtNum, fmtPct } from "../utils/format";

interface Props {
  filas: FilaSemaforo[];
  limite?: number;
}

export function SkuTable({ filas, limite }: Props) {
  const [verTodos, setVerTodos] = useState(false);
  const [abierto, setAbierto] = useState<string | null>(null);

  const visibles = limite && !verTodos ? filas.slice(0, limite) : filas;

  return (
    <section className="card">
      <header className="card__head">
        <h2 className="card__title">Seguimiento de SKUs (semáforo)</h2>
      </header>

      {filas.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="table-wrap">
          <table className="semaforo">
            <thead>
              <tr>
                <th></th>
                <th>SKU</th>
                <th>Fineline</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Formato</th>
                <th className="num">Sem</th>
                <th className="num">% Sell Thru</th>
                <th className="num">Inventario</th>
                <th>Estatus</th>
                <th>Acción sugerida</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((f) => (
                <FilaConDetalle
                  key={f.itemNbr}
                  fila={f}
                  abierto={abierto === f.itemNbr}
                  onToggle={() => setAbierto(abierto === f.itemNbr ? null : f.itemNbr)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {limite && filas.length > limite && (
        <button className="link-btn" onClick={() => setVerTodos((v) => !v)}>
          {verTodos ? "Ver menos" : `Ver todos los SKUs (${filas.length})`}
        </button>
      )}
    </section>
  );
}

function FilaConDetalle({
  fila,
  abierto,
  onToggle,
}: {
  fila: FilaSemaforo;
  abierto: boolean;
  onToggle: () => void;
}) {
  const tieneDetalle = fila.banners.length > 1;
  return (
    <>
      <tr className={`row row--${fila.estatus}`}>
        <td className="row__toggle">
          {tieneDetalle ? (
            <button className="toggle" onClick={onToggle} title="Ver por banner">
              {abierto ? "▾" : "▸"}
            </button>
          ) : null}
        </td>
        <td className="mono">{fila.itemNbr}</td>
        <td>{fila.fineline || "—"}</td>
        <td>{fila.descripcion || "—"}</td>
        <td>{fila.categoria || "—"}</td>
        <td>{fila.formato || "—"}</td>
        <td className="num">{fila.semana}</td>
        <td className="num strong">{fmtPct(fila.sellThru)}</td>
        <td className="num">{fmtNum(fila.inventarioActual)}</td>
        <td>
          <StatusChip estatus={fila.estatus} />
        </td>
        <td>{fila.accion}</td>
      </tr>
      {abierto &&
        fila.banners.map((b) => (
          <tr key={b.bannerCode} className="row row--detalle">
            <td></td>
            <td className="mute" colSpan={2}>
              ↳ {b.banner}
            </td>
            <td className="mute" colSpan={3}>
              {fmtNum(b.vendidas)} vendidas / {fmtNum(b.recibido)} recibidas
            </td>
            <td></td>
            <td className="num">{fmtPct(b.sellThru)}</td>
            <td className="num">{fmtNum(b.inventarioActual)}</td>
            <td>
              <StatusChip estatus={b.estatus} />
            </td>
            <td className="mute">{fmtDinero(b.valorInventario)}</td>
          </tr>
        ))}
    </>
  );
}

function EmptyState() {
  return (
    <div className="empty">
      <div className="empty__icon">🚦</div>
      <p className="empty__title">Aún no hay datos</p>
      <p className="empty__text">
        Importa un archivo CSV o Excel para ver el semáforo de SKUs.
      </p>
    </div>
  );
}
