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

  const { word, meaning, topic, level, apiKey, baseURL, model } = parsed.data;
  const ai = resolveAIClient({ apiKey, baseURL, model });

  if (!ai) {
    return NextResponse.json({ error: "No API key configured. Add your OpenAI key in Settings." }, { status: 500 });
  }

  const useModel = ai.defaultModel;
  const topicText = topic ? `Topic: ${topic}.` : "";

  const prompt = `Create one short Vietnamese sentence about the word "${word}" (meaning: ${meaning}). ${topicText} Then provide the correct English sentence using the word "${word}". The English sentence must match CEFR level ${level} and be natural. Return ONLY JSON with {"english":"...","vietnamese":"..."}.`;

  try {
    const response = await ai.client.responses.create({
      model: useModel,
      input: [
        { role: "system", content: "You are a helpful assistant. Output must be valid JSON only." },
        { role: "user", content: prompt },
      ],
      text: {
        format: {
          type: "json_schema",
          strict: true,
          name: "practice",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["english", "vietnamese"],
            properties: {
              english: { type: "string" },
              vietnamese: { type: "string" },
            },
          },
        },
      },
      temperature: 0.5,
    });

    let json: unknown = null;
    try { json = JSON.parse(response.output_text ?? "{}"); }
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
