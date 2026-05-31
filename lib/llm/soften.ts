'use client';

/**
 * LLM-agnostic "soften" call. The whisper feature lets a user rewrite a harsh
 * message into a gentler one; the actual rewrite is delegated to whatever LLM
 * the operator wires up in production.
 *
 * To enable in production, set:
 *   NEXT_PUBLIC_SOFTEN_URL = https://<your-endpoint>/soften
 *
 * The endpoint receives `{ text, locale }` (JSON POST) and must return
 * `{ softened: string }`. Implement it as a serverless function (Vercel Edge,
 * Cloud Run, Lambda, Supabase Edge Function, …) that calls your provider of
 * choice — Gemini / Anthropic / OpenAI / local — keeping the provider API key
 * server-side.
 *
 * Returns:
 *   string  — the softened text (caller fills the textarea).
 *   null    — provider not configured or failed; caller shows a toast.
 */
export type SoftenStatus = 'ok' | 'unconfigured' | 'error';

export interface SoftenResult {
  status: SoftenStatus;
  softened?: string;
}

export async function softenText(input: { text: string; locale: string }): Promise<SoftenResult> {
  const url = process.env.NEXT_PUBLIC_SOFTEN_URL;
  if (!url) return { status: 'unconfigured' };
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!r.ok) return { status: 'error' };
    const j = (await r.json()) as { softened?: unknown };
    if (typeof j?.softened === 'string' && j.softened.trim()) {
      return { status: 'ok', softened: j.softened };
    }
    return { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}
