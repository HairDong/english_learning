import { NextResponse } from "next/server";
import { resolveAIClient } from "@/lib/ai-client";
import {
  exampleRequestSchema,
  exampleResponseSchema,
} from "@/lib/vocabulary-schema";

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = exampleRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { word, meaning, topic, level, count, apiKey, baseURL, model, googleApiKey, googleModel } = parsed.data;
  const finalCount = count ?? 2;

  const ai = resolveAIClient({ apiKey, baseURL, model, googleApiKey, googleModel });
  if (!ai) {
    return NextResponse.json(
      { error: "No API key configured. Please add an OpenAI key, Google API key, or configure a Custom Route in Settings." },
      { status: 500 }
    );
  }

  const topicText = topic ? `Topic: ${topic}.` : "";
  const prompt = `Create ${finalCount} short, natural English example sentences using the word "${word}" (meaning: ${meaning}). ${topicText} The sentences must match CEFR level ${level} and clearly demonstrate usage. Return ONLY JSON with {"examples": ["..."]}. `;

  try {
    const completion = await ai.client.chat.completions.create({
      model: ai.defaultModel,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Output must be valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const outputText = completion.choices[0]?.message?.content ?? "{}";
    let json: unknown = null;
    try {
      json = JSON.parse(outputText);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON" },
        { status: 502 }
      );
    }

    const validated = exampleResponseSchema.safeParse(json);
    if (!validated.success) {
      return NextResponse.json(
        { error: "AI response validation failed" },
        { status: 502 }
      );
    }

    return NextResponse.json(validated.data);
  } catch (error) {
    console.error("AI examples error", error);
    if ((error as any)?.status) {
      return NextResponse.json(
        {
          error: "Failed to generate examples",
          details: {
            status: (error as any).status,
            message: (error as any).message,
            code: (error as any).code,
            type: (error as any).type,
          },
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Failed to generate examples" },
      { status: 500 }
    );
  }
}
