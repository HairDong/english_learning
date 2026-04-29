import { NextResponse } from "next/server";
import { resolveAIClient } from "@/lib/ai-client";
import { practiceRequestSchema, practiceResponseSchema } from "@/lib/vocabulary-schema";

export async function POST(request: Request) {
  let body: unknown = null;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const parsed = practiceRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { word, meaning, topic, level, apiKey, baseURL, model, googleApiKey, googleModel } = parsed.data;
  const ai = resolveAIClient({ apiKey, baseURL, model, googleApiKey, googleModel });

  if (!ai) {
    return NextResponse.json(
      { error: "No API key configured. Please add an OpenAI key, Google API key, or configure a Custom Route in Settings." },
      { status: 500 }
    );
  }

  const useModel = ai.defaultModel;
  const topicText = topic ? `Topic: ${topic}.` : "";

  const prompt = `Create one short Vietnamese sentence about the word "${word}" (meaning: ${meaning}). ${topicText} Then provide the correct English sentence using the word "${word}". The English sentence must match CEFR level ${level} and be natural. Return ONLY JSON with {"english":"...","vietnamese":"..."}.`;

  try {
    const completion = await ai.client.chat.completions.create({
      model: useModel,
      messages: [
        { role: "system", content: "You are a helpful assistant. Output must be valid JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const outputText = completion.choices[0]?.message?.content ?? "{}";
    let json: unknown = null;
    try { json = JSON.parse(outputText); }
    catch { return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 502 }); }

    const validated = practiceResponseSchema.safeParse(json);
    if (!validated.success) {
      return NextResponse.json({ error: "AI response validation failed" }, { status: 502 });
    }
    return NextResponse.json(validated.data);
  } catch (error) {
    console.error("AI practice error", error);
    return NextResponse.json({ error: "Failed to generate practice" }, { status: 500 });
  }
}
