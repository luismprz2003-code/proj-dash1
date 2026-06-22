import { useEffect, useMemo, useState } from "react";
import { Sidebar, type Seccion } from "./components/Sidebar";
import { FilterBar } from "./components/FilterBar";
import { KpiCards } from "./components/KpiCards";
import { SkuTable } from "./components/SkuTable";
import { AlertsPanel } from "./components/AlertsPanel";
import { Charts } from "./components/Charts";
import { ImportDialog } from "./components/ImportDialog";
import { FooterNotes } from "./components/FooterNotes";
import { DatosPanel } from "./components/DatosPanel";
import { emptyDatabase, type Database } from "./schema/types";
import { loadDb, saveDb } from "./storage/store";
import {
  aplicarImportacion,
  eliminarImportacion,
  listarImportaciones,
  periodosDisponibles,
  ultimoPeriodo,
  type ModoImport,
} from "./domain/merge";
import type { FilaNormalizada } from "./adapters/types";
import { periodoSiguiente, type Periodo } from "./domain/periodo";
import {
  calcularKpis,
  construirAlertas,
  construirInsights,
  construirSemaforo,
  filtrosVacios,
  semaforoPorEstatus,
  sellThruPorFormato,
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

  const periodos = useMemo(() => periodosDisponibles(db), [db]);
  const importaciones = useMemo(() => listarImportaciones(db), [db]);
  const filas = useMemo(() => construirSemaforo(db, filtros), [db, filtros]);
  const kpis = useMemo(() => calcularKpis(filas), [filas]);
  const alertas = useMemo(() => construirAlertas(filas), [filas]);
  const insights = useMemo(() => construirInsights(filas, kpis), [filas, kpis]);
  const porEstatus = useMemo(() => semaforoPorEstatus(filas), [filas]);
  const porFormato = useMemo(() => sellThruPorFormato(filas), [filas]);

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
    periodo: Periodo,
    modo: ModoImport,
    fileName: string
  ) => {
    const nuevaDb = aplicarImportacion(db, nuevasFilas, periodo, modo, fileName);
    setDb(nuevaDb);
    await saveDb(nuevaDb);
    setFiltros((f) => ({ ...f, periodo }));
  };

  const onBorrarImport = async (id: string) => {
    const nuevaDb = eliminarImportacion(db, id);
    setDb(nuevaDb);
    await saveDb(nuevaDb);
    setFiltros((f) => {
      if (f.periodo === "ultimo") return f;
      const queda = periodosDisponibles(nuevaDb);
      const sigue = queda.some(
        (p) =>
          p.anio === f.periodo.anio &&
          p.mes === f.periodo.mes &&
          p.semanaMes === f.periodo.semanaMes
      );
      return sigue ? f : { ...f, periodo: "ultimo" as const };
    });
  };

  const periodoSugerido = useMemo(
    () => periodoSiguiente(ultimoPeriodo(db)),
    [db]
  );

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
            {seccion === "resumen" && (
              <FilterBar
                filtros={filtros}
                onCambiar={setFiltros}
                periodos={periodos}
                formatos={formatos}
                categorias={categorias}
                banners={banners}
              />
            )}
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
        ) : seccion === "datos" ? (
          <div className="content">
            <DatosPanel importaciones={importaciones} onBorrar={onBorrarImport} />
          </div>
        ) : seccion === "resumen" ? (
          <div className="content">
            <KpiCards kpis={kpis} />

            <div className="grid-2">
              <SkuTable filas={filas} limite={6} />
              <AlertsPanel criticos={alertas.criticos} enRiesgo={alertas.enRiesgo} />
            </div>

            <Charts porEstatus={porEstatus} porFormato={porFormato} />

            <FooterNotes insights={insights} />
          </div>
        ) : (
          <div className="content">
            <div className="empty">
              <p className="empty__title">Próximamente</p>
              <p className="empty__text">Esta sección estará disponible en una siguiente versión.</p>
            </div>
          </div>
        )}
      </main>

      <ImportDialog
        abierto={importAbierto}
        periodoSugerido={periodoSugerido}
        onCerrar={() => setImportAbierto(false)}
        onAplicar={onAplicarImport}
      />
    </div>
  );
}
