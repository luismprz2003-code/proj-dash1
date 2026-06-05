// Evita que se abra una ventana de consola en Windows en modo release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tablero_sellthru_lib::run()
}
