// ============================================================================
// REGLAS DE LIQUIDACION (editables - NO hardcodeadas en la UI)
// Aqui se ajustan umbrales, objetivos, rampa, mapeo de banners y acciones.
// Cambiar este archivo NO requiere tocar ningun componente.
// ============================================================================

import type { Estatus } from "../schema/types";

export interface Rules {
  /**
   * Objetivo final por defecto mientras "alcance" siga pendiente.
   * (0.85 = 85%, como si todo fuera "total tienda" / nacional).
   */
  objetivoDefault: number;

  /**
   * Objetivos finales por alcance (se activan cuando definamos de que columna
   * sale el alcance). Por ahora la app usa objetivoDefault.
   */
  objetivosPorAlcance: {
    nacional: number;        // total tienda
    ciertasTiendas: number;  // ciertas tiendas
  };

  /** Semanas sobre las que sube la rampa del objetivo (1a..4a semana). */
  semanasRampa: number;

  /**
   * Umbrales del semaforo, medidos como AVANCE = sellThru / objetivoDeLaSemana.
   *  - avance >= objetivo   -> verde  (En objetivo)
   *  - avance >= riesgo      -> amarillo (En riesgo)
   *  - resto                 -> rojo   (Critico)
   */
  umbralesAvance: {
    objetivo: number; // 1.0
    riesgo: number;   // 0.8
  };

  /** Mapeo de codigos de banner (columna "Sel Store Trait") a nombre legible. */
  banners: Record<string, string>;

  /** Accion sugerida segun el estatus del semaforo. */
  acciones: Record<Estatus, string>;

  /** Etiquetas legibles del estatus. */
  etiquetas: Record<Estatus, string>;
}

export const rules: Rules = {
  objetivoDefault: 0.85,

  objetivosPorAlcance: {
    nacional: 0.85,
    ciertasTiendas: 1.0,
  },

  semanasRampa: 4,

  umbralesAvance: {
    objetivo: 1.0,
    riesgo: 0.8,
  },

  banners: {
    "297": "Walmart",
    // Otros codigos quedan genericos ("Banner <codigo>") hasta confirmarlos.
    // Ejemplos vistos en el CSV de muestra (por confirmar):
    // "1312": "Banner 1312",
    // "9": "Banner 9",
  },

  acciones: {
    objetivo: "Seguimiento",
    riesgo: "Promocion",
    critico: "Markdown / Negociacion",
  },

  etiquetas: {
    objetivo: "En objetivo",
    riesgo: "En riesgo",
    critico: "Critico",
  },
};

/** Devuelve el nombre legible de un banner a partir de su codigo. */
export function nombreBanner(codigo: string, r: Rules = rules): string {
  const c = (codigo ?? "").trim();
  if (!c) return "Sin banner";
  return r.banners[c] ?? `Banner ${c}`;
}
