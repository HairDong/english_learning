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

  const { word, meaning, topic, level, count, apiKey, baseURL, model } = parsed.data;
  const finalCount = count ?? 2;

  const ai = resolveAIClient({ apiKey, baseURL, model });
  if (!ai) {
    return NextResponse.json(
      { error: "No API key configured. Add your API key in Settings." },
      { status: 500 }
    );
  }

  const topicText = topic ? `Topic: ${topic}.` : "";
  const prompt = `Create ${finalCount} short, natural English example sentences using the word "${word}" (meaning: ${meaning}). ${topicText} The sentences must match CEFR level ${level} and clearly demonstrate usage. Return ONLY JSON with {"examples": ["..."]}.`;

  try {
    const response = await ai.client.responses.create({
      model: ai.defaultModel,
      input: [
        {
          role: "system",
          content: "You are a helpful assistant. Output must be valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      text: {
        format: {
          type: "json_schema",
          strict: true,
          name: "examples",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["examples"],
            properties: {
              examples: {
                type: "array",
                items: { type: "string" },
                minItems: 2,
                maxItems: 5,
              },
            },
          },
        },
      },
      temperature: 0.5,
    });

    const outputText = response.output_text ?? "{}";

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
    console.error("OpenAI examples error", error);
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
