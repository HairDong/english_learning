"use client";

import type { VocabularyItem } from "@/types/vocabulary";
import { useState } from "react";
import { useSettingsStore } from "@/store/settings-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles, Trash2, Volume2 } from "lucide-react";

type VocabularyCardProps = {
  item: VocabularyItem;
  onRemove?: () => void;
  onAddExamples?: (examples: string[]) => void;
  level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
};

export function VocabularyCard({
  item,
  onRemove,
  onAddExamples,
  level = "A1",
}: VocabularyCardProps) {
  const { getActiveConfig } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSpeak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(item.word);
    utterance.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleGenerateExamples = async () => {
    if (!onAddExamples) return;
    setError(null);
    setLoading(true);

    const config = getActiveConfig();

    try {
      const response = await fetch("/api/examples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: item.word,
          meaning: item.meaning,
          topic: item.topic,
          level,
          count: 2,
          ...config,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to generate examples");
      }

      const data = await response.json();
      if (!data?.examples || !Array.isArray(data.examples)) {
        throw new Error("Invalid AI response");
      }

      onAddExamples(data.examples);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{item.word}</h3>
          <p className="text-sm text-muted-foreground">{item.phonetic}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleSpeak}
            aria-label="Pronounce"
          >
            <Volume2 className="h-4 w-4" />
          </Button>
          {onRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              aria-label="Remove"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {item.partOfSpeech && (
            <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">
              {item.partOfSpeech}
            </Badge>
          )}
          <Badge variant="secondary">Mastery: {item.mastery}/5</Badge>
          {item.topic ? <Badge variant="outline">{item.topic}</Badge> : null}
        </div>
        <p className="text-sm font-medium text-foreground">{item.meaning}</p>
        {item.collocations && item.collocations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.collocations.map((col, i) => (
              <span
                key={i}
                className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs text-amber-700"
              >
                {col}
              </span>
            ))}
          </div>
        )}
        {onAddExamples ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateExamples}
            disabled={loading}
            className="rounded-full"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {loading ? "Generating..." : "Add context examples"}
          </Button>
        ) : null}
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
        <div className="space-y-2 text-sm text-muted-foreground">
          {item.examples.map((example, index) => (
            <p key={index}>• {example}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
