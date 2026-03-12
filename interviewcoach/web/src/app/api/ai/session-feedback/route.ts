import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatCompletion } from "@/lib/openai";
import { z } from "zod";

const inputSchema = z.object({
  sessionId: z.string(),
});

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const body = await req.json();
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input" } },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
      { status: 404 }
    );
  }

  const session = await db.interviewSession.findFirst({
    where: { id: parsed.data.sessionId, userId: user.id },
    include: {
      transcriptChunks: { orderBy: { sequence: "asc" } },
      detectedQuestions: { include: { suggestedAnswers: true } },
    },
  });

  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Session not found" } },
      { status: 404 }
    );
  }

  const fullTranscript = session.transcriptChunks
    .map((c) => c.text)
    .join(" ");

  const questions = session.detectedQuestions.map((q) => q.text);

  const systemPrompt = `You are an expert interview performance coach. Analyze the interview transcript and provide detailed feedback.
Return JSON:
{
  "clarityScore": <0-100>,
  "relevanceScore": <0-100>,
  "confidenceScore": <0-100>,
  "structureScore": <0-100>,
  "concisenessScore": <0-100>,
  "overallScore": <0-100>,
  "fillerWords": { "um": <count>, "like": <count>, "you know": <count>, "basically": <count>, "actually": <count> },
  "pacingWpm": <words per minute>,
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "strengths": ["<strength 1>", "<strength 2>"],
  "detailedReport": {
    "summary": "<2-3 sentence summary>",
    "questionByQuestion": [{ "question": "<q>", "assessment": "<assessment>", "score": <0-100> }]
  }
}`;

  const durationMin = session.durationMs
    ? session.durationMs / 60000
    : undefined;
  const wordCount = fullTranscript.split(/\s+/).length;

  const userMessage = `Transcript (${wordCount} words${durationMin ? `, ${durationMin.toFixed(1)} minutes` : ""}):
${fullTranscript}

Questions detected: ${questions.join("; ")}

Interview type: ${session.interviewType}
Target role: ${session.targetRole ?? "not specified"}`;

  const result = await chatCompletion(
    systemPrompt + "\nOnly respond with valid JSON.",
    userMessage,
    { temperature: 0.3, maxTokens: 2048 }
  );

  try {
    const feedbackData = JSON.parse(result);

    const feedback = await db.coachingFeedback.upsert({
      where: { sessionId: session.id },
      create: {
        sessionId: session.id,
        clarityScore: feedbackData.clarityScore,
        relevanceScore: feedbackData.relevanceScore,
        confidenceScore: feedbackData.confidenceScore,
        structureScore: feedbackData.structureScore,
        concisenessScore: feedbackData.concisenessScore,
        overallScore: feedbackData.overallScore,
        fillerWords: feedbackData.fillerWords,
        pacingWpm: feedbackData.pacingWpm,
        suggestions: feedbackData.suggestions,
        detailedReport: feedbackData.detailedReport,
      },
      update: {
        clarityScore: feedbackData.clarityScore,
        relevanceScore: feedbackData.relevanceScore,
        confidenceScore: feedbackData.confidenceScore,
        structureScore: feedbackData.structureScore,
        concisenessScore: feedbackData.concisenessScore,
        overallScore: feedbackData.overallScore,
        fillerWords: feedbackData.fillerWords,
        pacingWpm: feedbackData.pacingWpm,
        suggestions: feedbackData.suggestions,
        detailedReport: feedbackData.detailedReport,
      },
    });

    return NextResponse.json({ success: true, data: feedback });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "AI_ERROR", message: "Failed to generate feedback" } },
      { status: 500 }
    );
  }
}
