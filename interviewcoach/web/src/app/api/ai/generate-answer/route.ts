import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { chatCompletion } from "@/lib/openai";
import { z } from "zod";

const inputSchema = z.object({
  question: z.string().min(5),
  questionType: z.enum(["behavioral", "technical", "situational", "system_design", "general"]),
  targetRole: z.string().optional(),
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

  const { question, questionType, targetRole } = parsed.data;

  const prompts: Record<string, string> = {
    behavioral: `You are a behavioral interview coach. For the given question, provide a STAR-format answer framework.
Return JSON:
{
  "framework": "STAR",
  "situation": "<what to describe>",
  "task": "<what responsibility to highlight>",
  "action": "<what actions to emphasize>",
  "result": "<what outcomes to mention>",
  "keyPoints": ["<point 1>", "<point 2>", "<point 3>"],
  "pitfalls": ["<common mistake 1>", "<common mistake 2>"],
  "exampleOpener": "<a strong opening sentence>"
}`,
    technical: `You are a technical interview coach. Provide a structured approach framework.
Return JSON:
{
  "framework": "Technical Approach",
  "clarifyingQuestions": ["<question to ask interviewer>"],
  "approach": "<high-level approach>",
  "keyPoints": ["<important concept 1>", "<important concept 2>"],
  "tradeoffs": ["<tradeoff to discuss>"],
  "complexity": "<time and space complexity if applicable>",
  "hints": ["<helpful hint>"]
}`,
    system_design: `You are a system design interview coach. Provide a structured design framework.
Return JSON:
{
  "framework": "System Design",
  "requirements": { "functional": ["<req>"], "nonFunctional": ["<req>"] },
  "highLevelDesign": "<description>",
  "keyComponents": ["<component>"],
  "dataModel": "<brief schema>",
  "scalingConsiderations": ["<consideration>"],
  "keyPoints": ["<point>"],
  "hints": ["<hint>"]
}`,
  };

  const systemPrompt = prompts[questionType] ?? prompts.behavioral!;
  const userMessage = `Question: ${question}${targetRole ? `\nTarget Role: ${targetRole}` : ""}`;

  const result = await chatCompletion(systemPrompt + "\nOnly respond with valid JSON.", userMessage, {
    temperature: 0.5,
    maxTokens: 1024,
  });

  try {
    const data = JSON.parse(result);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({
      success: true,
      data: { framework: "General", keyPoints: [result], hints: [] },
    });
  }
}
