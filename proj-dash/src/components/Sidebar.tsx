export type Seccion = "resumen" | "skus" | "analisis" | "alertas" | "descargas";

const ITEMS: { id: Seccion; label: string; icon: string }[] = [
  { id: "resumen", label: "Resumen", icon: "▦" },
  { id: "skus", label: "SKUs", icon: "▤" },
  { id: "analisis", label: "Análisis", icon: "￪" },
  { id: "alertas", label: "Alertas", icon: "！" },
  { id: "descargas", label: "Descargas", icon: "↓" },
];

interface Props {
  activa: Seccion;
  onCambiar: (s: Seccion) => void;
}

export function Sidebar({ activa, onCambiar }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo" title="Compras Especiales">
        🛒
      </div>
      <nav className="sidebar__nav">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            className={`sidebar__item ${activa === item.id ? "is-active" : ""}`}
            onClick={() => onCambiar(item.id)}
          >
            <span className="sidebar__icon">{item.icon}</span>
            <span className="sidebar__label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
