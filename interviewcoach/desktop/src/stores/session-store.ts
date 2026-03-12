import { create } from "zustand";

export type SessionStatus = "idle" | "setup" | "active" | "paused" | "completed";

export interface TranscriptChunk {
  id: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export interface DetectedQuestion {
  id: string;
  text: string;
  type: "behavioral" | "technical" | "situational" | "system_design" | "general";
  detectedAt: number;
}

export interface SuggestedAnswer {
  questionId: string;
  framework: string;
  keyPoints: string[];
  hints: string[];
  fullText?: string;
}

interface SessionState {
  status: SessionStatus;
  sessionId: string | null;
  interviewType: string;
  targetRole: string;
  targetCompany: string;
  startedAt: number | null;
  elapsedMs: number;

  transcript: TranscriptChunk[];
  questions: DetectedQuestion[];
  answers: SuggestedAnswer[];
  activeQuestionId: string | null;

  setStatus: (status: SessionStatus) => void;
  setSessionConfig: (config: {
    interviewType: string;
    targetRole: string;
    targetCompany: string;
  }) => void;
  startSession: (sessionId: string) => void;
  endSession: () => void;
  addTranscriptChunk: (chunk: TranscriptChunk) => void;
  addQuestion: (question: DetectedQuestion) => void;
  addAnswer: (answer: SuggestedAnswer) => void;
  setActiveQuestion: (id: string | null) => void;
  updateElapsed: (ms: number) => void;
  reset: () => void;
}

const initialState = {
  status: "idle" as SessionStatus,
  sessionId: null,
  interviewType: "MIXED",
  targetRole: "",
  targetCompany: "",
  startedAt: null,
  elapsedMs: 0,
  transcript: [],
  questions: [],
  answers: [],
  activeQuestionId: null,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,

  setStatus: (status) => set({ status }),

  setSessionConfig: (config) => set(config),

  startSession: (sessionId) =>
    set({
      sessionId,
      status: "active",
      startedAt: Date.now(),
      transcript: [],
      questions: [],
      answers: [],
    }),

  endSession: () => set({ status: "completed" }),

  addTranscriptChunk: (chunk) =>
    set((state) => ({
      transcript: [...state.transcript, chunk],
    })),

  addQuestion: (question) =>
    set((state) => ({
      questions: [...state.questions, question],
      activeQuestionId: question.id,
    })),

  addAnswer: (answer) =>
    set((state) => ({
      answers: [...state.answers, answer],
    })),

  setActiveQuestion: (id) => set({ activeQuestionId: id }),

  updateElapsed: (ms) => set({ elapsedMs: ms }),

  reset: () => set(initialState),
}));
