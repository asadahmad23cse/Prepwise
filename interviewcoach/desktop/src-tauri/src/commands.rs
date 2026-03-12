use serde::Serialize;

#[derive(Serialize)]
pub struct AudioDevice {
    pub name: String,
    pub id: String,
}

#[tauri::command]
pub fn get_audio_devices() -> Vec<AudioDevice> {
    // In production, enumerate real devices via cpal
    vec![AudioDevice {
        name: "Default Microphone".to_string(),
        id: "default".to_string(),
    }]
}

#[tauri::command]
pub fn start_audio_capture(device_id: String) -> Result<String, String> {
    // In production, start capturing audio from the selected device
    // and stream chunks via Tauri events
    Ok(format!("Capture started on device: {}", device_id))
}

#[tauri::command]
pub fn stop_audio_capture() -> Result<String, String> {
    // In production, stop the audio capture stream
    Ok("Capture stopped".to_string())
}
