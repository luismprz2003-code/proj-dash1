use std::fs;

/// Devuelve (creandola si no existe) la carpeta `data/` que vive AL LADO del
/// ejecutable. Esto hace la app 100% PORTABLE: todos los datos quedan junto al
/// .exe; borrar esa carpeta elimina todo sin tocar %APPDATA% ni el registro.
#[tauri::command]
fn data_dir() -> Result<String, String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let dir = exe
        .parent()
        .ok_or_else(|| "No se pudo obtener la carpeta del ejecutable".to_string())?
        .join("data");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![data_dir])
        .run(tauri::generate_context!())
        .expect("error al iniciar la aplicacion de Tauri");
}
