import { useSessionStore } from "../../stores/session-store";

export function AnswerPanel() {
  const { answers, activeQuestionId, questions } = useSessionStore();

  const activeAnswer = answers.find(
    (a) => a.questionId === activeQuestionId
  );

  const activeQuestion = questions.find((q) => q.id === activeQuestionId);

  if (!activeQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-slate-500 text-sm">
          <div className="text-2xl mb-2">💡</div>
          <p>Select a detected question to see coaching suggestions.</p>
          <p className="text-xs mt-1">
            AI will suggest answer frameworks, key points, and follow-ups.
          </p>
        </div>
      </div>
    );
  }

  if (!activeAnswer) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-slate-400 text-sm">
          <div className="animate-pulse text-2xl mb-2">🤔</div>
          <p>Generating coaching suggestions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Framework badge */}
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 rounded bg-blue-600/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
          {activeAnswer.framework}
        </span>
      </div>

      {/* Key Points */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Key Points to Cover
        </h3>
        <ul className="space-y-1.5">
          {activeAnswer.keyPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
              <span className="text-blue-400 mt-0.5 shrink-0">•</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      {/* Hints */}
      {activeAnswer.hints && activeAnswer.hints.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Hints & Tips
          </h3>
          <ul className="space-y-1.5">
            {activeAnswer.hints.map((hint, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-amber-400 mt-0.5 shrink-0">→</span>
                {hint}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Full suggested text */}
      {activeAnswer.fullText && (
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Example Answer Structure
          </h3>
          <div className="bg-slate-800/50 rounded-lg p-3 text-sm text-slate-300 leading-relaxed border border-slate-700">
            {activeAnswer.fullText}
          </div>
        </div>
      )}
    </div>
  );
}
