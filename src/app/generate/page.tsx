"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AIForm } from "@/components/ai-form";
import { VocabularyCard } from "@/components/vocabulary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { VocabularyInput } from "@/types/vocabulary";
import { useVocabularyStore } from "@/store/vocabulary-store";

export default function GeneratePage() {
  const [generated, setGenerated] = useState<VocabularyInput[]>([]);
  const [topic, setTopic] = useState<string>("");
  const addItems = useVocabularyStore((state) => state.addItems);

  const handleGenerated = (items: VocabularyInput[], selectedTopic: string) => {
    setGenerated(items);
    setTopic(selectedTopic);
  };

  const handleSave = () => {
    addItems(
      generated.map((item) => ({ ...item, topic })),
      "ai"
    );
    setGenerated([]);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Generate with AI</h1>
          <p className="text-sm text-muted-foreground">
            Get a personalized vocabulary list with phonetics and examples.
          </p>
        </div>

        <AIForm onGenerated={handleGenerated} />

        {generated.length > 0 ? (
          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Preview</h2>
                  <p className="text-sm text-muted-foreground">
                    Topic: {topic}. Save all to add them to your library.
                  </p>
                </div>
                <Button
                  type="button"
                  className="rounded-full bg-sky-600 text-white hover:bg-sky-700"
                  onClick={handleSave}
                >
                  Save all
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {generated.map((item) => (
                  <VocabularyCard
                    key={`${item.word}-${item.phonetic}`}
                    item={{
                      id: `${item.word}-${item.phonetic}`,
                      word: item.word,
                      phonetic: item.phonetic,
                      meaning: item.meaning,
                      examples: item.examples,
                      mastery: 0,
                      nextReview: new Date().toISOString(),
                      createdAt: new Date().toISOString(),
                      source: "ai",
                      topic,
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
