import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { elegirAdaptador } from "../adapters/registry";
import type { FilaNormalizada } from "../adapters/types";
import type { ModoImport } from "../domain/merge";
import {
  anosDisponibles,
  periodoLabelLargo,
  type Periodo,
} from "../domain/periodo";
import { PeriodoSelectores } from "./FilterBar";

interface Props {
  abierto: boolean;
  periodoSugerido: Periodo;
  onCerrar: () => void;
  onAplicar: (
    filas: FilaNormalizada[],
    periodo: Periodo,
    modo: ModoImport,
    fileName: string
  ) => void;
}

type Estado =
  | { fase: "soltar" }
  | { fase: "leyendo"; nombre: string }
  | { fase: "revisar"; nombre: string; filas: FilaNormalizada[]; avisos: string[] }
  | { fase: "error"; mensaje: string };

export function ImportDialog({ abierto, periodoSugerido, onCerrar, onAplicar }: Props) {
  const [estado, setEstado] = useState<Estado>({ fase: "soltar" });
  const [periodo, setPeriodo] = useState<Periodo>(periodoSugerido);
  const [modo, setModo] = useState<ModoImport>("acumular");
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (abierto) setPeriodo(periodoSugerido);
  }, [abierto, periodoSugerido]);

  const procesar = useCallback(async (file: File) => {
    const adapter = elegirAdaptador(file.name);
    if (!adapter) {
      setEstado({
        fase: "error",
        mensaje: `Tipo de archivo no soportado: ${file.name}. Usa CSV o Excel (.xlsx, .xls).`,
      });
      return;
    }
    setEstado({ fase: "leyendo", nombre: file.name });
    try {
      const arrayBuffer = await file.arrayBuffer();
      const res = await adapter.obtenerDatos({ fileName: file.name, arrayBuffer });
      if (res.filas.length === 0) {
        setEstado({
          fase: "error",
          mensaje: res.avisos[0] ?? "No se pudieron leer filas del archivo.",
        });
        return;
      }
      setEstado({ fase: "revisar", nombre: file.name, filas: res.filas, avisos: res.avisos });
    } catch (err) {
      setEstado({ fase: "error", mensaje: `Error al leer el archivo: ${String(err)}` });
    }
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setArrastrando(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void procesar(file);
    },
    [procesar]
  );

  if (!abierto) return null;

  const cerrar = () => {
    setEstado({ fase: "soltar" });
    onCerrar();
  };

  const anos = anosDisponibles();

  return (
    <div className="modal-backdrop" onClick={cerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal__head">
          <h3>Importar archivo de datos</h3>
          <button className="modal__close" onClick={cerrar}>
            ✕
          </button>
        </header>

        {(estado.fase === "soltar" || estado.fase === "leyendo") && (
          <div
            className={`dropzone ${arrastrando ? "is-drag" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void procesar(f);
              }}
            />
            <div className="dropzone__icon">📥</div>
            {estado.fase === "leyendo" ? (
              <p>Leyendo {estado.nombre}…</p>
            ) : (
              <>
                <p className="dropzone__title">Arrastra tu CSV o Excel aquí</p>
                <p className="dropzone__hint">o haz clic para elegir un archivo</p>
              </>
            )}
          </div>
        )}

        {estado.fase === "error" && (
          <div className="import-error">
            <p>⚠️ {estado.mensaje}</p>
            <button className="btn" onClick={() => setEstado({ fase: "soltar" })}>
              Intentar con otro archivo
            </button>
          </div>
        )}

        {estado.fase === "revisar" && (
          <div className="import-review">
            <p className="import-review__ok">
              ✅ Se leyeron <strong>{estado.filas.length}</strong> filas de{" "}
              <strong>{estado.nombre}</strong>.
            </p>

            {estado.avisos.length > 0 && (
              <ul className="import-review__avisos">
                {estado.avisos.map((a, i) => (
                  <li key={i}>• {a}</li>
                ))}
              </ul>
            )}

            <div className="import-review__campo">
              <label>¿A qué periodo corresponde este archivo?</label>
              <p className="import-review__hint">
                Semana calendario del mes: días 1–7 = sem 1, 8–14 = sem 2, etc.
              </p>
              <PeriodoSelectores periodo={periodo} onCambiar={setPeriodo} anos={anos} />
            </div>

            <div className="import-review__campo">
              <label>¿Qué hacemos con los datos anteriores?</label>
              <div className="radio-row">
                <label className="radio">
                  <input
                    type="radio"
                    checked={modo === "acumular"}
                    onChange={() => setModo("acumular")}
                  />
                  Acumular historial (recomendado)
                </label>
                <label className="radio">
                  <input
                    type="radio"
                    checked={modo === "reemplazar"}
                    onChange={() => setModo("reemplazar")}
                  />
                  Reemplazar todo
                </label>
              </div>
            </div>

            <div className="modal__actions">
              <button className="btn btn--ghost" onClick={() => setEstado({ fase: "soltar" })}>
                Cancelar
              </button>
              <button
                className="btn btn--primary"
                onClick={() => {
                  onAplicar(estado.filas, periodo, modo, estado.nombre);
                  cerrar();
                }}
              >
                Importar {estado.filas.length} filas · {periodoLabelLargo(periodo)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
