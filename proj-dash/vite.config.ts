import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Puerto 5280 a proposito: evitamos 4000 y 5173 (reservados por otra app).
// En produccion Tauri embebe el webview, no se usa ningun puerto.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5280,
    strictPort: true,
    host: "127.0.0.1",
  },
  // Evita que Vite intente ofuscar mensajes utiles de Tauri en consola.
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "es2021",
    sourcemap: false,
  },
});
