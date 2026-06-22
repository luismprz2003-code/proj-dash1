import { useState } from "react";
import type { Importacion } from "../schema/types";
import { MESES, periodoLabelLargo } from "../domain/periodo";
import { fmtNum } from "../utils/format";

interface Props {
  importaciones: Importacion[];
  onBorrar: (id: string) => void;
}

export function DatosPanel({ importaciones, onBorrar }: Props) {
  const [confirmarId, setConfirmarId] = useState<string | null>(null);

  return (
    <section className="card datos-panel">
      <header className="card__head">
        <div>
          <h2 className="card__title">Datos importados</h2>
          <p className="datos-panel__sub">
            Historial de archivos cargados. Borrar un periodo elimina todos sus snapshots.
          </p>
        </div>
        <span className="datos-panel__count">{importaciones.length} importación(es)</span>
      </header>

      {importaciones.length === 0 ? (
        <div className="empty">
          <div className="empty__icon">📂</div>
          <p className="empty__title">Sin datos importados</p>
          <p className="empty__text">
            Usa el botón «Importar datos» para cargar un CSV o Excel.
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="datos-table">
            <thead>
              <tr>
                <th>Año</th>
                <th>Mes</th>
                <th>Sem. mes</th>
                <th>Archivo</th>
                <th className="num">Filas</th>
                <th>Importado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {importaciones.map((imp) => (
                <tr key={imp.id}>
                  <td>{imp.periodo.anio}</td>
                  <td>{MESES[imp.periodo.mes - 1]}</td>
                  <td className="num">{imp.periodo.semanaMes}</td>
                  <td className="datos-table__file" title={imp.fileName}>
                    {imp.fileName}
                  </td>
                  <td className="num">{fmtNum(imp.filas)}</td>
                  <td className="datos-table__fecha">
                    {new Date(imp.importadoEn).toLocaleString("es-MX", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="datos-table__acciones">
                    {confirmarId === imp.id ? (
                      <span className="datos-table__confirm">
                        <button
                          className="btn btn--danger btn--sm"
                          onClick={() => {
                            onBorrar(imp.id);
                            setConfirmarId(null);
                          }}
                        >
                          Confirmar
                        </button>
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => setConfirmarId(null)}
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        className="btn btn--ghost btn--sm btn--danger-text"
                        onClick={() => setConfirmarId(imp.id)}
                        title={`Borrar ${periodoLabelLargo(imp.periodo)}`}
                      >
                        🗑 Borrar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
