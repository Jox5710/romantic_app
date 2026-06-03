/**
 * Gemini SDK wrapper — SERVER-ONLY.
 *
 * NEVER import this module from a client component. The Google SDK is fine to
 * ship to the browser in theory, but `GEMINI_API_KEY` lives in `process.env`
 * without a `NEXT_PUBLIC_` prefix on purpose — Next.js refuses to inline it
 * into client bundles, so any client-side import would 500 at runtime when
 * `process.env.GEMINI_API_KEY` reads `undefined`.
 *
 * Usage from a Route Handler:
 *
 *   import { generate, MissingKeyError } from '@/lib/llm/gemini';
 *   const text = await generate('Soften this message: ...');
 */

import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';

export class MissingKeyError extends Error {
  constructor() {
    super('GEMINI_API_KEY is not configured in the server environment.');
    this.name = 'MissingKeyError';
  }
}

// Memoised model — one client + one model per Node process. Re-instantiating
// per request adds ~80ms of cold setup that we don't need.
let _model: GenerativeModel | null = null;

function getModel(): GenerativeModel {
  if (_model) return _model;
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new MissingKeyError();
  const genai = new GoogleGenerativeAI(key);
  _model = genai.getGenerativeModel({
    model: 'gemini-1.5-flash',
    // Defaults are fine; lock in deterministic-ish temperature for tonal
    // tasks (soften especially benefits from low variance).
    generationConfig: { temperature: 0.6, maxOutputTokens: 512 },
  });
  return _model;
}

/**
 * Run a single-prompt completion. Returns the trimmed text response.
 * Throws MissingKeyError when GEMINI_API_KEY is unset, generic Error for
 * SDK / network failures — the caller maps these to HTTP status codes.
 */
export async function generate(prompt: string): Promise<string> {
  const model = getModel();
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
