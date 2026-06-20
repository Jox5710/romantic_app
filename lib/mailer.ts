// Server-only transactional mailer (Gmail SMTP via nodemailer).
//
// Reads the same SMTP_* env the GoTrue auth container uses (set in
// .env.production), so app-sent mail (the partner invitation) goes out the same
// real mailbox as the magic links. When SMTP is unconfigured the helpers no-op
// gracefully so local/dev builds never crash — they just don't deliver.
import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  // A real provider needs host + credentials. MailHog (host 'mailhog', no auth)
  // can't reach real inboxes, so treat a missing user/pass as "not configured".
  if (!host || !user || !pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: { user, pass },
    });
  }
  return transporter;
}

export function mailerConfigured(): boolean {
  return getTransporter() !== null;
}

/** Send one HTML email. Returns true on success, false if unconfigured/failed. */
export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const tx = getTransporter();
  if (!tx) return false;
  const fromName = process.env.SMTP_SENDER_NAME || 'Forever';
  const fromAddr = process.env.SMTP_ADMIN_EMAIL || process.env.SMTP_USER!;
  try {
    await tx.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return true;
  } catch {
    return false;
  }
}
