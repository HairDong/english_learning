"use client";

import { useState } from "react";
import { Braces } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { vocabularyListSchema } from "@/lib/vocabulary-schema";
import type { VocabularyInput } from "@/types/vocabulary";

const exampleJson = `[
  {
    "word": "decide",
    "phonetic": "/dɪˈsaɪd/",
    "meaning": "quyết định",
    "partOfSpeech": "verb",
    "collocations": [
      "decide + to do sth",
      "decide on sth",
      "decide against sth"
    ],
    "examples": [
      "She decided to study abroad next year.",
      "We couldn't decide on a restaurant."
    ]
  }
]`;

type JSONInputProps = {
  onSave: (items: VocabularyInput[]) => void;
};

export function JSONInput({ onSave }: JSONInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);

    try {
      const parsed = JSON.parse(value);
      const validated = vocabularyListSchema.safeParse(parsed);

      if (!validated.success) {
        setError("JSON format is invalid. Please check your fields.");
        return;
      }

      onSave(validated.data);
      setValue("");
    } catch (err) {
      setError("Invalid JSON. Please paste a valid JSON array.");
    }
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <h2 className="text-lg font-semibold text-foreground">Manual JSON</h2>
        <p className="text-sm text-muted-foreground">
          Paste vocabulary JSON array. Các trường bắt buộc: <code className="text-xs bg-muted px-1 py-0.5 rounded">word</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">phonetic</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">meaning</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">examples</code> (≥2).
          Tuỳ chọn: <code className="text-xs bg-muted px-1 py-0.5 rounded">partOfSpeech</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">collocations</code>.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          className="min-h-55 text-sm"
          placeholder={exampleJson}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <Button
          type="button"
          className="w-full rounded-full bg-sky-600 text-white hover:bg-sky-700"
          onClick={handleSubmit}
        >
          <Braces className="mr-2 h-4 w-4" />
          Save Vocabulary
        </Button>
      </CardContent>
    </Card>
  );
}
