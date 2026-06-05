# Adaptadores de datos (ingesta tipo "plugin")

El tablero **solo** lee del esquema canónico (`src/schema/types.ts`). Cada fuente de
datos se conecta mediante un **adaptador** que implementa la misma interfaz
(`DataAdapter` en `types.ts`) y devuelve **filas normalizadas**.

## Adaptadores actuales

- `csvExcelAdapter.ts` — v1: arrastrar/soltar o abrir un **CSV o Excel** (parseado en
  el navegador con SheetJS).

## Cómo agregar uno nuevo (ej. API o Google Sheets)

1. Crea `miFuenteAdapter.ts` que exporte un objeto que cumpla `DataAdapter`:

   ```ts
   import type { DataAdapter } from "./types";

   export const miFuenteAdapter: DataAdapter = {
     id: "mi-fuente",
     nombre: "Mi fuente",
     acepta: () => true,
     async obtenerDatos() {
       // ...trae datos y normalizalos al esquema canonico...
       return { filas: [], avisos: [] };
     },
   };
   ```

2. Regístralo en `registry.ts` agregándolo al arreglo `adapters`.

**No se toca la UI.** El tablero seguirá funcionando igual, solo cambia de dónde
salen los datos.

## Mapeo de columnas (CSV/Excel)

El mapeo real columna → campo canónico vive en `csvExcelAdapter.ts` (constante
`ALIAS`). Si el reporte cambia de nombres de columna, se ajusta ahí.
