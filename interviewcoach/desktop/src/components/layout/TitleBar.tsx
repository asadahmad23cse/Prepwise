import { useSessionStore } from "../../stores/session-store";

export function TitleBar() {
  const { status, elapsedMs } = useSessionStore();

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      data-tauri-drag-region
      className="h-10 flex items-center justify-between px-4 bg-slate-900 border-b border-slate-800 shrink-0"
    >
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-xs font-bold">
          P
        </div>
        <span className="text-sm font-semibold text-slate-300">
          PrepWise — Mock Interview Practice
        </span>
      </div>

      <div className="flex items-center gap-4">
        {status === "active" && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-mono">
              {formatTime(elapsedMs)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
