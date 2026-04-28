export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "preposition"
  | "conjunction"
  | "pronoun"
  | "phrase"
  | "other";

export type VocabularyItem = {
  id: string;
  word: string;
  phonetic: string;
  meaning: string;
  partOfSpeech?: PartOfSpeech;
  collocations?: string[]; // e.g. ["decide + to do sth", "decide on sth"]
  examples: string[];
  topic?: string;
  createdAt: string;
  nextReview: string;
  mastery: number;
  source: "ai" | "manual";
};

export type VocabularyInput = Omit<
  VocabularyItem,
  "id" | "createdAt" | "nextReview" | "mastery" | "source"
> & {
  topic?: string;
};
