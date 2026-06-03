'use client';

/**
 * Whisper "soften" client. Calls our own Next.js Route Handler at
 * /api/llm/soften, which holds the Gemini API key server-side. The browser
 * never sees the key — it just POSTs the text + locale and reads back the
 * gentler rewrite.
 *
 * Status semantics:
 *   ok     — `softened` is populated; caller fills the textarea.
 *   error  — server rejected (no key, upstream failure, network blip);
 *            caller shows a toast.
 * The previous `unconfigured` status is gone: the server returns 503 with
 * `error: 'llmUnavailable'` if no key is set, which we surface as `error`.
 * One status to handle in the UI, one toast to show.
 */

export type SoftenStatus = 'ok' | 'error';

export interface SoftenResult {
  status: SoftenStatus;
  softened?: string;
}

export async function softenText(input: { text: string; locale: string }): Promise<SoftenResult> {
  try {
    const r = await fetch('/api/llm/soften', {
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
