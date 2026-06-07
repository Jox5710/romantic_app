'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { RouteGuard } from '@/components/route-guard';
import { Card } from '@/components/ui/card';
import { GoldButton } from '@/components/ui/gold-button';
import { useToast } from '@/components/ui/toast';
import { format } from 'date-fns';
import { Mail, ExternalLink, RefreshCw, Trash2, Copy, KeyRound } from 'lucide-react';

interface AdminMailRow {
  id: string;
  to: string;
  from: string;
  subject: string;
  date: string;
  link: string | null;
  code: string | null;
  snippet: string;
}

export default function AdminMailPage() {
  const t = useTranslations('admin.mail');
  const { toast } = useToast();
  const [messages, setMessages] = useState<AdminMailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/mail', { cache: 'no-store' });
    if (!res.ok) { toast(t('loadError'), 'error'); setLoading(false); return; }
    const data = await res.json();
    setMessages(data.messages ?? []);
    setLoading(false);
  }, [t, toast]);

  useEffect(() => { load(); }, [load]);

  async function clearInbox() {
    setClearing(true);
    const res = await fetch('/api/admin/mail', { method: 'DELETE' });
    setClearing(false);
    if (!res.ok) { toast(t('clearError'), 'error'); return; }
    toast(t('cleared'), 'success');
    setMessages([]);
  }

  function copy(text: string, label: string) {
    navigator.clipboard?.writeText(text).then(
      () => toast(label, 'success'),
      () => toast(t('copyError'), 'error'),
    );
  }

  return (
    <RouteGuard>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <h1 className="font-display-en text-2xl sm:text-4xl text-ivory flex items-center gap-2">
              <Mail className="text-gold" size={26} /> {t('title')}
            </h1>
            <p className="text-ivoryDim text-sm">{t('subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <GoldButton variant="ghost" size="sm" onClick={load} loading={loading}>
              <RefreshCw size={14} /> {t('refresh')}
            </GoldButton>
            {messages.length > 0 && (
              <GoldButton variant="danger" size="sm" onClick={clearInbox} loading={clearing}>
                <Trash2 size={14} /> {t('clear')}
              </GoldButton>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((n) => <div key={n} className="h-24 rounded-2xl shimmer" />)}</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Mail size={32} className="mx-auto text-muted" />
            <p className="font-display-en text-2xl text-ivory">{t('empty.title')}</p>
            <p className="text-muted text-sm">{t('empty.body')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <Card key={m.id} variant="elevated" className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-ivory font-medium truncate">{m.subject}</p>
                    <p className="text-xs text-muted truncate">{t('to')}: {m.to}</p>
                  </div>
                  <p className="text-xs text-muted shrink-0">{format(new Date(m.date), 'PP p')}</p>
                </div>

                {m.snippet && <p className="text-xs text-ivoryDim leading-relaxed line-clamp-2">{m.snippet}</p>}

                <div className="flex flex-wrap items-center gap-2">
                  {m.link && (
                    <>
                      <a
                        href={m.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-gold text-bg px-4 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity"
                      >
                        <ExternalLink size={12} /> {t('openLink')}
                      </a>
                      <button
                        type="button"
                        onClick={() => copy(m.link!, t('linkCopied'))}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-muted hover:text-ivory transition-colors"
                      >
                        <Copy size={12} /> {t('copyLink')}
                      </button>
                    </>
                  )}
                  {m.code && (
                    <button
                      type="button"
                      onClick={() => copy(m.code!, t('codeCopied'))}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1.5 text-xs text-gold hover:bg-surface2 transition-colors"
                    >
                      <KeyRound size={12} /> {t('code')}: <span className="font-mono tracking-wider">{m.code}</span>
                    </button>
                  )}
                  {!m.link && !m.code && (
                    <span className="text-xs text-muted">{t('noAction')}</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
