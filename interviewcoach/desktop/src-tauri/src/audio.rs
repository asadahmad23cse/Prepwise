// Audio capture module using cpal
// In production, this handles:
// 1. Enumerating input devices
// 2. Creating an audio stream from the selected device
// 3. Converting to the format expected by the STT service (16kHz mono PCM)
// 4. Emitting audio chunks via Tauri events to the frontend

pub struct AudioCapture {
    // stream handle, sample rate, channel count
}

impl AudioCapture {
    pub fn new() -> Self {
        AudioCapture {}
    }

    pub fn list_devices() -> Vec<String> {
        // Use cpal::default_host().input_devices() in production
        vec!["Default Microphone".to_string()]
    }

    pub fn start(&mut self, _device_name: &str) -> Result<(), String> {
        // 1. Get the device by name
        // 2. Build input stream config (16kHz, mono, f32)
        // 3. Start stream, sending chunks via channel
        Ok(())
    }

    pub fn stop(&mut self) -> Result<(), String> {
        // Drop the stream handle
        Ok(())
    }
}
