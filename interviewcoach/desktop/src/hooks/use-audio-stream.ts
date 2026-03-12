import { useState, useRef, useCallback } from "react";

interface UseAudioStreamOptions {
  onAudioData: (audioData: Float32Array) => void;
  sampleRate?: number;
}

export function useAudioStream({ onAudioData, sampleRate = 16000 }: UseAudioStreamOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const start = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const audioContext = new AudioContext({ sampleRate });
      const source = audioContext.createMediaStreamSource(stream);

      // Using ScriptProcessorNode for simplicity; AudioWorklet in production
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        onAudioData(new Float32Array(inputData));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      streamRef.current = stream;
      processorRef.current = processor;
      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to access microphone");
    }
  }, [onAudioData, sampleRate]);

  const stop = useCallback(() => {
    processorRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    audioContextRef.current?.close();

    processorRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
    setIsRecording(false);
  }, []);

  return { isRecording, error, start, stop };
}
