import OpenAI from "openai";

const MODEL_PRIMARY = "gpt-4o";
const MODEL_FALLBACK = "gpt-4o-mini";

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error(
        "OPENAI_API_KEY is not set. Add it to .env.local to enable AI features."
      );
    }
    _openai = new OpenAI({ apiKey: key });
  }
  return _openai;
}

export async function chatCompletion(
  systemPrompt: string,
  userMessage: string,
  options?: { model?: string; temperature?: number; maxTokens?: number }
) {
  const model = options?.model ?? MODEL_PRIMARY;
  const client = getOpenAI();

  try {
    const response = await client.chat.completions.create({
      model,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    return response.choices[0]?.message?.content ?? "";
  } catch (error) {
    if (model === MODEL_PRIMARY) {
      const response = await client.chat.completions.create({
        model: MODEL_FALLBACK,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      });
      return response.choices[0]?.message?.content ?? "";
    }
    throw error;
  }
}

export async function streamCompletion(
  systemPrompt: string,
  userMessage: string,
  options?: { model?: string; temperature?: number; maxTokens?: number }
) {
  return getOpenAI().chat.completions.create({
    model: options?.model ?? MODEL_PRIMARY,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });
}
