"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { VocabularyCard } from "@/components/vocabulary-card";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVocabularyStore } from "@/store/vocabulary-store";
import { useHydrated } from "@/hooks/use-hydrated";

export default function VocabularyPage() {
  const hydrated = useHydrated();
  const items = useVocabularyStore((state) => state.items);
  const getTopics = useVocabularyStore((state) => state.getTopics);
  const removeItem = useVocabularyStore((state) => state.removeItem);
  const clearAll = useVocabularyStore((state) => state.clearAll);
  const addExamples = useVocabularyStore((state) => state.addExamples);
  const level = useVocabularyStore((state) => state.level);

  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");

  const topics = useMemo(
    () => (hydrated ? getTopics() : []),
    [hydrated, getTopics, items]
  );

  const filtered = useMemo(() => {
    if (!hydrated) return [];
    return items.filter((item) => {
      const matchTopic = topic === "all" || item.topic === topic;
      const matchQuery =
        item.word.toLowerCase().includes(query.toLowerCase()) ||
        item.meaning.toLowerCase().includes(query.toLowerCase());
      return matchTopic && matchQuery;
    });
  }, [hydrated, items, query, topic]);

  const handleExport = () => {
    const dataStr = JSON.stringify(items, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hoctienganh-vocabulary-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">My Vocabulary</h1>
            <p className="text-sm text-muted-foreground">
              Review, filter, or clean up your saved words.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild className="rounded-full bg-sky-600 text-white hover:bg-sky-700">
              <Link href="/add">
                <Plus className="mr-2 h-4 w-4" /> Add Word
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full text-sky-700 border-sky-200 hover:bg-sky-50"
              onClick={handleExport}
              disabled={items.length === 0}
            >
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={clearAll}
            >
              Clear all
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
          <Input
            placeholder="Search by word or meaning"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All topics</SelectItem>
              {topics.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No vocabulary found. Try generating new words or adding them manually.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((item) => (
              <VocabularyCard
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.id)}
                onAddExamples={(examples) => addExamples(item.id, examples)}
                level={level}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
