import type { ReactNode } from "react";
import type { FiltrosTablero } from "../domain/kpis";
import type { Estatus } from "../schema/types";

interface Props {
  filtros: FiltrosTablero;
  onCambiar: (f: FiltrosTablero) => void;
  semanas: number[];
  formatos: string[];
  categorias: string[];
  banners: string[];
}

const ESTATUS: { value: Estatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "objetivo", label: "En objetivo" },
  { value: "riesgo", label: "En riesgo" },
  { value: "critico", label: "Crítico" },
];

export function FilterBar({ filtros, onCambiar, semanas, formatos, categorias, banners }: Props) {
  const set = (parcial: Partial<FiltrosTablero>) => onCambiar({ ...filtros, ...parcial });

  return (
    <div className="filterbar">
      <Filtro label="Semana">
        <select
          value={String(filtros.semana)}
          onChange={(e) =>
            set({ semana: e.target.value === "todas" ? "todas" : Number(e.target.value) })
          }
        >
          <option value="todas">Última</option>
          {semanas.map((s) => (
            <option key={s} value={s}>
              Semana {s}
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
          onChange={(e) => set({ estatus: e.target.value as Estatus | "todos" })}
        >
          {ESTATUS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
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
