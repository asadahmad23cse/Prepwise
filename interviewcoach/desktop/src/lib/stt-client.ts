type STTCallback = (data: {
  text: string;
  isFinal: boolean;
  confidence: number;
}) => void;

export class DeepgramSTTClient {
  private ws: WebSocket | null = null;
  private onTranscript: STTCallback;
  private apiKey: string;

  constructor(apiKey: string, onTranscript: STTCallback) {
    this.apiKey = apiKey;
    this.onTranscript = onTranscript;
  }

  connect() {
    const url = `wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1&model=nova-2&punctuate=true&interim_results=true&utterance_end_ms=1000`;

    this.ws = new WebSocket(url, ["token", this.apiKey]);

    this.ws.onopen = () => {
      console.log("Deepgram STT connected");
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const transcript = data.channel?.alternatives?.[0];

        if (transcript?.transcript) {
          this.onTranscript({
            text: transcript.transcript,
            isFinal: data.is_final ?? false,
            confidence: transcript.confidence ?? 0,
          });
        }
      } catch {
        // Ignore parse errors for non-transcript messages
      }
    };

    this.ws.onerror = (event) => {
      console.error("Deepgram STT error:", event);
    };

    this.ws.onclose = () => {
      console.log("Deepgram STT disconnected");
    };
  }

  sendAudio(audioData: Float32Array) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    // Convert Float32Array to Int16Array (linear16)
    const int16 = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      const s = Math.max(-1, Math.min(1, audioData[i]!));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    this.ws.send(int16.buffer);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
