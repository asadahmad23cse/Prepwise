import { useEffect, useRef } from "react";
import { useSessionStore } from "../../stores/session-store";
import { TranscriptPanel } from "./TranscriptPanel";
import { QuestionPanel } from "./QuestionPanel";
import { AnswerPanel } from "./AnswerPanel";
import { SessionControls } from "./SessionControls";

export function SessionWorkspace() {
  const { status, startedAt, updateElapsed, endSession } = useSessionStore();
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (status === "active" && startedAt) {
      timerRef.current = setInterval(() => {
        updateElapsed(Date.now() - startedAt);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, startedAt, updateElapsed]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: Transcript */}
        <div className="w-1/3 border-r border-slate-800 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-300">
              Live Transcript
            </h2>
          </div>
          <TranscriptPanel />
        </div>

        {/* Center panel: Detected Questions */}
        <div className="w-1/3 border-r border-slate-800 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-300">
              Detected Questions
            </h2>
          </div>
          <QuestionPanel />
        </div>

        {/* Right panel: Suggested Answers */}
        <div className="w-1/3 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-300">
              AI Coaching
            </h2>
          </div>
          <AnswerPanel />
        </div>
      </div>

      {/* Bottom controls */}
      <SessionControls />
    </div>
  );
}
