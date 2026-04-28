/**
 * Shared helper for creating an OpenAI client in API routes.
 * Priority: body.apiKey (from settings store) → OPENAI_API_KEY env
 * If body.customRoute is set, uses that baseURL and model instead.
 */
import OpenAI from "openai";

export type AIClientOptions = {
  /** API key from the client settings store (optional) */
  apiKey?: string;
  /** Custom base URL (e.g. OpenRouter, LM Studio, …) */
  baseURL?: string;
  /** The model to use (from settings) */
  model?: string;
};

export type ResolvedAI = {
  client: OpenAI;
  defaultModel: string;
  apiKey: string;
};

export function resolveAIClient(opts: AIClientOptions): ResolvedAI | null {
  const envKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const key = opts.apiKey?.trim() || envKey;

  if (!key) return null;

  const clientOpts: ConstructorParameters<typeof OpenAI>[0] = { apiKey: key };
  if (opts.baseURL) {
    clientOpts.baseURL = opts.baseURL;
    clientOpts.defaultHeaders = { "HTTP-Referer": "hoctienganh", "X-Title": "HocTiengAnh" };
  }

  return {
    client: new OpenAI(clientOpts),
    defaultModel: opts.model || "gpt-4o-mini",
    apiKey: key,
  };
}
