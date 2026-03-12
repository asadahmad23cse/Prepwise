import { useSessionStore } from "../../stores/session-store";

export function SessionControls() {
  const { status, setStatus, endSession, elapsedMs, interviewType, targetRole } =
    useSessionStore();

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-14 flex items-center justify-between px-4 bg-slate-900 border-t border-slate-800 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {status === "active" && (
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
          <span className="text-xs text-slate-400 font-mono">
            {formatTime(elapsedMs)}
          </span>
        </div>
        <span className="text-xs text-slate-500">
          {interviewType} — {targetRole}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {status === "active" && (
          <>
            <button
              onClick={() => setStatus("paused")}
              className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-xs font-medium transition-colors"
            >
              Pause
            </button>
            <button
              onClick={endSession}
              className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-xs font-medium transition-colors"
            >
              End Session
            </button>
          </>
        )}

        {status === "paused" && (
          <>
            <button
              onClick={() => setStatus("active")}
              className="px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-xs font-medium transition-colors"
            >
              Resume
            </button>
            <button
              onClick={endSession}
              className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-xs font-medium transition-colors"
            >
              End Session
            </button>
          </>
        )}

        {status === "completed" && (
          <span className="text-xs text-slate-400">Session completed</span>
        )}
      </div>
    </div>
  );
}
