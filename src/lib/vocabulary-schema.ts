import { z } from "zod";

export const partOfSpeechEnum = z.enum([
  "noun", "verb", "adjective", "adverb",
  "preposition", "conjunction", "pronoun", "phrase", "other",
]);

export const vocabularyInputSchema = z.object({
  word: z.string().min(1, "Word is required"),
  phonetic: z.string().min(1, "Phonetic transcription is required"),
  meaning: z.string().min(1, "Meaning is required"),
  partOfSpeech: partOfSpeechEnum.optional(),
  collocations: z.array(z.string().min(1)).optional(),
  examples: z
    .array(z.string().min(1, "Example must not be empty"))
    .min(2, "At least 2 example sentences are required"),
  topic: z.string().optional(),
});

export const vocabularyListSchema = z.array(vocabularyInputSchema).min(1);

export const generateRequestSchema = z.object({
  topic: z.string().min(1),
  count: z.number().int().min(1).max(30),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  model: z.string().optional(),
  existingWords: z.array(z.string()).optional(),
});

export const exampleRequestSchema = z.object({
  word: z.string().min(1),
  meaning: z.string().min(1),
  topic: z.string().optional(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  count: z.number().int().min(2).max(5).optional(),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  model: z.string().optional(),
});

export const exampleResponseSchema = z.object({
  examples: z
    .array(z.string().min(1, "Example must not be empty"))
    .min(2, "At least 2 example sentences are required"),
});

export const practiceRequestSchema = z.object({
  word: z.string().min(1),
  meaning: z.string().min(1),
  topic: z.string().optional(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  model: z.string().optional(),
});

export const practiceResponseSchema = z.object({
  english: z.string().min(1),
  vietnamese: z.string().min(1),
});

export const topicGenerateRequestSchema = z.object({
  count: z.number().int().min(3).max(20).optional(),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  model: z.string().optional(),
});

export const topicGenerateResponseSchema = z.object({
  topics: z.array(z.string().min(1)).min(1),
});
