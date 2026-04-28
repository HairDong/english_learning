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

  const { topic, count, level, apiKey, baseURL, model, existingWords } = parsed.data;
  const ai = resolveAIClient({ apiKey, baseURL, model });

  if (!ai) {
    return NextResponse.json({ error: "No API key configured. Add your OpenAI key in Settings." }, { status: 500 });
  }

  const useModel = ai.defaultModel;

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
Return ONLY JSON as an object with key "items" containing an array.`;

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
          name: "vocabulary_list",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["items"],
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["word", "phonetic", "meaning", "partOfSpeech", "collocations", "examples"],
                  properties: {
                    word: { type: "string" },
                    phonetic: { type: "string" },
                    meaning: { type: "string" },
                    partOfSpeech: { type: "string" },
                    collocations: { type: "array", items: { type: "string" } },
                    examples: { type: "array", items: { type: "string" }, minItems: 2 },
                  },
                },
              },
            },
          },
        },
      },
      temperature: 0.4,
    });

    let json: unknown = null;
    try { json = JSON.parse(response.output_text ?? "{}"); }
    catch { return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 502 }); }

    const raw = typeof json === "object" && json && "items" in (json as object)
      ? (json as { items: unknown }).items : json;

    const validated = vocabularyListSchema.safeParse(raw);
    if (!validated.success) {
      return NextResponse.json({ error: "AI response validation failed" }, { status: 502 });
    }
    return NextResponse.json(validated.data);
  } catch (error) {
    console.error("AI generate error", error);
    return NextResponse.json({ error: "Failed to generate vocabulary" }, { status: 500 });
  }
}
