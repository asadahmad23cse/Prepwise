import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { chatCompletion } from "@/lib/openai";
import { z } from "zod";

const inputSchema = z.object({
  transcript: z.string().min(10),
  context: z.string().optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
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

  const systemPrompt = `You are an interview question detector. Given a transcript segment, identify if it contains an interview question.
If a question is detected, respond with JSON:
{ "detected": true, "question": "<the question>", "type": "behavioral"|"technical"|"situational"|"system_design"|"general", "confidence": 0.0-1.0 }
If no question is detected, respond: { "detected": false }
Only respond with valid JSON.`;

  const result = await chatCompletion(systemPrompt, parsed.data.transcript, {
    temperature: 0.2,
    maxTokens: 256,
  });

  try {
    const data = JSON.parse(result);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: true, data: { detected: false } });
  }
}
