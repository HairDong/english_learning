import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAIClient } from "@/lib/ai-client";

const completeRequestSchema = z.object({
  word: z.string().optional(),
  phonetic: z.string().optional(),
  meaning: z.string().optional(),
  vietnamese: z.string().optional(),
  example: z.string().optional(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  model: z.string().optional(),
});

export async function POST(request: Request) {
  let body: unknown = null;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const parsed = completeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { word, phonetic, meaning, vietnamese, example, level, apiKey, baseURL, model } = parsed.data;
  const ai = resolveAIClient({ apiKey, baseURL });

  if (!ai) {
    return NextResponse.json({ error: "No API key configured. Add your OpenAI key in Settings." }, { status: 500 });
  }

  const useModel = model || ai.defaultModel;

  const hints: string[] = [];
  if (word) hints.push(`English word: "${word}"`);
  if (phonetic) hints.push(`Phonetic (IPA): "${phonetic}"`);
  if (meaning) hints.push(`Vietnamese meaning: "${meaning}"`);
  if (vietnamese) hints.push(`Vietnamese text: "${vietnamese}"`);
  if (example) hints.push(`Example sentence: "${example}"`);

  const prompt = `You are an English-Vietnamese vocabulary assistant. Based on: ${hints.join(". ")}

Complete ALL fields for a vocabulary entry at CEFR level ${level}.
- "word": English word (infer from Vietnamese if needed)
- "phonetic": IPA transcription
- "meaning": Vietnamese translation (short, natural)
- "partOfSpeech": one of noun|verb|adjective|adverb|preposition|conjunction|pronoun|phrase|other
- "collocations": 1-3 common collocations/patterns (e.g. "decide + to do sth"). Empty array if none.
- "examples": 2-3 example sentences in English at CEFR ${level}

Return ONLY valid JSON.`;

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
          name: "complete_vocab",
          schema: {
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
      temperature: 0.3,
    });

    let json: unknown = null;
    try { json = JSON.parse(response.output_text ?? "{}"); }
    catch { return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 502 }); }

    const resultSchema = z.object({
      word: z.string(),
      phonetic: z.string(),
      meaning: z.string(),
      partOfSpeech: z.string(),
      collocations: z.array(z.string()),
      examples: z.array(z.string()).min(2),
    });

    const validated = resultSchema.safeParse(json);
    if (!validated.success) {
      return NextResponse.json({ error: "AI response validation failed" }, { status: 502 });
    }
    return NextResponse.json(validated.data);
  } catch (error) {
    console.error("AI complete error", error);
    return NextResponse.json({ error: "Failed to complete vocabulary" }, { status: 500 });
  }
}
