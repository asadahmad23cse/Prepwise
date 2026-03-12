import { useEffect, useRef } from "react";
import { useSessionStore } from "../../stores/session-store";

export function TranscriptPanel() {
  const { transcript, status } = useSessionStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  if (status === "completed") {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {transcript.map((chunk) => (
          <div key={chunk.id} className="text-sm text-slate-300">
            <span className="text-xs text-slate-500 font-mono mr-2">
              {formatMs(chunk.timestamp)}
            </span>
            {chunk.text}
          </div>
        ))}
        <div className="text-center text-sm text-slate-500 mt-4 py-4 border-t border-slate-800">
          Session ended. Review your coaching feedback.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {transcript.length === 0 ? (
        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
          <div className="text-center">
            <div className="text-2xl mb-2">🎙️</div>
            <p>Speak into your microphone.</p>
            <p className="text-xs mt-1">Your speech will appear here in real time.</p>
          </div>
        </div>
      ) : (
        transcript.map((chunk) => (
          <div
            key={chunk.id}
            className={`text-sm transition-opacity ${
              chunk.isFinal ? "text-slate-200" : "text-slate-400 italic"
            }`}
          >
            <span className="text-xs text-slate-600 font-mono mr-2">
              {formatMs(chunk.timestamp)}
            </span>
            {chunk.text}
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
