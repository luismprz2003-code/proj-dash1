import type { ReactNode } from "react";
import type { Periodo } from "../domain/periodo";
import { MESES, periodoKey, periodoLabel } from "../domain/periodo";
import type { FiltrosTablero } from "../domain/kpis";

interface Props {
  filtros: FiltrosTablero;
  onCambiar: (f: FiltrosTablero) => void;
  periodos: Periodo[];
  formatos: string[];
  categorias: string[];
  banners: string[];
}

export function FilterBar({
  filtros,
  onCambiar,
  periodos,
  formatos,
  categorias,
  banners,
}: Props) {
  const set = (parcial: Partial<FiltrosTablero>) => onCambiar({ ...filtros, ...parcial });

  const valorPeriodo =
    filtros.periodo === "ultimo" ? "ultimo" : periodoKey(filtros.periodo);

  return (
    <div className="filterbar">
      <Filtro label="Periodo">
        <select
          value={valorPeriodo}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "ultimo") {
              set({ periodo: "ultimo" });
              return;
            }
            const p = periodos.find((x) => periodoKey(x) === v);
            if (p) set({ periodo: p });
          }}
        >
          <option value="ultimo">Último importado</option>
          {[...periodos].reverse().map((p) => (
            <option key={periodoKey(p)} value={periodoKey(p)}>
              {periodoLabel(p)}
            </option>
          ))}
        </select>
      </Filtro>

      <Filtro label="Formato">
        <select value={filtros.formato} onChange={(e) => set({ formato: e.target.value })}>
          <option value="todos">Todos</option>
          {formatos.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </Filtro>

      <Filtro label="Categoría">
        <select value={filtros.categoria} onChange={(e) => set({ categoria: e.target.value })}>
          <option value="todas">Todas</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Filtro>

      <Filtro label="Banner">
        <select value={filtros.banner} onChange={(e) => set({ banner: e.target.value })}>
          <option value="todos">Todos</option>
          {banners.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </Filtro>

      <Filtro label="Estatus">
        <select
          value={filtros.estatus}
          onChange={(e) => set({ estatus: e.target.value as FiltrosTablero["estatus"] })}
        >
          <option value="todos">Todos</option>
          <option value="objetivo">En objetivo</option>
          <option value="riesgo">En riesgo</option>
          <option value="critico">Crítico</option>
        </select>
      </Filtro>
    </div>
  );
}

function Filtro({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="filterbar__field">
      <span className="filterbar__label">{label}</span>
      {children}
    </label>
  );
}

/** Selectores año / mes / semana para el modal de importación. */
export function PeriodoSelectores({
  periodo,
  onCambiar,
  anos,
}: {
  periodo: Periodo;
  onCambiar: (p: Periodo) => void;
  anos: number[];
}) {
  return (
    <div className="periodo-selectores">
      <label className="periodo-selectores__field">
        <span>Año</span>
        <select
          value={periodo.anio}
          onChange={(e) => onCambiar({ ...periodo, anio: Number(e.target.value) })}
        >
          {anos.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>
      <label className="periodo-selectores__field">
        <span>Mes</span>
        <select
          value={periodo.mes}
          onChange={(e) => onCambiar({ ...periodo, mes: Number(e.target.value) })}
        >
          {MESES.map((nombre, i) => (
            <option key={nombre} value={i + 1}>
              {nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="periodo-selectores__field">
        <span>Semana del mes</span>
        <select
          value={periodo.semanaMes}
          onChange={(e) => onCambiar({ ...periodo, semanaMes: Number(e.target.value) })}
        >
          {[1, 2, 3, 4, 5].map((s) => (
            <option key={s} value={s}>
              Semana {s}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
