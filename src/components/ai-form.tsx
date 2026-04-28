"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { vocabularyListSchema } from "@/lib/vocabulary-schema";
import type { VocabularyInput } from "@/types/vocabulary";
import { useVocabularyStore } from "@/store/vocabulary-store";
import { useSettingsStore } from "@/store/settings-store";

type AIFormProps = {
  onGenerated: (items: VocabularyInput[], topic: string) => void;
};

export function AIForm({ onGenerated }: AIFormProps) {
  const level = useVocabularyStore((state) => state.level);
  const items = useVocabularyStore((state) => state.items);
  const topics = useVocabularyStore((state) => state.getTopics);
  const addTopics = useVocabularyStore((state) => state.addTopics);
  const { getActiveConfig } = useSettingsStore();
  const [topic, setTopic] = useState("Daily life");
  const [count, setCount] = useState(8);
  const [customTopic, setCustomTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topicOpen, setTopicOpen] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const topicOptions = topics();

  const handleGenerateTopics = async () => {
    setTopicsLoading(true);
    setError(null);
    const config = getActiveConfig();
    try {
      const response = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 8, ...config }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to generate topics");
      }
      const data = await response.json();
      if (!data?.topics || !Array.isArray(data.topics)) {
        throw new Error("Invalid AI response");
      }
      addTopics(data.topics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setTopicsLoading(false);
    }
  };

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);
    const finalTopic = customTopic.trim() || topic;
    const config = getActiveConfig();
    const existingWords = items.map(i => i.word).slice(0, 1000); // up to 1000 words to prevent large payload

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: finalTopic, count, level, existingWords, ...config }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to generate vocabulary");
      }
      const data = await response.json();
      const parsed = vocabularyListSchema.safeParse(data);
      if (!parsed.success) {
        throw new Error("AI response validation failed. Please try again.");
      }
      onGenerated(parsed.data, finalTopic);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <h2 className="text-lg font-semibold text-foreground">AI Vocabulary</h2>
        <p className="text-sm text-muted-foreground">
          Pick a topic and let AI craft natural, beginner-friendly vocabulary.
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          Current level:
          <Badge variant="outline">{level}</Badge>
          <span className="text-muted-foreground">(edit in Settings)</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Topic</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Popover open={topicOpen} onOpenChange={setTopicOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={topicOpen}
                  className="w-full justify-between rounded-full sm:w-65"
                >
                  {topic || "Choose a topic"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-65 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search topic..." />
                  <CommandList>
                    <CommandEmpty>No topic found.</CommandEmpty>
                    <CommandGroup>
                      {topicOptions.map((item) => (
                        <CommandItem
                          key={item}
                          value={item}
                          onSelect={(value) => {
                            setTopic(value);
                            setTopicOpen(false);
                          }}
                        >
                          <Check
                            className={
                              item === topic
                                ? "mr-2 h-4 w-4 opacity-100"
                                : "mr-2 h-4 w-4 opacity-0"
                            }
                          />
                          {item}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={handleGenerateTopics}
              disabled={topicsLoading}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {topicsLoading ? "Generating..." : "AI topics"}
            </Button>
          </div>
          <Input
            placeholder="Or type your own topic"
            value={customTopic}
            onChange={(event) => setCustomTopic(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Number of words</Label>
          <Input
            type="number"
            min={3}
            max={20}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
          />
        </div>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="w-full rounded-full bg-sky-600 text-white hover:bg-sky-700"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {loading ? "Generating..." : "Generate Vocabulary"}
        </Button>
      </CardContent>
    </Card>
  );
}
