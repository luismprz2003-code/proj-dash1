import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";
import type { BarraSellThru, SegmentoEstatus } from "../domain/kpis";
import { fmtPct } from "../utils/format";

interface Props {
  porEstatus: SegmentoEstatus[];
  porFormato: BarraSellThru[];
}

const COLORES_ESTATUS: Record<string, string> = {
  objetivo: "#16a34a",
  riesgo: "#d97706",
  critico: "#dc2626",
};

const AZUL = "#1e40af";

export function Charts({ porEstatus, porFormato }: Props) {
  return (
    <div className="charts">
      <ChartCard titulo="SKUs por Estatus">
        {porEstatus.length === 0 ? (
          <ChartEmpty />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={porEstatus}
                dataKey="cantidad"
                nameKey="etiqueta"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                label={({ etiqueta, cantidad }) => `${etiqueta}: ${cantidad}`}
              >
                {porEstatus.map((s) => (
                  <Cell key={s.estatus} fill={COLORES_ESTATUS[s.estatus]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number, _n, p) => [`${v} SKUs`, p.payload.etiqueta]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard titulo="Sell Thru Promedio por Formato">
        {porFormato.length === 0 ? (
          <ChartEmpty />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={porFormato.map((p) => ({ ...p, pct: p.sellThru * 100 }))} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={12} />
              <YAxis type="category" dataKey="nombre" width={72} fontSize={12} />
              <Tooltip formatter={(v: number) => fmtPct(v / 100)} />
              <Bar dataKey="pct" name="Sell Thru promedio" fill={AZUL} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="card chart-card">
      <header className="card__head">
        <h3 className="card__title">{titulo}</h3>
      </header>
      {children}
    </section>
  );
}

function ChartEmpty() {
  return (
    <div className="empty empty--chart">
      <p className="empty__text">Sin datos para graficar todavía.</p>
    </div>
  );
}
