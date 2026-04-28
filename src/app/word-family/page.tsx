"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Network, Volume2, Sparkles } from "lucide-react";
import { useSettingsStore } from "@/store/settings-store";

const POS_COLORS: Record<string, string> = {
  noun: "bg-violet-100 text-violet-700",
  verb: "bg-sky-100 text-sky-700",
  adjective: "bg-emerald-100 text-emerald-700",
  adverb: "bg-amber-100 text-amber-700",
  other: "bg-slate-100 text-slate-600",
};

const POS_LABELS: Record<string, string> = {
  noun: "n.", verb: "v.", adjective: "adj.", adverb: "adv.", other: "other",
};

type FamilyMember = {
  word: string;
  partOfSpeech: string;
  meaning: string;
  collocations: string[];
  example: string;
};

type WordFamilyResult = {
  rootMeaning: string;
  family: FamilyMember[];
};

function speak(word: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export default function WordFamilyPage() {
  const { getActiveConfig } = useSettingsStore();
  const [rootWord, setRootWord] = useState("");
  const [result, setResult] = useState<WordFamilyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const handleSearch = async (word?: string) => {
    const q = (word ?? rootWord).trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const config = getActiveConfig();

    try {
      const res = await fetch("/api/word-family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rootWord: q, ...config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setResult(data as WordFamilyResult);
      setHistory((prev) => [q, ...prev.filter((h) => h !== q)].slice(0, 10));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const grouped = result
    ? result.family.reduce<Record<string, FamilyMember[]>>((acc, m) => {
        const pos = m.partOfSpeech || "other";
        (acc[pos] = acc[pos] || []).push(m);
        return acc;
      }, {})
    : {};

  const posOrder = ["noun", "verb", "adjective", "adverb", "other"];
  const sortedPos = Object.keys(grouped).sort(
    (a, b) => (posOrder.indexOf(a) ?? 99) - (posOrder.indexOf(b) ?? 99)
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Word Family</h1>
          <p className="text-sm text-muted-foreground">
            Nhập một từ gốc để khám phá toàn bộ họ từ liên quan (noun, verb, adj, adv,…).
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Nhập từ gốc, e.g. decide, economy, happy…"
            value={rootWord}
            onChange={(e) => setRootWord(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button
            type="button"
            className="rounded-full bg-sky-600 text-white hover:bg-sky-700 gap-2"
            onClick={() => handleSearch()}
            disabled={loading || !rootWord.trim()}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Network className="h-4 w-4" />}
            {loading ? "Đang tạo…" : "Tra cứu"}
          </Button>
        </div>

        {/* History chips */}
        {history.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {history.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => { setRootWord(h); handleSearch(h); }}
                className="rounded-full border border-border/60 px-3 py-1 text-sm text-muted-foreground hover:border-sky-400 hover:text-sky-600 transition-colors"
              >
                {h}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </p>
        )}

        {result && (
          <div className="space-y-4">
            {/* Root header */}
            <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground">{rootWord}</span>
                  <button
                    type="button"
                    onClick={() => speak(rootWord)}
                    className="rounded-full border border-sky-300 px-2 py-0.5 text-xs text-sky-600 hover:bg-sky-100 transition-colors flex items-center gap-1"
                  >
                    <Volume2 className="h-3 w-3" /> Phát âm
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{result.rootMeaning}</p>
              </div>
            </div>

            {/* Family grouped by POS */}
            <div className="space-y-3">
              {sortedPos.map((pos) => (
                <div key={pos}>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge className={`${POS_COLORS[pos] ?? POS_COLORS.other} text-xs font-semibold`}>
                      {POS_LABELS[pos] ?? pos}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">{pos}</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {grouped[pos].map((member, i) => (
                      <Card key={i} className="border-border/60 shadow-sm">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground text-lg">{member.word}</span>
                                <button
                                  type="button"
                                  onClick={() => speak(member.word)}
                                  className="text-muted-foreground hover:text-sky-600 transition-colors"
                                >
                                  <Volume2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <p className="text-sm text-muted-foreground">{member.meaning}</p>
                            </div>
                          </div>

                          {member.collocations.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {member.collocations.map((c, ci) => (
                                <span
                                  key={ci}
                                  className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="text-sm text-muted-foreground italic flex gap-1.5">
                            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
                            {member.example}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
