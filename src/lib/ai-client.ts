/**
 * Shared helper for creating an AI client in API routes.
 *
 * Priority (highest → lowest):
 *   1. customRoute (baseURL + apiKey + model) — any OpenAI-compat provider
 *   2. Google Gemini  (googleApiKey)          — uses Gemini OpenAI-compat endpoint
 *   3. OpenAI         (openaiApiKey)
 *   4. OPENAI_API_KEY / GOOGLE_API_KEY env vars
 *
 * All providers are accessed through the OpenAI SDK using chat.completions.create().
 */
import OpenAI from "openai";

export type AIClientOptions = {
  /** Custom base URL (e.g. OpenRouter, LM Studio, …) */
  baseURL?: string;
  /** API key — could be OpenAI, Google, or custom-route key */
  apiKey?: string;
  /** Google AI API key (from settings "Google API Key") */
  googleApiKey?: string;
  /** The model to use (from settings) */
  model?: string;
  /** Google model name (from settings) */
  googleModel?: string;
};

export type ResolvedAI = {
  client: OpenAI;
  defaultModel: string;
  apiKey: string;
};

const GEMINI_OPENAI_COMPAT_BASE = "https://generativelanguage.googleapis.com/v1beta/openai/";

export function resolveAIClient(opts: AIClientOptions): ResolvedAI | null {
  // 1. Custom route (highest priority)
  if (opts.baseURL && opts.apiKey?.trim()) {
    const client = new OpenAI({
      apiKey: opts.apiKey.trim(),
      baseURL: opts.baseURL,
      defaultHeaders: { "HTTP-Referer": "hoctienganh", "X-Title": "HocTiengAnh" },
    });
    return { client, defaultModel: opts.model || "gpt-4o-mini", apiKey: opts.apiKey.trim() };
  }

  // 2. OpenAI key (from client or env)
  const openaiKey = opts.apiKey?.trim() || process.env.OPENAI_API_KEY?.trim() || "";
  if (openaiKey) {
    const client = new OpenAI({ apiKey: openaiKey });
    return { client, defaultModel: opts.model || "gpt-4o-mini", apiKey: openaiKey };
  }

  // 3. Google Gemini key (from client or env)
  const googleKey = opts.googleApiKey?.trim() || process.env.GOOGLE_API_KEY?.trim() || "";
  if (googleKey) {
    const client = new OpenAI({
      apiKey: googleKey,
      baseURL: GEMINI_OPENAI_COMPAT_BASE,
    });
    return {
      client,
      defaultModel: opts.googleModel || opts.model || "gemini-1.5-flash",
      apiKey: googleKey,
    };
  }

  return null;
}
