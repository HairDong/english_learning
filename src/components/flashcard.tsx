"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Volume2 } from "lucide-react";
import type { VocabularyItem } from "@/types/vocabulary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type FlashcardProps = {
  item: VocabularyItem;
  onKnow: () => void;
  onDontKnow: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export function Flashcard({
  item,
  onKnow,
  onDontKnow,
  onPrev,
  onNext,
}: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);

  // Reset flip when item changes
  useEffect(() => {
    setFlipped(false);
  }, [item.id]);

  const handleSpeak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(item.word);
    utterance.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // Keyboard shortcuts — only active when no input/textarea is focused
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case " ":
        case "f":
          e.preventDefault();
          setFlipped((p) => !p);
          break;
        case "ArrowRight":
        case "l":
          e.preventDefault();
          onNext();
          break;
        case "ArrowLeft":
        case "j":
          e.preventDefault();
          onPrev();
          break;
        case "k":
          e.preventDefault();
          onKnow();
          break;
        case "x":
          e.preventDefault();
          onDontKnow();
          break;
        case "p":
          e.preventDefault();
          handleSpeak();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNext, onPrev, onKnow, onDontKnow, item.word]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onDontKnow}
          className="rounded-full"
        >
          <kbd className="mr-1.5 rounded border border-border/50 px-1 py-0.5 text-xs font-mono opacity-60">
            X
          </kbd>
          I don&apos;t know
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onKnow}
          className="rounded-full bg-sky-600 text-white hover:bg-sky-700"
        >
          <kbd className="mr-1.5 rounded border border-white/30 px-1 py-0.5 text-xs font-mono opacity-70">
            K
          </kbd>
          I know
        </Button>
      </div>
      <div
        className={cn(
          "relative h-80 w-full cursor-pointer select-none perspective-distant",
          "sm:h-90",
        )}
        onClick={() => setFlipped((prev) => !prev)}
        role="button"
        aria-pressed={flipped}
      >
        <div className="absolute inset-y-0 left-3 z-10 flex items-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full bg-white/90 shadow"
            onClick={(event) => {
              event.stopPropagation();
              onPrev();
            }}
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="absolute inset-y-0 right-3 z-10 flex items-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full bg-white/90 shadow"
            onClick={(event) => {
              event.stopPropagation();
              onNext();
            }}
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div
          className={cn(
            "absolute inset-0 h-full w-full rounded-3xl border border-border/60 bg-white/90 p-6 shadow-xl transition-transform duration-500",
            "transform-3d",
            flipped ? "transform-[rotateY(180deg)]" : "",
          )}
        >
          <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-4 backface-hidden">
            <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">
              {item.partOfSpeech ?? "Word"}
            </Badge>
            <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
              {item.word}
            </h2>
            <p className="text-lg text-muted-foreground">{item.phonetic}</p>
            {item.collocations && item.collocations.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5">
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
            {item.topic && (
              <span className="text-xs font-medium uppercase tracking-wide text-sky-600">
                {item.topic}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                handleSpeak();
              }}
              className="rounded-full"
            >
              <Volume2 className="mr-2 h-4 w-4" />
              <kbd className="mr-1 rounded border border-border/50 px-1 py-0.5 text-xs font-mono opacity-60">
                P
              </kbd>
              Pronounce
            </Button>
          </div>
          <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-5 rounded-3xl bg-sky-50 p-8 text-center transform-[rotateY(180deg)] backface-hidden">
            {/* Header: Badge + Phonetic */}
            <div className="flex flex-col items-center gap-1.5">
              <Badge className="bg-sky-500 text-white hover:bg-sky-500">
                Meaning
              </Badge>
              <span className="text-xs font-medium text-muted-foreground">
                {item.phonetic}
              </span>
            </div>

            {/* Meaning */}
            <h3 className="text-3xl font-semibold text-foreground leading-tight max-w-[90%]">
              {item.word}
            </h3>
            <h3 className="text-3xl font-semibold text-foreground leading-tight max-w-[90%]">
              {item.meaning}
            </h3>

            {/* Examples */}
            <div className="space-y-3 text-sm text-muted-foreground max-w-[92%]">
              {item.examples.map((example, index) => (
                <p key={index} className="flex items-start gap-2 text-left">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                  <span>{example}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          <kbd className="rounded border border-border px-1 font-mono">
            Space
          </kbd>{" "}
          / <kbd className="rounded border border-border px-1 font-mono">F</kbd>{" "}
          Lật
        </span>
        <span>
          <kbd className="rounded border border-border px-1 font-mono">←</kbd>
          <kbd className="rounded border border-border px-1 font-mono">
            →
          </kbd>{" "}
          Prev/Next
        </span>
        <span>
          <kbd className="rounded border border-border px-1 font-mono">K</kbd>{" "}
          Know ·{" "}
          <kbd className="rounded border border-border px-1 font-mono">X</kbd>{" "}
          Don&apos;t know ·{" "}
          <kbd className="rounded border border-border px-1 font-mono">P</kbd>{" "}
          Phát âm
        </span>
      </div>
    </div>
  );
}
