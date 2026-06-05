import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";
import type { BarraExcedente, PuntoEvolucion } from "../domain/kpis";
import { fmtDineroCompacto, fmtPct } from "../utils/format";

interface Props {
  evolucion: PuntoEvolucion[];
  porFormato: BarraExcedente[];
  porCategoria: BarraExcedente[];
}

const AZUL = "#1e40af";
const AZUL_CLARO = "#60a5fa";

export function Charts({ evolucion, porFormato, porCategoria }: Props) {
  return (
    <div className="charts">
      <ChartCard titulo="Evolución de Sell Thru promedio">
        {evolucion.length === 0 ? (
          <ChartEmpty />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={evolucion.map((p) => ({ ...p, pct: p.sellThru * 100 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <ReferenceArea y1={80} y2={85} fill="#dbeafe" fillOpacity={0.5} />
              <XAxis dataKey="semana" tickFormatter={(s) => `Sem ${s}`} fontSize={12} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={12} />
              <Tooltip formatter={(v: number) => fmtPct(v / 100)} labelFormatter={(l) => `Semana ${l}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="pct"
                name="Sell Thru promedio"
                stroke={AZUL}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard titulo="Excedentes por Formato">
        {porFormato.length === 0 ? (
          <ChartEmpty />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={porFormato}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="nombre" fontSize={12} />
              <YAxis tickFormatter={fmtDineroCompacto} fontSize={12} />
              <Tooltip formatter={(v: number) => fmtDineroCompacto(v)} />
              <Bar dataKey="valor" name="$ en riesgo" fill={AZUL} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard titulo="Excedentes por Categoría">
        {porCategoria.length === 0 ? (
          <ChartEmpty />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={porCategoria} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis type="number" tickFormatter={fmtDineroCompacto} fontSize={12} />
              <YAxis type="category" dataKey="nombre" width={120} fontSize={11} />
              <Tooltip formatter={(v: number) => fmtDineroCompacto(v)} />
              <Bar dataKey="valor" name="$ en riesgo" radius={[0, 4, 4, 0]}>
                {porCategoria.map((_, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? AZUL : AZUL_CLARO} />
                ))}
              </Bar>
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
