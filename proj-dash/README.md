# Tablero Sell Thru — Compras Especiales

App de escritorio **portable para Windows** que muestra un **semáforo** de seguimiento
de liquidación de artículos (Sell Thru / excedentes). Lee tus archivos **CSV/Excel** y
pinta cada SKU en 🟢 / 🟡 / 🔴 según su avance contra el objetivo.

- **Portable:** todo vive en una carpeta `data/` **al lado del `.exe`**. No usa
  `%APPDATA%` ni el registro. **Borrar la carpeta = se borra todo, sin rastro.**
- **Para el usuario final:** extraer un `.zip` y doble clic. Sin instalar nada.
- **Stack:** Tauri + React + Vite (TypeScript). Datos en `data/db.json`.

---

## 👤 Para la persona que USA el tablero (0 técnico)

1. Recibe el archivo **`TableroSellThru-portable.zip`**.
2. Clic derecho → **Extraer todo**.
3. Doble clic a **`Tablero Sell Thru.exe`**.
4. Clic en **“+ Importar datos”** y arrastra tu **CSV o Excel** (o el botón “Abrir archivo”).
5. Elige a qué **semana** corresponde y si quieres **acumular** historial o **reemplazar**.

Listo: KPIs, semáforo, alertas y gráficas se llenan solos.

> La primera vez Windows puede mostrar *“Windows protegió tu PC”* (porque el `.exe` no
> está firmado). Es normal: **Más información → Ejecutar de todos modos**. Solo pasa una vez.

---

## 🏭 Para generar el `.exe` (tú, el dev) — SIN tocar tu Mac

Como estás en Mac y la app es para Windows, el `.exe` se compila en la nube con
**GitHub Actions**. **No se instala ni configura nada en tu computadora.**

### Opción recomendada: subir por el navegador (sin git)

1. Crea una cuenta gratis en **github.com** (usa un correo **personal**, no el del trabajo).
2. Crea un **repositorio nuevo** (puede ser privado).
3. Sube esta carpeta:
   - En el repo vacío: **“uploading an existing file”** → arrastra **todos** los archivos
     de esta carpeta (incluida la carpeta `.github`).
   - Confirma con **Commit changes**.
4. Ve a la pestaña **Actions** → el flujo **“Compilar Windows (portable)”** corre solo.
   (Si no arranca, ábrelo y dale **Run workflow**.)
5. Cuando termine (✓ verde), entra al run y en **Artifacts** descarga
   **`TableroSellThru-portable`**. Ese `.zip` es el que le pasas a la persona final.

> No necesitas tarjeta de crédito, ni instalar nada, ni saber programar.
> Tu cuenta de Salesforce y tu sistema quedan intactos.

---

## 💻 (Opcional) Previsualizar la UI en tu Mac

Esto **sí** descarga dependencias de Node en esta carpeta (solo aquí, nada global).
Es opcional; solo si quieres ver la interfaz sin compilar el `.exe`:

```bash
npm install      # instala dependencias (solo dentro de esta carpeta)
npm run dev      # abre la UI en http://127.0.0.1:5280
```

En este modo (navegador) los datos se guardan en `localStorage` en vez de `data/db.json`.

---

## 🗂️ Estructura

```
src/
  schema/      Esquema canónico (única fuente de verdad) + normalización
  adapters/    Ingesta tipo "plugin": CSV/Excel (futuro: API, Sheets)
  config/      rules.ts — umbrales, objetivos, banners, acciones (EDITABLE)
  storage/     Lee/escribe data/db.json (o localStorage en dev)
  domain/      Cálculo del semáforo, KPIs, alertas, datos de gráficas
  components/   UI (sidebar, filtros, KPIs, tabla semáforo, alertas, gráficas, import)
src-tauri/     App nativa de Windows (Rust) + config + permisos
scripts/       gen-icon.mjs (genera iconos en CI, sin binarios en el repo)
.github/workflows/build-windows.yml   Compilación del .exe + .zip portable
sample-data/   CSV de ejemplo para probar
```

## 🧮 Cómo se calcula el semáforo

- **Sell Thru** = `POS Qty ÷ Net Ship Qty` (vendidas ÷ recibido). A nivel SKU se **suman**
  los banners (no se promedian %).
- **Objetivo de la semana** (rampa sobre las primeras 4 semanas):
  `objetivo_semana = objetivoDefault × min(semana,4)/4`. Hoy `objetivoDefault = 85%`.
- **Avance** = `Sell Thru ÷ objetivo_semana`.
  - 🟢 En objetivo: avance ≥ 100%
  - 🟡 En riesgo: 80% – 100%
  - 🔴 Crítico: < 80%
- Todo es **editable** en `src/config/rules.ts` (umbrales, objetivos, rampa, banners, acciones).

## 🔌 Mapeo de columnas (CSV real → esquema)

Definido en `src/adapters/csvExcelAdapter.ts` (constante `ALIAS`). Resumen:

| Campo | Columna |
|---|---|
| SKU | `Item Nbr` |
| Descripción | `Item Desc 1` |
| Fineline | `Fineline` + `Fineline Desc` |
| Categoría | `CAT` |
| Formato | `Store Type Descr` |
| Banner | `Sel Store Trait` (`297` → Walmart; otros, genéricos) |
| Vendidas / Recibido | `POS Qty` / `Net Ship Qty` |
| Inventario / $ riesgo | `Curr Str On Hand Qty` / `Curr Str On Hand Retail` |

## ⏳ Pendientes anotados (no bloquean el MVP)

- **Alcance** (nacional 85% vs ciertas tiendas 100%): falta definir de qué columna sale.
  Mientras tanto se usa **85%** para todos. Al definirlo, se activa solo en `rules.ts`.
- **Códigos de banner** distintos a `297`: quedan genéricos hasta confirmarlos.
- **WebView2:** el `.zip` usa el modo *bootstrapper* (ligero; en Windows 10/11 ya viene
  instalado). Para 100% offline garantizado se puede cambiar a *fixedRuntime* en
  `src-tauri/tauri.conf.json` (zip más pesado).
- **Carpeta vigilada** para soltar archivos: hoy está arrastrar/soltar + botón; la
  detección automática de una carpeta es un siguiente paso.
