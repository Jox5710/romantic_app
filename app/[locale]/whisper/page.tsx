'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useWhispers, useSentTodayWhisper, useSendWhisper, useRespondToWhisper } from '@/lib/queries/whisper';
import { FeelingChips } from '@/components/whisper/feeling-chips';
import { GoldButton } from '@/components/ui/gold-button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { softenText } from '@/lib/llm/soften';
import { Wind, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import type { WhisperFeeling, WhisperResponse } from '@/lib/supabase/types';
import { useTutorial } from '@/components/tutorial/use-tutorial';

export default function WhisperPage() {
  const t = useTranslations('whisper');

  useTutorial('whisper', [
    { id: 'whisper-title', titleKey: 'whisper.step1.title', descKey: 'whisper.step1.desc' },
    { id: 'whisper-compose', titleKey: 'whisper.step2.title', descKey: 'whisper.step2.desc' },
    { id: 'whisper-soften', titleKey: 'whisper.step3.title', descKey: 'whisper.step3.desc' },
    { id: 'whisper-inbox', titleKey: 'whisper.step4.title', descKey: 'whisper.step4.desc' },
  ]);
  const tCompose = useTranslations('whisper.compose');
  const locale = useLocale();
  const { toast } = useToast();
  const { session, coupleId } = useCoupleState();
  const { data: whispers } = useWhispers(coupleId);
  const { data: sentToday } = useSentTodayWhisper(session?.user.id ?? null);
  const send = useSendWhisper();
  const respond = useRespondToWhisper();

  const [partnerUserId, setPartnerUserId] = useState<string | null>(null);
  const [what, setWhat] = useState('');
  const [feeling, setFeeling] = useState<WhisperFeeling>('unseen');
  const [wish, setWish] = useState('');
  const [softening, setSoftening] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!coupleId || !session) return;
    const supabase = createClient();
    supabase
      .from('couple_members')
      .select('user_id')
      .eq('couple_id', coupleId)
      .neq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setPartnerUserId(data?.user_id ?? null));
  }, [coupleId, session]);

  async function soften() {
    if (!what.trim()) return;
    setSoftening(true);
    const result = await softenText({ text: what, locale });
    setSoftening(false);
    if (result.status === 'ok' && result.softened) {
      setWhat(result.softened);
    } else {
      toast(tCompose('softenUnavailable'));
    }
  }

  async function submitWhisper() {
    if (!coupleId || !session || !partnerUserId) return;
    await send.mutateAsync({
      couple_id: coupleId,
      author_id: session.user.id,
      recipient_id: partnerUserId,
      body_what: what,
      feeling,
      body_wish: wish,
    });
    setSent(true);
    setWhat(''); setWish('');
  }

  const deliveredToMe = whispers?.filter(
    (w) => w.recipient_id === session?.user.id && new Date(w.deliver_at) <= new Date(),
  ) ?? [];

  return (
    <RouteGuard>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div data-tutorial-id="whisper-title">
          <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
          <p className="text-ivoryDim text-sm mt-1">{t('subtitle')}</p>
        </div>

        {sentToday ? (
          <Card variant="elevated" className="text-center py-6 space-y-2">
            <p className="text-gold text-2xl">✦</p>
            <p className="text-ivory">{tCompose('cooldown')}</p>
          </Card>
        ) : sent ? (
          <Card variant="elevated" className="text-center py-6 space-y-2">
            <Wind size={28} className="mx-auto text-gold" />
            <p className="text-ivory">{tCompose('delivering')}</p>
          </Card>
        ) : (
          <Card variant="elevated" className="space-y-5" data-tutorial-id="whisper-compose">
            <h2 className="text-gold text-sm uppercase tracking-wider">{tCompose('title')}</h2>
            <div className="space-y-1.5">
              <label className="text-xs text-ivoryDim uppercase tracking-wider">{tCompose('what')}</label>
              <div className="flex gap-2">
                <textarea
                  value={what}
                  onChange={(e) => setWhat(e.target.value)}
                  rows={3}
                  className="flex-1 bg-surface2 border border-line rounded-xl px-4 py-3 text-ivory placeholder:text-muted focus:outline-none focus:border-gold resize-none text-sm"
                />
              </div>
              {what.trim() && (
                <button
                  type="button"
                  onClick={soften}
                  disabled={softening}
                  className="flex items-center gap-1.5 text-xs text-gold hover:text-goldBright"
                >
                  <Sparkles size={12} />
                  {tCompose('soften')}
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-ivoryDim uppercase tracking-wider">{tCompose('feeling')}</label>
              <FeelingChips value={feeling} onChange={setFeeling} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-ivoryDim uppercase tracking-wider">{tCompose('wish')}</label>
              <textarea
                value={wish}
                onChange={(e) => setWish(e.target.value)}
                rows={2}
                className="w-full bg-surface2 border border-line rounded-xl px-4 py-3 text-ivory placeholder:text-muted focus:outline-none focus:border-gold resize-none text-sm"
              />
            </div>

            <GoldButton
              onClick={submitWhisper}
              loading={send.isPending}
              disabled={!what.trim() || !wish.trim()}
              className="w-full"
            >
              {tCompose('send')}
            </GoldButton>
          </Card>
        )}

        {deliveredToMe.length > 0 && (
          <div className="space-y-3" data-tutorial-id="whisper-inbox">
            <h2 className="text-gold text-sm uppercase tracking-wider">{t('read.from')}</h2>
            {deliveredToMe.map((w) => (
              <Card key={w.id} variant="elevated" className="space-y-4">
                <p className="text-xs text-muted">{format(new Date(w.sent_at), 'PPp')}</p>
                <p className="text-ivory">{w.body_what}</p>
                <p className="text-ivoryDim text-sm italic">Feeling: {w.feeling}</p>
                <p className="text-ivoryDim text-sm">{w.body_wish}</p>
                {!w.response && (
                  <div className="flex gap-2 flex-wrap">
                    {(['heard', 'tell_more', 'lets_talk'] as WhisperResponse[]).map((r) => (
                      <GoldButton
                        key={r}
                        variant="ghost"
                        size="sm"
                        onClick={() => respond.mutate({ id: w.id, response: r })}
                      >
                        {t(`read.response.${r}`)}
                      </GoldButton>
                    ))}
                  </div>
                )}
                {w.response && (
                  <p className="text-gold text-sm">✓ {t(`read.response.${w.response}`)}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
