import { NextResponse } from "next/server";
import { resolveAIClient } from "@/lib/ai-client";
import { topicGenerateRequestSchema, topicGenerateResponseSchema } from "@/lib/vocabulary-schema";

export async function POST(request: Request) {
  let body: unknown = null;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const parsed = topicGenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { count, apiKey, baseURL, model } = parsed.data;
  const ai = resolveAIClient({ apiKey, baseURL });

  if (!ai) {
    return NextResponse.json({ error: "No API key configured. Add your OpenAI key in Settings." }, { status: 500 });
  }

  const useModel = model || ai.defaultModel;
  const num = count ?? 8;
  const prompt = `Generate ${num} English-learning topics for everyday life. Short topics (1-3 words). No duplicates. Return ONLY JSON with {"topics": ["..."]}.`;

  try {
    const response = await ai.client.responses.create({
      model: useModel,
      input: [
        { role: "system", content: "You are a helpful assistant. Output must be valid JSON only." },
        { role: "user", content: prompt },
      ],
      text: {
        format: {
          type: "json_schema", strict: true, name: "topics",
          schema: {
            type: "object", additionalProperties: false, required: ["topics"],
            properties: { topics: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 20 } },
          },
        },
      },
      temperature: 0.6,
    });

    let json: unknown = null;
    try { json = JSON.parse(response.output_text ?? "{}"); }
    catch { return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 502 }); }

    const validated = topicGenerateResponseSchema.safeParse(json);
    if (!validated.success) {
      return NextResponse.json({ error: "AI response validation failed" }, { status: 502 });
    }
    return NextResponse.json(validated.data);
  } catch (error) {
    console.error("AI topics error", error);
    return NextResponse.json({ error: "Failed to generate topics" }, { status: 500 });
  }
}
