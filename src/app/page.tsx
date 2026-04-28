"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles, Target, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressTracker } from "@/components/progress-tracker";
import { useVocabularyStore } from "@/store/vocabulary-store";
import { useHydrated } from "@/hooks/use-hydrated";
import Image from "next/image";

export default function Home() {
  const hydrated = useHydrated();
  const items = useVocabularyStore((state) => state.items);
  const getDue = useVocabularyStore((state) => state.getDue);
  const streak = useVocabularyStore((state) => state.streak);

  const total = items.length;
  const mastered = items.filter((item) => item.mastery >= 4).length;
  const due = hydrated ? getDue().length : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
          {/* Glowing gradients background */}
          <div className="absolute inset-0 z-0">
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-sky-500/20 blur-[80px]" />
            <div className="absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-violet-500/20 blur-[80px]" />
            <div className="absolute bottom-0 left-1/2 h-40 w-full -translate-x-1/2 rounded-t-full bg-blue-500/10 blur-[60px]" />
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>

          <div className="absolute inset-0 z-0">
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-sky-500/20 blur-[80px]" />
            <div className="absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-violet-500/20 blur-[80px]" />
            <div className="absolute bottom-0 left-1/2 h-40 w-full -translate-x-1/2 rounded-t-full bg-blue-500/10 blur-[60px]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>

          <div className="relative z-10 flex flex-col gap-6 p-8 py-12 md:flex-row md:items-center md:justify-between md:gap-12 md:p-12">
            {/* LEFT: Text content */}
            <div className="space-y-4 text-white md:max-w-[52%]">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-300 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" />
                Welcome back 👋
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl lg:leading-tight">
                Build your English vocabulary every day.
              </h1>
              <p className="text-base text-slate-400">
                Master new words with smart flashcards, spaced repetition, and
                AI-generated contexts.
              </p>
            </div>

            {/* RIGHT: Banner Image - Vị trí đẹp nhất */}
            <div className="relative w-full md:w-[46%] lg:w-[42%] shrink-0 mt-6 md:mt-0">
              <div className="group relative aspect-[16/11] w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_0_70px_-15px_rgb(148,163,184)] transition-all duration-500 hover:shadow-[0_0_90px_-10px_rgb(56,189,248)]">
                <img
                  src="/banner.png"
                  alt="English vocabulary learning"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 45vw"
                />

                {/* Subtle gradient overlay trên ảnh */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/30 via-transparent to-sky-500/10" />

                {/* Viền sáng nhẹ */}
                <div className="absolute inset-0 ring-1 ring-white/20 rounded-3xl" />
              </div>
            </div>

            {/* Buttons - đưa xuống dưới trên mobile, bên phải trên desktop */}
            <div className="flex flex-col gap-3 sm:flex-row shrink-0 mt-6 md:mt-0 md:absolute md:bottom-12 md:right-12">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-sky-500 text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 border-none transition-all"
              >
                <Link href="/learn">
                  Start learning <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/10 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:text-white transition-all"
              >
                <Link href="/add">
                  Add Words <Plus className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <ProgressTracker
          total={total}
          due={due}
          mastered={mastered}
          streak={streak}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Today&apos;s focus
              </span>
              <Target className="h-4 w-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">{due}</p>
              <p className="text-sm text-muted-foreground">words to review</p>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Library size
              </span>
              <BookOpen className="h-4 w-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">{total}</p>
              <p className="text-sm text-muted-foreground">saved words</p>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <span className="text-sm text-muted-foreground">Mastery</span>
              <Sparkles className="h-4 w-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">
                {mastered}
              </p>
              <p className="text-sm text-muted-foreground">advanced words</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
