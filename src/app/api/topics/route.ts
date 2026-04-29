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

  const { count, apiKey, baseURL, model, googleApiKey, googleModel } = parsed.data;
  const ai = resolveAIClient({ apiKey, baseURL, model, googleApiKey, googleModel });

  if (!ai) {
    return NextResponse.json(
      { error: "No API key configured. Please add an OpenAI key, Google API key, or configure a Custom Route in Settings." },
      { status: 500 }
    );
  }

  const num = count ?? 8;
  const prompt = `Generate ${num} English-learning topics for everyday life. Short topics (1-3 words). No duplicates. Return ONLY JSON with {"topics": ["..."]}.`;

  try {
    const completion = await ai.client.chat.completions.create({
      model: ai.defaultModel,
      messages: [
        { role: "system", content: "You are a helpful assistant. Output must be valid JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const outputText = completion.choices[0]?.message?.content ?? "{}";
    let json: unknown = null;
    try { json = JSON.parse(outputText); }
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
