import type { InsightClave } from "../domain/kpis";

interface Props {
  insights: InsightClave[];
}

export function FooterNotes({ insights }: Props) {
  return (
    <div className="footer-notes">
      {insights.map((item) => (
        <div key={item.titulo} className="footer-note">
          <span className="footer-note__icon">{item.icono}</span>
          <div>
            <strong>{item.titulo}</strong>
            <p>{item.texto}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
