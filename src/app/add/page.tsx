"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JSONInput } from "@/components/json-input";
import { Braces, PenLine } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useVocabularyStore } from "@/store/vocabulary-store";
import { useSettingsStore } from "@/store/settings-store";
import type { PartOfSpeech } from "@/types/vocabulary";
import {
  Sparkles,
  Plus,
  CheckCircle2,
  Loader2,
  Trash2,
  BookPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type FormField = {
  vietnamese: string;
  word: string;
  phonetic: string;
  meaning: string;
  partOfSpeech: string;
  collocations: string;
  example: string;
};

const emptyForm = (): FormField => ({
  vietnamese: "",
  word: "",
  phonetic: "",
  meaning: "",
  partOfSpeech: "",
  collocations: "",
  example: "",
});

export default function AddPage() {
  const router = useRouter();
  const addItems = useVocabularyStore((state) => state.addItems);
  const level = useVocabularyStore((state) => state.level);
  const { getActiveConfig } = useSettingsStore();

  const [form, setForm] = useState<FormField>(emptyForm());
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const set = (field: keyof FormField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(null);
    setCompleteError(null);
  };

  const handleAIGenerate = () => {
    router.push("/generate");
  };

  const handleComplete = async () => {
    const hasAnyField =
      form.vietnamese.trim() ||
      form.word.trim() ||
      form.phonetic.trim() ||
      form.meaning.trim() ||
      form.example.trim();

    if (!hasAnyField) {
      setCompleteError(
        "Hãy điền ít nhất một trường trước khi dùng AI hoàn thiện.",
      );
      return;
    }

    setCompleting(true);
    setCompleteError(null);

    const config = getActiveConfig();

    try {
      const res = await fetch("/api/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: form.word.trim() || undefined,
          phonetic: form.phonetic.trim() || undefined,
          meaning: form.meaning.trim() || undefined,
          vietnamese: form.vietnamese.trim() || undefined,
          example: form.example.trim() || undefined,
          level,
          ...config,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error ?? "Lỗi từ AI");
      }

      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        vietnamese: prev.vietnamese || data.meaning || "",
        word: data.word || prev.word,
        phonetic: data.phonetic || prev.phonetic,
        meaning: data.meaning || prev.meaning,
        partOfSpeech: data.partOfSpeech || prev.partOfSpeech,
        collocations:
          prev.collocations ||
          (Array.isArray(data.collocations)
            ? data.collocations.join("\n")
            : ""),
        example:
          prev.example ||
          (Array.isArray(data.examples) ? data.examples.join("\n") : ""),
      }));
    } catch (err) {
      setCompleteError(
        err instanceof Error ? err.message : "Không thể hoàn thiện từ vựng.",
      );
    } finally {
      setCompleting(false);
    }
  };

  const handleSave = () => {
    const word = form.word.trim();
    const meaning = form.meaning.trim();
    if (!word || !meaning) {
      setCompleteError("Tiếng Anh và Nghĩa là bắt buộc để lưu.");
      return;
    }

    const examples = form.example
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    addItems(
      [
        {
          word,
          phonetic: form.phonetic.trim() || `/${word}/`,
          meaning,
          partOfSpeech: (form.partOfSpeech || undefined) as
            | PartOfSpeech
            | undefined,
          collocations: form.collocations
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          examples: examples.length ? examples : [`${word} is a useful word.`],
        },
      ],
      "manual",
    );

    setSaved(word);
    setForm(emptyForm());
    setCompleteError(null);
  };

  const handleReset = () => {
    setForm(emptyForm());
    setSaved(null);
    setCompleteError(null);
  };

  const anyFilled = Object.values(form).some((v) => v.trim());
  const [savedJson, setSavedJson] = useState(0);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Thêm từ vựng
          </h1>
          <p className="text-sm text-muted-foreground">
            Nhập từ bạn muốn học — dùng form thủ công hoặc dán JSON.
          </p>
        </div>

        <Tabs defaultValue="manual" className="space-y-4">
          <TabsList>
            <TabsTrigger value="manual" className="gap-2">
              <PenLine className="h-4 w-4" />
              Nhập tay
            </TabsTrigger>
            <TabsTrigger value="json" className="gap-2">
              <Braces className="h-4 w-4" />
              JSON
            </TabsTrigger>
            <Button
              onClick={handleAIGenerate}
              variant="outline"
              className="rounded-full ms-10 gap-2 border-sky-300 text-sky-700 hover:bg-sky-50"
            >
              <Sparkles className="h-4 w-4" />
              Thêm bằng AI
            </Button>
          </TabsList>

          {/* ── Tab: Nhập tay ── */}
          <TabsContent value="manual" className="space-y-4">
            {/* Success banner */}
            {saved && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Đã lưu từ &quot;{saved}&quot; vào danh sách học!
              </div>
            )}

            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-base font-medium text-foreground">
                  <BookPlus className="h-5 w-5 text-sky-500" />
                  Nhập thông tin từ vựng
                </div>
                <p className="text-xs text-muted-foreground">
                  Chỉ cần điền một hoặc vài trường — AI sẽ điền phần còn lại
                  theo CEFR{" "}
                  <span className="font-semibold text-sky-600">{level}</span>.
                </p>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Vietnamese */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="add-vietnamese"
                    className="text-sm font-medium"
                  >
                    🇻🇳 Tiếng Việt
                  </Label>
                  <Input
                    id="add-vietnamese"
                    placeholder="Ví dụ: trường học, cây bút..."
                    value={form.vietnamese}
                    onChange={(e) => set("vietnamese", e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="add-word" className="text-sm font-medium">
                      🇬🇧 Tiếng Anh
                    </Label>
                    <Input
                      id="add-word"
                      placeholder="Ví dụ: school, pen..."
                      value={form.word}
                      onChange={(e) => set("word", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="add-phonetic"
                      className="text-sm font-medium"
                    >
                      🔤 Phiên âm (IPA)
                    </Label>
                    <Input
                      id="add-phonetic"
                      placeholder="Ví dụ: /skuːl/"
                      value={form.phonetic}
                      onChange={(e) => set("phonetic", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="add-meaning" className="text-sm font-medium">
                    📖 Nghĩa (ngắn gọn)
                  </Label>
                  <Input
                    id="add-meaning"
                    placeholder="Nghĩa tiếng Việt ngắn gọn..."
                    value={form.meaning}
                    onChange={(e) => set("meaning", e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="add-pos" className="text-sm font-medium">
                      🏷️ Từ loại
                    </Label>
                    <Select
                      value={form.partOfSpeech}
                      onValueChange={(v) => set("partOfSpeech", v)}
                    >
                      <SelectTrigger id="add-pos">
                        <SelectValue placeholder="Chọn từ loại…" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "noun",
                          "verb",
                          "adjective",
                          "adverb",
                          "preposition",
                          "conjunction",
                          "pronoun",
                          "phrase",
                          "other",
                        ].map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {pos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="add-collocations"
                      className="text-sm font-medium"
                    >
                      🔗 Cách dùng (mỗi dòng 1 cách)
                    </Label>
                    <Textarea
                      id="add-collocations"
                      placeholder={"decide + to do sth\ndecide on sth"}
                      value={form.collocations}
                      onChange={(e) => set("collocations", e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="add-example" className="text-sm font-medium">
                    ✏️ Ví dụ (mỗi câu một dòng)
                  </Label>
                  <Textarea
                    id="add-example"
                    placeholder={
                      "She goes to school every day.\nThe school has a big library."
                    }
                    value={form.example}
                    onChange={(e) => set("example", e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {completeError && (
                  <p className="text-sm text-rose-500">{completeError}</p>
                )}

                <div className="flex flex-wrap gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "rounded-full gap-2 border-sky-300 text-sky-700 hover:bg-sky-50",
                      completing && "opacity-70",
                    )}
                    onClick={handleComplete}
                    disabled={completing}
                  >
                    {completing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {completing ? "Đang hoàn thiện..." : "AI hoàn thiện"}
                  </Button>

                  <Button
                    type="button"
                    className="rounded-full gap-2 bg-sky-600 text-white hover:bg-sky-700"
                    onClick={handleSave}
                    disabled={completing}
                  >
                    <Plus className="h-4 w-4" />
                    Lưu từ vựng
                  </Button>

                  {anyFilled && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-full gap-2 text-muted-foreground"
                      onClick={handleReset}
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa trắng
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            {(form.word || form.meaning) && (
              <Card className="border-border/60 bg-sky-50/40 shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                    Xem trước
                  </p>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xl font-bold text-foreground">
                      {form.word || "—"}
                    </span>
                    {form.phonetic && (
                      <span className="text-sm text-muted-foreground">
                        {form.phonetic}
                      </span>
                    )}
                  </div>
                  {form.meaning && (
                    <p className="text-sm text-foreground">{form.meaning}</p>
                  )}
                  {form.example && (
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {form.example
                        .split("\n")
                        .filter(Boolean)
                        .map((line, i) => (
                          <li key={i} className="flex gap-2">
                            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
                            {line}
                          </li>
                        ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Tab: JSON ── */}
          <TabsContent value="json" className="space-y-4">
            {savedJson > 0 && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Đã lưu {savedJson} từ vào danh sách học!
              </div>
            )}
            <JSONInput
              onSave={(items) => {
                addItems(items, "manual");
                setSavedJson(items.length);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
