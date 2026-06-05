import type { Estatus } from "../schema/types";
import { rules } from "../config/rules";

export function StatusChip({ estatus }: { estatus: Estatus }) {
  return (
    <span className={`chip chip--${estatus}`}>
      <span className="chip__dot" />
      {rules.etiquetas[estatus]}
    </span>
  );
}
