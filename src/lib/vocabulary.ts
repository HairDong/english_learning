import type { VocabularyInput, VocabularyItem } from "@/types/vocabulary";

const REVIEW_SCHEDULE_DAYS = [1, 3, 7, 14, 30, 60];

const getNowIso = () => new Date().toISOString();

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const calculateNextReview = (mastery: number) => {
  const index = Math.min(Math.max(mastery, 0), REVIEW_SCHEDULE_DAYS.length - 1);
  return addDays(new Date(), REVIEW_SCHEDULE_DAYS[index]).toISOString();
};

export const toVocabularyItem = (
  input: VocabularyInput,
  source: VocabularyItem["source"]
): VocabularyItem => {
  const now = new Date();
  const normalizedExamples = input.examples
    .map((example) => example.trim())
    .filter(Boolean);

  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    word: input.word.trim(),
    phonetic: input.phonetic.trim(),
    meaning: input.meaning.trim(),
    partOfSpeech: input.partOfSpeech,
    collocations: input.collocations?.map((c) => c.trim()).filter(Boolean) ?? [],
    examples: normalizedExamples,
    topic: input.topic?.trim() || undefined,
    createdAt: now.toISOString(),
    nextReview: now.toISOString(),
    mastery: 0,
    source,
  };
};

export const getDueItems = (items: VocabularyItem[]) => {
  const now = Date.now();
  return items.filter((item) => new Date(item.nextReview).getTime() <= now);
};

export const sortForReview = (items: VocabularyItem[]) =>
  [...items].sort((a, b) => {
    if (a.mastery !== b.mastery) {
      return a.mastery - b.mastery;
    }
    return (
      new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime()
    );
  });

export const updateStreak = (lastStudyAt?: string, streak = 0) => {
  const today = new Date();
  const last = lastStudyAt ? new Date(lastStudyAt) : undefined;

  if (!last) {
    return { streak: 1, lastStudyAt: today.toISOString() };
  }

  const lastDate = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round(
    (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diff === 0) {
    return { streak, lastStudyAt: today.toISOString() };
  }

  if (diff === 1) {
    return { streak: streak + 1, lastStudyAt: today.toISOString() };
  }

  return { streak: 1, lastStudyAt: today.toISOString() };
};
