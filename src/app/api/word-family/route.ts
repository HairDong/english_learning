import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAIClient } from "@/lib/ai-client";

const wordFamilyRequestSchema = z.object({
  rootWord: z.string().min(1),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  model: z.string().optional(),
});

export async function POST(request: Request) {
  let body: unknown = null;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const parsed = wordFamilyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { rootWord, apiKey, baseURL, model } = parsed.data;
  const ai = resolveAIClient({ apiKey, baseURL });

  if (!ai) {
    return NextResponse.json({ error: "No API key configured. Add your OpenAI key in Settings." }, { status: 500 });
  }

  const useModel = model || ai.defaultModel;

  const prompt = `Given the root word "${rootWord}", generate its word family. Include all common derivations across different parts of speech.
For each family member provide:
- "word": the derived word
- "partOfSpeech": noun|verb|adjective|adverb|other
- "meaning": short Vietnamese meaning
- "collocations": 1-2 example collocations (array, can be empty)
- "example": one natural English example sentence
Also include a "rootMeaning" string (Vietnamese meaning of the root).
Return ONLY JSON.`;

  try {
    const response = await ai.client.responses.create({
      model: useModel,
      input: [
        { role: "system", content: "You are a helpful English teacher. Output must be valid JSON only." },
        { role: "user", content: prompt },
      ],
      text: {
        format: {
          type: "json_schema",
          strict: true,
          name: "word_family",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["rootMeaning", "family"],
            properties: {
              rootMeaning: { type: "string" },
              family: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["word", "partOfSpeech", "meaning", "collocations", "example"],
                  properties: {
                    word: { type: "string" },
                    partOfSpeech: { type: "string" },
                    meaning: { type: "string" },
                    collocations: { type: "array", items: { type: "string" } },
                    example: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      temperature: 0.3,
    });

    let json: unknown = null;
    try { json = JSON.parse(response.output_text ?? "{}"); }
    catch { return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 502 }); }

    return NextResponse.json(json);
  } catch (error) {
    console.error("Word family error", error);
    return NextResponse.json({ error: "Failed to generate word family" }, { status: 500 });
  }
}
