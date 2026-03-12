#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod audio;
mod commands;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_audio_devices,
            commands::start_audio_capture,
            commands::stop_audio_capture,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
