import { requireAdmin, jsonOk, jsonError } from '../_helpers';

/**
 * GET  /api/admin/mail   → list recent emails from MailHog, with the magic /
 *                          confirmation link and login code already extracted.
 * DELETE /api/admin/mail  → clear the whole MailHog inbox.
 *
 * The app server talks to MailHog over the docker network (mailhog:8025). The
 * browser can't reach that host, so this route is the bridge: admins read and
 * act on auth emails (magic links, confirmations, invites) without leaving the
 * dashboard. Override the host with MAILHOG_API_URL if the service name differs.
 */
const MAILHOG = process.env.MAILHOG_API_URL || 'http://mailhog:8025';

interface MailHogItem {
  ID: string;
  Created: string;
  Content: { Headers: Record<string, string[]>; Body: string };
}

export interface AdminMailRow {
  id: string;
  to: string;
  from: string;
  subject: string;
  date: string;
  link: string | null;
  code: string | null;
  snippet: string;
}

// MailHog stores bodies quoted-printable encoded. Undo soft line breaks (=\n)
// and =XX hex escapes so links/codes come out clean.
function decodeQuotedPrintable(input: string): string {
  return input
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function firstHeader(headers: Record<string, string[]>, name: string): string {
  const v = headers[name];
  return Array.isArray(v) && v.length ? v[0] : '';
}

function parseItem(item: MailHogItem): AdminMailRow {
  const headers = item.Content.Headers;
  const body = decodeQuotedPrintable(item.Content.Body || '');

  // Pull the GoTrue action URL (verify / accept / recover). Strip any trailing
  // HTML-entity cruft, and prefer https so it opens cleanly from the panel.
  const linkMatch = body.match(/https?:\/\/[^\s"'<>]*\/(?:auth\/v1\/verify|accept)[^\s"'<>]*/i);
  let link = linkMatch ? linkMatch[0].replace(/&amp;/g, '&') : null;
  if (link && link.startsWith('http://')) link = 'https://' + link.slice('http://'.length);

  // GoTrue also prints a 6-digit OTP ("enter the code: 123456").
  const codeMatch = body.match(/\b(\d{6})\b/);
  const code = codeMatch ? codeMatch[1] : null;

  const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  return {
    id: item.ID,
    to: firstHeader(headers, 'To'),
    from: firstHeader(headers, 'From'),
    subject: firstHeader(headers, 'Subject') || '(no subject)',
    date: item.Created,
    link,
    code,
    snippet: text.slice(0, 140),
  };
}

export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const res = await fetch(`${MAILHOG}/api/v2/messages?limit=50`, { cache: 'no-store' });
    if (!res.ok) return jsonError('mailUnavailable', 502);
    const data = (await res.json()) as { items?: MailHogItem[] };
    const rows = (data.items ?? []).map(parseItem);
    return jsonOk({ messages: rows });
  } catch {
    return jsonError('mailUnavailable', 502);
  }
}

export async function DELETE() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const res = await fetch(`${MAILHOG}/api/v1/messages`, { method: 'DELETE' });
    if (!res.ok) return jsonError('mailUnavailable', 502);
    return jsonOk({ success: true });
  } catch {
    return jsonError('mailUnavailable', 502);
  }
}
