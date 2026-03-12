const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    return res.json();
  }

  async createSession(data: {
    interviewType: string;
    targetRole: string;
    targetCompany?: string;
  }) {
    return this.request<{ id: string }>("POST", "/api/sessions", data);
  }

  async endSession(sessionId: string) {
    return this.request("PATCH", `/api/sessions/${sessionId}`, {
      status: "COMPLETED",
      endedAt: new Date().toISOString(),
    });
  }

  async detectQuestion(transcript: string) {
    return this.request<{
      detected: boolean;
      question?: string;
      type?: string;
      confidence?: number;
    }>("POST", "/api/ai/detect-question", { transcript });
  }

  async generateAnswer(
    question: string,
    questionType: string,
    targetRole?: string
  ) {
    return this.request<{
      framework: string;
      keyPoints: string[];
      hints: string[];
      fullText?: string;
    }>("POST", "/api/ai/generate-answer", {
      question,
      questionType,
      targetRole,
    });
  }

  async generateFeedback(sessionId: string) {
    return this.request("POST", "/api/ai/session-feedback", { sessionId });
  }
}

export const apiClient = new ApiClient();
