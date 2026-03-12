import { useSessionStore } from "../../stores/session-store";

const typeColors: Record<string, string> = {
  behavioral: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  technical: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  situational: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  system_design: "bg-green-500/20 text-green-300 border-green-500/30",
  general: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export function QuestionPanel() {
  const { questions, activeQuestionId, setActiveQuestion } = useSessionStore();

  if (questions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-slate-500 text-sm">
          <div className="text-2xl mb-2">❓</div>
          <p>Questions will be detected from your conversation.</p>
          <p className="text-xs mt-1">
            The AI listens for interview questions and classifies them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      {questions.map((question) => (
        <button
          key={question.id}
          onClick={() => setActiveQuestion(question.id)}
          className={`w-full text-left p-3 rounded-lg border transition-colors ${
            activeQuestionId === question.id
              ? "bg-slate-800 border-blue-500/50"
              : "bg-slate-900 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-start gap-2 mb-1">
            <span
              className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
                typeColors[question.type] ?? typeColors.general
              }`}
            >
              {question.type.replace("_", " ")}
            </span>
          </div>
          <p className="text-sm text-slate-200 mt-1">{question.text}</p>
          <p className="text-xs text-slate-500 mt-1">
            Detected at {formatMs(question.detectedAt)}
          </p>
        </button>
      ))}
    </div>
  );
}

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
