import { NextResponse } from "next/server";
import { resolveAIClient } from "@/lib/ai-client";
import { generateRequestSchema, vocabularyListSchema } from "@/lib/vocabulary-schema";

export async function POST(request: Request) {
  let body: unknown = null;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { topic, count, level, apiKey, baseURL, model, googleApiKey, googleModel, existingWords } = parsed.data;
  const ai = resolveAIClient({ apiKey, baseURL, model, googleApiKey, googleModel });

  if (!ai) {
    return NextResponse.json(
      { error: "No API key configured. Please add an OpenAI key, Google API key, or configure a Custom Route in Settings." },
      { status: 500 }
    );
  }

  const excludeText = existingWords && existingWords.length > 0
    ? `\nIMPORTANT: Do NOT generate any of the following words, as the user already has them: ${existingWords.join(", ")}`
    : "";

  const prompt = `Generate ${count} English vocabulary words about "${topic}" for CEFR level ${level} learners.${excludeText}
For each word include:
- word (English)
- phonetic (IPA)
- meaning (Vietnamese translation)
- partOfSpeech: one of noun|verb|adjective|adverb|preposition|conjunction|pronoun|phrase|other
- collocations: 1-3 common collocations/patterns (e.g. "decide + to do sth", "depend on sb/sth"). Empty array if none.
- examples: 2-3 natural sentences at ${level} level
Return ONLY valid JSON as an object with key "items" containing an array.`;

  try {
    const completion = await ai.client.chat.completions.create({
      model: ai.defaultModel,
      messages: [
        { role: "system", content: "You are a helpful assistant. Output must be valid JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const outputText = completion.choices[0]?.message?.content ?? "{}";
    let json: unknown = null;
    try { json = JSON.parse(outputText); }
    catch { return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 502 }); }

    const raw = typeof json === "object" && json && "items" in (json as object)
      ? (json as { items: unknown }).items : json;

    const validated = vocabularyListSchema.safeParse(raw);
    if (!validated.success) {
      return NextResponse.json({ error: "AI response validation failed", details: validated.error.flatten() }, { status: 502 });
    }
    return NextResponse.json(validated.data);
  } catch (error) {
    console.error("AI generate error", error);
    return NextResponse.json({ error: "Failed to generate vocabulary" }, { status: 500 });
  }
}
