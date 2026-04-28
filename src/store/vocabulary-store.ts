"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { VocabularyInput, VocabularyItem } from "@/types/vocabulary";
import {
  calculateNextReview,
  getDueItems,
  sortForReview,
  toVocabularyItem,
  updateStreak,
} from "@/lib/vocabulary";

export type VocabularyState = {
  items: VocabularyItem[];
  topics: string[];
  streak: number;
  lastStudyAt?: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  addItems: (items: VocabularyInput[], source: VocabularyItem["source"]) => void;
  addTopics: (topics: string[]) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  setLevel: (level: VocabularyState["level"]) => void;
  addExamples: (id: string, examples: string[]) => void;
  markKnown: (id: string) => void;
  markUnknown: (id: string) => void;
  getDue: () => VocabularyItem[];
  getTopics: () => string[];
};

export const useVocabularyStore = create<VocabularyState>()(
  persist(
    (set, get) => ({
      items: [],
      topics: ["Daily life", "Travel", "Technology", "Food", "Education", "Health"],
      streak: 0,
      lastStudyAt: undefined,
      level: "A1",
      addItems: (inputs, source) =>
        set((state) => ({
          items: [
            ...inputs.map((input) => toVocabularyItem(input, source)),
            ...state.items,
          ],
        })),
      addTopics: (topics) =>
        set((state) => {
          const merged = [
            ...state.topics,
            ...topics.map((topic) => topic.trim()).filter(Boolean),
          ];
          const unique = Array.from(new Set(merged));
          return { topics: unique };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      clearAll: () => set({ items: [], streak: 0, lastStudyAt: undefined }),
      setLevel: (level) => set({ level }),
      addExamples: (id, examples) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;
            const merged = [
              ...item.examples,
              ...examples.map((example) => example.trim()).filter(Boolean),
            ];
            const unique = Array.from(new Set(merged));
            return {
              ...item,
              examples: unique,
            };
          }),
        })),
      markKnown: (id) =>
        set((state) => {
          const { streak, lastStudyAt } = updateStreak(
            state.lastStudyAt,
            state.streak
          );
          return {
            streak,
            lastStudyAt,
            items: state.items.map((item) => {
              if (item.id !== id) return item;
              const mastery = Math.min(item.mastery + 1, 5);
              return {
                ...item,
                mastery,
                nextReview: calculateNextReview(mastery),
              };
            }),
          };
        }),
      markUnknown: (id) =>
        set((state) => {
          const { streak, lastStudyAt } = updateStreak(
            state.lastStudyAt,
            state.streak
          );
          return {
            streak,
            lastStudyAt,
            items: state.items.map((item) => {
              if (item.id !== id) return item;
              return {
                ...item,
                mastery: 0,
                nextReview: calculateNextReview(0),
              };
            }),
          };
        }),
      getDue: () => sortForReview(getDueItems(get().items)),
      getTopics: () => {
        const topics = new Set(
          get()
            .items
            .map((item) => item.topic?.trim())
            .filter((topic): topic is string => Boolean(topic))
        );
        const merged = new Set([...get().topics, ...topics]);
        return Array.from(merged).sort();
      },
    }),
    {
      name: "vocabulary-storage",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          // SSR: return a no-op storage so TypeScript is satisfied
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          } as unknown as Storage;
        }
        return localStorage;
      }),
    }
  )
);
