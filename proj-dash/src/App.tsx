import { useEffect, useMemo, useState } from "react";
import { Sidebar, type Seccion } from "./components/Sidebar";
import { FilterBar } from "./components/FilterBar";
import { KpiCards } from "./components/KpiCards";
import { SkuTable } from "./components/SkuTable";
import { AlertsPanel } from "./components/AlertsPanel";
import { Charts } from "./components/Charts";
import { ImportDialog } from "./components/ImportDialog";
import { FooterNotes } from "./components/FooterNotes";
import { emptyDatabase, type Database } from "./schema/types";
import { loadDb, saveDb } from "./storage/store";
import { aplicarImportacion, type ModoImport } from "./domain/merge";
import type { FilaNormalizada } from "./adapters/types";
import {
  calcularKpis,
  construirAlertas,
  construirSemaforo,
  evolucionSellThru,
  excedentePorClave,
  filtrosVacios,
  semanasDisponibles,
  type FiltrosTablero,
} from "./domain/kpis";

export default function App() {
  const [db, setDb] = useState<Database>(emptyDatabase());
  const [filtros, setFiltros] = useState<FiltrosTablero>(filtrosVacios);
  const [seccion, setSeccion] = useState<Seccion>("resumen");
  const [importAbierto, setImportAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    loadDb().then((d) => {
      setDb(d);
      setCargando(false);
    });
  }, []);

  const semanas = useMemo(() => semanasDisponibles(db), [db]);
  const filas = useMemo(() => construirSemaforo(db, filtros), [db, filtros]);
  const kpis = useMemo(() => calcularKpis(filas), [filas]);
  const alertas = useMemo(() => construirAlertas(filas), [filas]);
  const evolucion = useMemo(() => evolucionSellThru(db), [db]);
  const porFormato = useMemo(() => excedentePorClave(filas, "formato"), [filas]);
  const porCategoria = useMemo(() => excedentePorClave(filas, "categoria"), [filas]);

  const formatos = useMemo(
    () => [...new Set(db.skus.map((s) => s.formato).filter(Boolean))].sort(),
    [db]
  );
  const categorias = useMemo(
    () => [...new Set(db.skus.map((s) => s.categoria).filter(Boolean))].sort(),
    [db]
  );
  const banners = useMemo(
    () => [...new Set(db.snapshots.map((s) => s.banner).filter(Boolean))].sort(),
    [db]
  );

  const fechaActualizacion = db.meta.updatedAt
    ? new Date(db.meta.updatedAt).toLocaleDateString("es-MX")
    : "—";

  const onAplicarImport = async (
    nuevasFilas: FilaNormalizada[],
    semana: number,
    modo: ModoImport
  ) => {
    const nuevaDb = aplicarImportacion(db, nuevasFilas, semana, modo);
    setDb(nuevaDb);
    await saveDb(nuevaDb);
    setFiltros((f) => ({ ...f, semana }));
  };

  const semanaSugerida = semanas.length ? semanas[semanas.length - 1] + 1 : 1;

  return (
    <div className="layout">
      <Sidebar activa={seccion} onCambiar={setSeccion} />

      <main className="main">
        <header className="topbar">
          <div className="topbar__title">
            <h1>DASHBOARD COMPRAS ESPECIALES</h1>
            <p>Seguimiento de Sell Thru y Desempeño</p>
          </div>
          <div className="topbar__right">
            <FilterBar
              filtros={filtros}
              onCambiar={setFiltros}
              semanas={semanas}
              formatos={formatos}
              categorias={categorias}
              banners={banners}
            />
            <div className="topbar__meta">
              <button className="btn btn--primary" onClick={() => setImportAbierto(true)}>
                + Importar datos
              </button>
              <span className="topbar__fecha">Actualización: {fechaActualizacion}</span>
            </div>
          </div>
        </header>

        {cargando ? (
          <div className="empty">
            <p className="empty__text">Cargando…</p>
          </div>
        ) : (
          <div className="content">
            <KpiCards kpis={kpis} />

            <div className="grid-2">
              <SkuTable filas={filas} limite={6} />
              <AlertsPanel criticos={alertas.criticos} enRiesgo={alertas.enRiesgo} />
            </div>

            <Charts evolucion={evolucion} porFormato={porFormato} porCategoria={porCategoria} />

            <FooterNotes />
          </div>
        )}
      </main>

      <ImportDialog
        abierto={importAbierto}
        semanaSugerida={semanaSugerida}
        onCerrar={() => setImportAbierto(false)}
        onAplicar={onAplicarImport}
      />
    </div>
  );
}
