import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAIClient } from "@/lib/ai-client";

const wordFamilyRequestSchema = z.object({
  rootWord: z.string().min(1),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  model: z.string().optional(),
  googleApiKey: z.string().optional(),
  googleModel: z.string().optional(),
});

export async function POST(request: Request) {
  let body: unknown = null;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const parsed = wordFamilyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { rootWord, apiKey, baseURL, model, googleApiKey, googleModel } = parsed.data;
  const ai = resolveAIClient({ apiKey, baseURL, model, googleApiKey, googleModel });

  if (!ai) {
    return NextResponse.json(
      { error: "No API key configured. Please add an OpenAI key, Google API key, or configure a Custom Route in Settings." },
      { status: 500 }
    );
  }

  const useModel = ai.defaultModel;

  const prompt = `Given the root word "${rootWord}", generate its word family. Include all common derivations across different parts of speech.
For each family member provide:
- "word": the derived word
- "partOfSpeech": noun|verb|adjective|adverb|other
- "meaning": short Vietnamese meaning
- "collocations": 1-2 example collocations (array, can be empty)
- "example": one natural English example sentence
Also include a "rootMeaning" string (Vietnamese meaning of the root).
Return ONLY valid JSON.`;

  try {
    const completion = await ai.client.chat.completions.create({
      model: useModel,
      messages: [
        { role: "system", content: "You are a helpful English teacher. Output must be valid JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const outputText = completion.choices[0]?.message?.content ?? "{}";
    let json: unknown = null;
    try { json = JSON.parse(outputText); }
    catch { return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 502 }); }

    return NextResponse.json(json);
  } catch (error) {
    console.error("Word family error", error);
    return NextResponse.json({ error: "Failed to generate word family" }, { status: 500 });
  }
}
