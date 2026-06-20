/**
 * Gemini SDK wrapper — SERVER-ONLY.
 *
 * NEVER import this module from a client component. `GEMINI_API_KEY` lives in
 * `process.env` without a `NEXT_PUBLIC_` prefix on purpose — Next.js refuses to
 * inline it into client bundles, so any client-side import would 500 at runtime.
 *
 * Resilience (this is what fixes the intermittent 502s on "soften"):
 *   1. MODEL FALLBACK CHAIN — Gemini's free tier caps requests PER MODEL PER DAY
 *      (e.g. gemini-2.5-flash = 20/day). When one model returns 429 RESOURCE_
 *      EXHAUSTED we immediately try the next model, which has its own separate
 *      daily bucket. Primary is a *-lite model (much higher daily quota).
 *   2. RETRY w/ BACKOFF — transient 5xx / network blips retry the same model.
 *   3. SERIALISED QUEUE — all calls run one-at-a-time with min spacing so rapid
 *      clicks / concurrent users can't burst the API.
 *   4. THINKING DISABLED — 2.5 models "think" by default and silently spend the
 *      output budget, yielding truncated/empty answers; we turn it off.
 *
 * Override the chain with GEMINI_MODELS="modelA,modelB,...".
 */

import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';

export class MissingKeyError extends Error {
  constructor() {
    super('GEMINI_API_KEY is not configured in the server environment.');
    this.name = 'MissingKeyError';
  }
}

// Ordered by daily-quota headroom: *-lite first (highest free RPD), then
// distinct models that each carry their own separate daily bucket.
const MODEL_CHAIN = (process.env.GEMINI_MODELS
  ? process.env.GEMINI_MODELS.split(',').map((s) => s.trim()).filter(Boolean)
  : ['gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash']);

// One memoised GenerativeModel per model name.
const _models = new Map<string, GenerativeModel>();

function getModel(name: string): GenerativeModel {
  const cached = _models.get(name);
  if (cached) return cached;
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new MissingKeyError();
  const genai = new GoogleGenerativeAI(key);
  // Kept as a variable (not an inline literal) so TS's excess-property check
  // doesn't reject `thinkingConfig` — the SDK forwards it to the REST API.
  const generationConfig = {
    temperature: 0.6,
    maxOutputTokens: 1024,
    thinkingConfig: { thinkingBudget: 0 },
  };
  const model = genai.getGenerativeModel({ model: name, generationConfig });
  _models.set(name, model);
  return model;
}

const MAX_RETRIES = 2; // per model, for transient errors only
const MIN_INTERVAL_MS = 300;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function msg(err: unknown): string {
  return (err instanceof Error ? err.message : String(err)).toLowerCase();
}
// Quota exhausted for THIS model → don't retry it, jump to the next model.
function isQuota(err: unknown): boolean {
  return /\b429\b|quota|resource_?exhausted|exceeded/.test(msg(err));
}
// Transient → worth retrying the SAME model with backoff.
function isRetryable(err: unknown): boolean {
  return /\b(500|502|503|504)\b|overload|unavailable|timeout|timed out|deadline|fetch failed|network|econn|socket|reset/.test(msg(err));
}

async function generateOnce(name: string, prompt: string): Promise<string> {
  const model = getModel(name);
  const result = await model.generateContent(prompt);
  // `.text()` throws when the candidate has no text part (safety block / empty
  // generation). Treat that as empty so we retry / fall back instead of 502ing.
  let text = '';
  try { text = result.response.text(); } catch { text = ''; }
  return text.trim();
}

async function generateWithFallback(prompt: string): Promise<string> {
  let lastErr: unknown = new Error('llm failed');

  for (const name of MODEL_CHAIN) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const text = await generateOnce(name, prompt);
        if (text) return text;
        lastErr = new Error('empty response'); // retry same model
      } catch (e) {
        if (e instanceof MissingKeyError) throw e; // env problem — abort all
        lastErr = e;
        if (isQuota(e)) break;       // this model is tapped out → next model
        if (!isRetryable(e)) break;  // genuine error → next model
      }
      if (attempt < MAX_RETRIES) {
        await sleep(Math.round(400 * 2 ** attempt + Math.random() * 200));
      }
    }
    // fall through to the next model in the chain
  }

  throw lastErr instanceof Error ? lastErr : new Error('llm failed');
}

// Single FIFO queue tail — every generate() chains onto the previous one.
let queueTail: Promise<unknown> = Promise.resolve();
let lastStart = 0;

/**
 * Run a single-prompt completion. Returns the trimmed text response.
 * Throws MissingKeyError when GEMINI_API_KEY is unset; throws a generic Error
 * only after exhausting every model + retry — the caller maps these to HTTP.
 */
export async function generate(prompt: string): Promise<string> {
  const run = queueTail.then(async () => {
    const wait = MIN_INTERVAL_MS - (Date.now() - lastStart);
    if (wait > 0) await sleep(wait);
    lastStart = Date.now();
    return generateWithFallback(prompt);
  });
  queueTail = run.catch(() => {});
  return run as Promise<string>;
}

// ─── Image generation (multimodal: image-in → image-out) ─────────────────────

export interface ImagePart {
  /** e.g. 'image/jpeg' | 'image/png' */
  mimeType: string;
  /** base64-encoded bytes, NO data-URL prefix */
  data: string;
}

export class NoImageError extends Error {
  constructor() {
    super('The image model returned no image (likely a safety block).');
    this.name = 'NoImageError';
  }
}

// Distinct from the text MODEL_CHAIN — this is an image-capable model.
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

/**
 * Combine input images with a text prompt and return a single generated image.
 * Used by the pose studio (two couple photos → one romantic portrait). Shares
 * the global FIFO queue so it can't burst the API alongside text calls.
 */
export async function generateImage(prompt: string, images: ImagePart[]): Promise<ImagePart> {
  const run = queueTail.then(async () => {
    const wait = MIN_INTERVAL_MS - (Date.now() - lastStart);
    if (wait > 0) await sleep(wait);
    lastStart = Date.now();

    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new MissingKeyError();
    const genai = new GoogleGenerativeAI(key);
    const model = genai.getGenerativeModel({ model: IMAGE_MODEL });

    const parts = [
      { text: prompt },
      ...images.map((im) => ({ inlineData: { mimeType: im.mimeType, data: im.data } })),
    ];

    const result = await model.generateContent(parts);
    const outParts = result.response.candidates?.[0]?.content?.parts ?? [];
    for (const p of outParts) {
      const inline = (p as { inlineData?: { mimeType?: string; data?: string } }).inlineData;
      if (inline?.data) {
        return { mimeType: inline.mimeType || 'image/png', data: inline.data };
      }
    }
    throw new NoImageError();
  });
  queueTail = run.catch(() => {});
  return run as Promise<ImagePart>;
}
