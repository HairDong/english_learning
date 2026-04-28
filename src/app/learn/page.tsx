"use client";

import Link from "next/link";
import {
  BookOpen,
  RefreshCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  KeyboardIcon,
  Layers,
  ListChecks,
  Volume2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Flashcard } from "@/components/flashcard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useVocabularyStore } from "@/store/vocabulary-store";
import { useSettingsStore } from "@/store/settings-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

// ---------- helpers ----------
function normalizeStr(s: string) {
  return s.trim().toLowerCase();
}

function compareChars(target: string, input: string) {
  const t = target.trim();
  const inp = input.trim();
  const maxLen = Math.max(t.length, inp.length);
  return Array.from({ length: maxLen }).map((_, idx) => {
    const expected = t[idx] ?? "";
    const actual = inp[idx] ?? "";
    return {
      expected,
      actual,
      isCorrect: expected.toLowerCase() === actual.toLowerCase(),
    };
  });
}

// ===== main =====
export default function LearnPage() {
  const hydrated = useHydrated();
  const items = useVocabularyStore((s) => s.items);
  const level = useVocabularyStore((s) => s.level);
  const markKnown = useVocabularyStore((s) => s.markKnown);
  const markUnknown = useVocabularyStore((s) => s.markUnknown);
  const { getActiveConfig } = useSettingsStore();

  const itemsById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items]
  );

  const shuffle = (ids: string[]) => {
    const s = [...ids];
    for (let i = s.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [s[i], s[j]] = [s[j], s[i]];
    }
    return s;
  };

  // Shared TTS helper
  const speakWord = (word: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // ══════════════════════════════════
  // TAB 1 — Flashcard + answer input
  // ══════════════════════════════════
  const [fcQueue, setFcQueue] = useState<string[]>([]);
  const [fcIndex, setFcIndex] = useState(0);

  // answer-below-card state
  const [vietAnswer, setVietAnswer] = useState("");
  const [vietChecked, setVietChecked] = useState(false);
  const vietInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hydrated) return;
    setFcQueue(shuffle(items.map((i) => i.id)));
    setFcIndex(0);
    setVietAnswer("");
    setVietChecked(false);
  }, [hydrated, items]);

  const fcItem = fcQueue.length ? itemsById.get(fcQueue[fcIndex]) : undefined;

  const fcMoveNext = () =>
    setFcIndex((p) => (fcQueue.length === 0 ? 0 : (p + 1) % fcQueue.length));
  const fcMovePrev = () =>
    setFcIndex((p) =>
      fcQueue.length === 0 ? 0 : (p - 1 + fcQueue.length) % fcQueue.length
    );

  const resetVietAnswer = () => {
    setVietAnswer("");
    setVietChecked(false);
    setTimeout(() => vietInputRef.current?.focus(), 50);
  };

  const handleVietSubmit = () => {
    if (!fcItem || vietChecked) return;
    setVietChecked(true);
  };

  const handleVietNext = () => {
    if (!fcItem) return;
    const correct =
      normalizeStr(vietAnswer) === normalizeStr(fcItem.meaning);
    if (correct) markKnown(fcItem.id);
    else markUnknown(fcItem.id);
    fcMoveNext();
    resetVietAnswer();
  };

  const handleVietKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    // Ctrl+Enter → skip (mark unknown, move on)
    if (e.ctrlKey) {
      if (fcItem) markUnknown(fcItem.id);
      fcMoveNext();
      resetVietAnswer();
      return;
    }
    if (!vietChecked) handleVietSubmit();
    else handleVietNext();
  };

  const vietIsCorrect =
    vietChecked &&
    fcItem !== undefined &&
    normalizeStr(vietAnswer) === normalizeStr(fcItem.meaning);

  const vietHighlight =
    fcItem && vietChecked ? compareChars(fcItem.meaning, vietAnswer) : [];

  // sentence practice (inside Tab 1)
  const [practice, setPractice] = useState<
    { english: string; vietnamese: string } | undefined
  >();
  const [sentenceAnswer, setSentenceAnswer] = useState("");
  const [sentenceChecked, setSentenceChecked] = useState(false);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceError, setPracticeError] = useState<string | null>(null);

  const sentenceHighlight =
    practice && sentenceChecked
      ? compareChars(practice.english, sentenceAnswer)
      : [];

  const loadPractice = async () => {
    if (!fcItem) return;
    setPracticeLoading(true);
    setPracticeError(null);
    setSentenceChecked(false);
    setSentenceAnswer("");
    const config = getActiveConfig();
    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: fcItem.word,
          meaning: fcItem.meaning,
          topic: fcItem.topic,
          level,
          ...config,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to generate practice");
      }
      const data = await res.json();
      setPractice({ english: data.english ?? "", vietnamese: data.vietnamese ?? "" });
    } catch (err) {
      setPracticeError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setPracticeLoading(false);
    }
  };

  // ══════════════════════════════════
  // TAB 2 — Luyện gõ (VN → EN)
  // ══════════════════════════════════
  const [typQueue, setTypQueue] = useState<string[]>([]);
  const [typIndex, setTypIndex] = useState(0);
  const [typAnswer, setTypAnswer] = useState("");
  const [typChecked, setTypChecked] = useState(false);
  const typInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    setTypQueue(shuffle(items.map((i) => i.id)));
    setTypIndex(0);
    setTypAnswer("");
    setTypChecked(false);
  }, [hydrated, items]);

  const typItem = typQueue.length ? itemsById.get(typQueue[typIndex]) : undefined;

  const typIsCorrect =
    typChecked &&
    typItem !== undefined &&
    normalizeStr(typAnswer) === normalizeStr(typItem.word);

  const typHighlight =
    typItem && typChecked ? compareChars(typItem.word, typAnswer) : [];

  const handleTypSubmit = () => {
    if (!typItem || typChecked) return;
    setTypChecked(true);
  };

  const handleTypNext = () => {
    if (!typItem) return;
    if (typIsCorrect) markKnown(typItem.id);
    else markUnknown(typItem.id);
    setTypIndex((p) =>
      typQueue.length === 0 ? 0 : (p + 1) % typQueue.length
    );
    setTypAnswer("");
    setTypChecked(false);
    setTimeout(() => typInputRef.current?.focus(), 50);
  };

  const handleTypKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    // Ctrl+Enter → skip (mark unknown, move on)
    if (e.ctrlKey) {
      if (typItem) markUnknown(typItem.id);
      setTypIndex((p) => (typQueue.length === 0 ? 0 : (p + 1) % typQueue.length));
      setTypAnswer("");
      setTypChecked(false);
      setTimeout(() => typInputRef.current?.focus(), 50);
      return;
    }
    if (!typChecked) handleTypSubmit();
    else handleTypNext();
  };

  // ══════════════════════════════════
  // TAB 3 — Trắc nghiệm (Quiz)
  // ══════════════════════════════════
  type QuizOption = { id: string; text: string };
  type QuizQuestion = {
    questionId: string;   // id of the word being asked
    questionWord: string; // English word shown
    options: QuizOption[]; // shuffled 4 options (meanings)
    correctId: string;
  };

  const buildQuestion = (allIds: string[]): QuizQuestion | null => {
    if (allIds.length < 2) return null;
    const qIdx = Math.floor(Math.random() * allIds.length);
    const qId = allIds[qIdx];
    const qItem = itemsById.get(qId);
    if (!qItem) return null;

    // Pick 3 unique wrong answers
    const wrongPool = allIds.filter((id) => id !== qId);
    const wrongs: QuizOption[] = [];
    const used = new Set<string>();
    while (wrongs.length < 3 && wrongs.length < wrongPool.length) {
      const rIdx = Math.floor(Math.random() * wrongPool.length);
      const wId = wrongPool[rIdx];
      if (!used.has(wId)) {
        used.add(wId);
        const wItem = itemsById.get(wId);
        if (wItem) wrongs.push({ id: wId, text: wItem.meaning });
      }
    }

    // Shuffle all 4 options
    const all: QuizOption[] = [
      { id: qId, text: qItem.meaning },
      ...wrongs,
    ];
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return { questionId: qId, questionWord: qItem.word, options: all, correctId: qId };
  };

  const [quiz, setQuiz] = useState<QuizQuestion | null>(null);
  const [quizChosen, setQuizChosen] = useState<string | null>(null);
  const [quizAutoNext, setQuizAutoNext] = useState(true);
  const [quizCount, setQuizCount] = useState(0);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const autoNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Store pending spaced-rep mark so we don’t mutate items inside handleQuizChoose
  // (mutating items triggers useEffect → initQuiz immediately, bypassing the delay)
  const pendingMarkRef = useRef<{ id: string; correct: boolean } | null>(null);

  const initQuiz = (allIds: string[]) => {
    const q = buildQuestion(allIds);
    setQuiz(q);
    setQuizChosen(null);
  };

  // Auto-speak quiz word when question changes
  useEffect(() => {
    if (quiz) speakWord(quiz.questionWord);
  }, [quiz?.questionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Only re-init when the NUMBER of items changes (not on mastery updates)
  useEffect(() => {
    if (!hydrated || items.length < 2) return;
    initQuiz(items.map((i) => i.id));
  }, [hydrated, items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const advanceQuiz = () => {
    if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
    // Apply the deferred spaced-rep mark NOW (safe: won’t re-trigger quiz init
    // because items.length doesn’t change on mastery updates)
    if (pendingMarkRef.current) {
      const { id, correct } = pendingMarkRef.current;
      if (correct) markKnown(id);
      else markUnknown(id);
      pendingMarkRef.current = null;
    }
    initQuiz(items.map((i) => i.id));
  };

  const handleQuizChoose = (optId: string) => {
    if (quizChosen !== null || !quiz) return;
    setQuizChosen(optId);
    const correct = optId === quiz.correctId;
    setQuizCount((c) => c + 1);
    if (correct) setQuizCorrect((c) => c + 1);
    // Store mark for later — do NOT call markKnown/markUnknown here
    pendingMarkRef.current = { id: quiz.questionId, correct };
    if (quizAutoNext) {
      autoNextTimerRef.current = setTimeout(advanceQuiz, 2000);
    }
  };

  // Enter to advance quiz (re-bind every render for fresh closure)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && quizChosen !== null) {
        e.preventDefault();
        advanceQuiz();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ══════════════════════════════════
  if (!hydrated) return null;

  const hasItems = items.length > 0;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Learn</h1>
            <p className="text-sm text-muted-foreground">
              Ôn tập từ vựng với spaced repetition.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/generate">
              <Sparkles className="mr-2 h-4 w-4" /> Generate more
            </Link>
          </Button>
        </div>

        {hasItems ? (
          <Tabs defaultValue="flashcard" className="space-y-4">
            <TabsList>
              <TabsTrigger value="flashcard" className="gap-2">
                <Layers className="h-4 w-4" />
                Flashcard
              </TabsTrigger>
              <TabsTrigger value="typing" className="gap-2">
                <KeyboardIcon className="h-4 w-4" />
                Luyện gõ
              </TabsTrigger>
              <TabsTrigger value="quiz" className="gap-2">
                <ListChecks className="h-4 w-4" />
                Trắc nghiệm
              </TabsTrigger>
            </TabsList>

            {/* ── TAB 1: Flashcard ── */}
            <TabsContent value="flashcard">
              {fcItem ? (
                <div className="space-y-6">
                  <Flashcard
                    item={fcItem}
                    onKnow={() => { markKnown(fcItem.id); fcMoveNext(); resetVietAnswer(); }}
                    onDontKnow={() => { markUnknown(fcItem.id); fcMoveNext(); resetVietAnswer(); }}
                    onPrev={() => { fcMovePrev(); resetVietAnswer(); }}
                    onNext={() => { fcMoveNext(); resetVietAnswer(); }}
                  />

                  {/* Answer input */}
                  <Card className="border-border/60 shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-base font-semibold text-foreground">
                            Nhập nghĩa tiếng Việt
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Nhìn từ trên card rồi gõ nghĩa — nhấn{" "}
                            <kbd className="rounded border border-border px-1 py-0.5 text-xs font-mono">
                              Enter
                            </kbd>{" "}
                            để kiểm tra.
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {fcIndex + 1} / {fcQueue.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        ref={vietInputRef}
                        id="viet-answer"
                        placeholder="Gõ nghĩa tiếng Việt rồi nhấn Enter..."
                        value={vietAnswer}
                        onChange={(e) => setVietAnswer(e.target.value)}
                        onKeyDown={handleVietKeyDown}
                        disabled={vietChecked}
                        autoComplete="off"
                        className={cn(
                          "transition-colors",
                          vietChecked && vietIsCorrect && "border-emerald-400 bg-emerald-50",
                          vietChecked && !vietIsCorrect && "border-rose-400 bg-rose-50"
                        )}
                      />

                      {!vietChecked && (
                        <Button
                          type="button"
                          className="rounded-full bg-sky-600 text-white hover:bg-sky-700"
                          onClick={handleVietSubmit}
                          disabled={!vietAnswer.trim()}
                        >
                          Kiểm tra
                        </Button>
                      )}

                      {vietChecked && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            {vietIsCorrect ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-rose-500" />
                            )}
                            <span
                              className={cn(
                                "text-sm font-medium",
                                vietIsCorrect ? "text-emerald-600" : "text-rose-600"
                              )}
                            >
                              {vietIsCorrect ? "Chính xác! 🎉" : "Chưa đúng"}
                            </span>
                          </div>

                          {/* Char comparison */}
                          <div className="flex flex-wrap gap-0.5 rounded-xl border border-border/60 bg-white p-3">
                            {vietHighlight.map((ch, idx) => (
                              <span
                                key={idx}
                                className={cn(
                                  "font-mono text-sm",
                                  ch.isCorrect ? "text-emerald-600" : "text-rose-500"
                                )}
                              >
                                {ch.actual || "·"}
                              </span>
                            ))}
                          </div>

                          {!vietIsCorrect && (
                            <p className="text-sm text-muted-foreground">
                              Đáp án đúng:{" "}
                              <span className="font-semibold text-foreground">
                                {fcItem.meaning}
                              </span>
                            </p>
                          )}

                          <Button
                            type="button"
                            className="rounded-full bg-sky-600 text-white hover:bg-sky-700"
                            onClick={handleVietNext}
                          >
                            Từ tiếp theo →
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Sentence practice */}
                  <Card className="border-border/60 shadow-sm">
                    <CardHeader>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-foreground">
                            Sentence practice
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Viết câu tiếng Anh dựa trên câu tiếng Việt đã cho.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full"
                          onClick={loadPractice}
                          disabled={practiceLoading}
                        >
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          {practiceLoading ? "Generating..." : "Generate new"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-2xl border border-dashed border-border/60 bg-sky-50/60 p-4 text-sm text-foreground">
                        {practice?.vietnamese ??
                          "Nhấn Generate new để tạo câu tiếng Việt cho từ này."}
                      </div>
                      <Input
                        placeholder="Type your English sentence here..."
                        value={sentenceAnswer}
                        onChange={(e) => setSentenceAnswer(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && practice) {
                            e.preventDefault();
                            setSentenceChecked(true);
                          }
                        }}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          className="rounded-full bg-sky-600 text-white hover:bg-sky-700"
                          onClick={() => setSentenceChecked(true)}
                          disabled={!practice}
                        >
                          Check answer
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => { setSentenceChecked(false); setSentenceAnswer(""); }}
                        >
                          Reset
                        </Button>
                      </div>
                      {practiceError && (
                        <p className="text-sm text-red-500">{practiceError}</p>
                      )}
                      {practice && sentenceChecked && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase text-muted-foreground">
                            Character comparison
                          </p>
                          <div className="flex flex-wrap gap-1 rounded-2xl border border-border/60 bg-white p-3 text-sm">
                            {sentenceHighlight.map((char, index) => (
                              <span
                                key={`${char.expected}-${index}`}
                                className={
                                  char.isCorrect ? "text-emerald-600" : "text-rose-500"
                                }
                              >
                                {char.actual || "•"}
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Correct sentence:{" "}
                            <span className="font-medium text-foreground">
                              {practice.english}
                            </span>
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </TabsContent>

            {/* ── TAB 2: Luyện gõ ── */}
            <TabsContent value="typing">
              {typItem ? (
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <KeyboardIcon className="h-4 w-4 text-sky-500" />
                          <h2 className="text-lg font-semibold text-foreground">
                            Luyện gõ từ tiếng Anh
                          </h2>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Nhìn nghĩa tiếng Việt và gõ từ tiếng Anh tương ứng.{" "}
                          <span className="text-xs">
                            (Enter để kiểm tra / chuyển tiếp)
                          </span>
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {typIndex + 1} / {typQueue.length}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Vietnamese prompt */}
                    <div className="rounded-2xl border border-dashed border-border/60 bg-sky-50/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 mb-1">
                        Nghĩa tiếng Việt
                      </p>
                      <p className="text-base font-medium text-foreground">
                        {typItem.meaning}
                      </p>
                      {typChecked && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Phiên âm: {typItem.phonetic}
                        </p>
                      )}
                    </div>

                    {/* Input */}
                    <Input
                      ref={typInputRef}
                      id="typing-answer"
                      placeholder="Gõ từ tiếng Anh rồi nhấn Enter..."
                      value={typAnswer}
                      onChange={(e) => setTypAnswer(e.target.value)}
                      onKeyDown={handleTypKeyDown}
                      disabled={typChecked}
                      autoComplete="off"
                      autoFocus
                      className={cn(
                        "transition-colors",
                        typChecked && typIsCorrect && "border-emerald-400 bg-emerald-50",
                        typChecked && !typIsCorrect && "border-rose-400 bg-rose-50"
                      )}
                    />

                    {/* Result */}
                    {typChecked ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {typIsCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-rose-500" />
                          )}
                          <span
                            className={cn(
                              "text-sm font-medium",
                              typIsCorrect ? "text-emerald-600" : "text-rose-600"
                            )}
                          >
                            {typIsCorrect ? "Chính xác! 🎉" : "Chưa đúng"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-0.5 rounded-xl border border-border/60 bg-white p-3">
                          {typHighlight.map((ch, idx) => (
                            <span
                              key={idx}
                              className={cn(
                                "font-mono text-base",
                                ch.isCorrect ? "text-emerald-600" : "text-rose-500"
                              )}
                            >
                              {ch.actual || "·"}
                            </span>
                          ))}
                        </div>

                        {!typIsCorrect && (
                          <p className="text-sm text-muted-foreground">
                            Đáp án đúng:{" "}
                            <span className="font-semibold text-foreground">
                              {typItem.word}
                            </span>
                          </p>
                        )}

                        <Button
                          type="button"
                          className="rounded-full bg-sky-600 text-white hover:bg-sky-700"
                          onClick={handleTypNext}
                        >
                          Từ tiếp theo →
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        className="rounded-full bg-sky-600 text-white hover:bg-sky-700"
                        onClick={handleTypSubmit}
                        disabled={!typAnswer.trim()}
                      >
                        Kiểm tra
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>

            {/* ── TAB 3: Trắc nghiệm ── */}
            <TabsContent value="quiz">
              {items.length < 2 ? (
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-6 text-center text-sm text-muted-foreground">
                    Cần ít nhất 2 từ vựng để làm trắc nghiệm.
                  </CardContent>
                </Card>
              ) : quiz ? (
                <div className="space-y-5">
                  {/* Score bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                        ✓ {quizCorrect}
                      </span>
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-600">
                        ✗ {quizCount - quizCorrect}
                      </span>
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer accent-sky-600"
                        checked={quizAutoNext}
                        onChange={(e) => setQuizAutoNext(e.target.checked)}
                      />
                      Tự động chuyển (2s)
                    </label>
                  </div>

                  {/* Question card */}
                  <Card className="border-border/60 shadow-sm">
                    <CardContent className="flex flex-col items-center gap-2 p-8">
                      <span className="text-xs font-semibold uppercase tracking-widest text-sky-500">
                        Nghĩa của từ này là gì?
                      </span>
                      <h2 className="mt-1 text-4xl font-bold tracking-tight text-foreground">
                        {quiz.questionWord}
                      </h2>
                      <button
                        type="button"
                        onClick={() => speakWord(quiz.questionWord)}
                        className="mt-1 flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground hover:border-sky-400 hover:text-sky-600 transition-colors"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        Phát âm lại
                      </button>
                      {quizChosen !== null && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Nhấn{" "}
                          <kbd className="rounded border border-border px-1 py-0.5 font-mono text-xs">
                            Enter
                          </kbd>{" "}
                          để câu tiếp theo
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Options */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {quiz.options.map((opt) => {
                      const isChosen = quizChosen === opt.id;
                      const isCorrect = opt.id === quiz.correctId;
                      const answered = quizChosen !== null;

                      let style =
                        "cursor-pointer rounded-2xl border-2 border-border/60 bg-card p-5 text-left transition-all duration-150 ";

                      if (!answered) {
                        style += "hover:border-sky-400 hover:bg-sky-50/60 hover:shadow-md active:scale-[0.98]";
                      } else if (isCorrect) {
                        style += "border-emerald-400 bg-emerald-50 shadow-md";
                      } else if (isChosen) {
                        style += "border-rose-400 bg-rose-50 shadow-md";
                      } else {
                        style += "opacity-50";
                      }

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className={style}
                          onClick={() => handleQuizChoose(opt.id)}
                          disabled={answered}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                                !answered
                                  ? "bg-muted text-muted-foreground"
                                  : isCorrect
                                  ? "bg-emerald-500 text-white"
                                  : isChosen
                                  ? "bg-rose-500 text-white"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {!answered ? (
                                String.fromCharCode(65 + quiz.options.indexOf(opt))
                              ) : isCorrect ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : isChosen ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                String.fromCharCode(65 + quiz.options.indexOf(opt))
                              )}
                            </div>
                            <span
                              className={`text-base font-medium ${
                                answered && isCorrect
                                  ? "text-emerald-700"
                                  : answered && isChosen
                                  ? "text-rose-700"
                                  : "text-foreground"
                              }`}
                            >
                              {opt.text}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Result feedback + examples */}
                  {quizChosen !== null && (() => {
                    const correct = quizChosen === quiz.correctId;
                    const correctItem = itemsById.get(quiz.correctId);
                    return (
                      <div className="space-y-3">
                        {/* Correct / Wrong banner */}
                        <div
                          className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                            correct
                              ? "bg-emerald-50 border border-emerald-200"
                              : "bg-rose-50 border border-rose-200"
                          }`}
                        >
                          {correct ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                          ) : (
                            <XCircle className="h-5 w-5 shrink-0 text-rose-500" />
                          )}
                          <div>
                            <p
                              className={`font-semibold ${
                                correct ? "text-emerald-700" : "text-rose-700"
                              }`}
                            >
                              {correct ? "Chính xác! 🎉" : "Chưa đúng"}
                            </p>
                            {!correct && (
                              <p className="text-sm text-rose-600">
                                Đáp án đúng:{" "}
                                <span className="font-semibold">
                                  {correctItem?.meaning}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Example sentences */}
                        {correctItem?.examples && correctItem.examples.length > 0 && (
                          <div className="rounded-2xl border border-border/60 bg-sky-50/50 p-4 space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                              Ví dụ — {quiz.questionWord}
                            </p>
                            <ul className="space-y-1.5">
                              {correctItem.examples.map((ex, i) => (
                                <li key={i} className="flex gap-2 text-sm text-foreground">
                                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
                                  {ex}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Next button */}
                        <Button
                          type="button"
                          className="w-full rounded-full bg-sky-600 text-white hover:bg-sky-700"
                          onClick={advanceQuiz}
                        >
                          Câu tiếp theo →
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              ) : null}
            </TabsContent>

          </Tabs>

        ) : (
          <Card className="border-border/60 shadow-sm">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Chưa có từ vựng nào!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Thêm từ mới hoặc dùng AI để tạo danh sách từ vựng.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild className="rounded-full bg-sky-600 text-white hover:bg-sky-700">
                  <Link href="/generate">Generate vocabulary</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/add">Add manually</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
