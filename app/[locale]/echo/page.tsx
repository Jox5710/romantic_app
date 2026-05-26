'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { format, getMonth, getDate } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { Card } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTutorial } from '@/components/tutorial/use-tutorial';

interface EchoItem {
  type: 'memory' | 'gratitude' | 'prompt_answer';
  date: string;
  text: string;
  year: number;
}

export default function EchoPage() {
  const t = useTranslations('echo');

  useTutorial('echo', [
    { id: 'echo-title', titleKey: 'echo.step1.title', descKey: 'echo.step1.desc' },
    { id: 'echo-list', titleKey: 'echo.step2.title', descKey: 'echo.step2.desc' },
    { id: 'echo-item', titleKey: 'echo.step3.title', descKey: 'echo.step3.desc' },
  ]);
  const { coupleId } = useCoupleState();
  const [items, setItems] = useState<EchoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coupleId) return;
    const supabase = createClient();
    const now = new Date();
    const m = getMonth(now) + 1;
    const d = getDate(now);

    Promise.all([
      supabase.from('memories').select('caption,occurred_at').eq('couple_id', coupleId),
      supabase.from('gratitudes').select('for_text,created_at').eq('couple_id', coupleId),
    ]).then(([mem, grat]) => {
      const all: EchoItem[] = [];

      (mem.data ?? []).forEach((r: { caption: string; occurred_at: string }) => {
        const d2 = new Date(r.occurred_at);
        if (getMonth(d2) + 1 === m && getDate(d2) === d && d2.getFullYear() < now.getFullYear()) {
          all.push({ type: 'memory', date: r.occurred_at, text: r.caption, year: d2.getFullYear() });
        }
      });

      (grat.data ?? []).forEach((r: { for_text: string; created_at: string }) => {
        const d2 = new Date(r.created_at);
        if (getMonth(d2) + 1 === m && getDate(d2) === d && d2.getFullYear() < now.getFullYear()) {
          all.push({ type: 'gratitude', date: r.created_at, text: r.for_text, year: d2.getFullYear() });
        }
      });

      all.sort((a, b) => b.year - a.year);
      setItems(all);
      setLoading(false);
    });
  }, [coupleId]);

  const typeLabel = { memory: '✦ Memory', gratitude: '🌿 Gratitude', prompt_answer: '💬 Prompt' };

  return (
    <RouteGuard>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
          <p className="text-ivoryDim text-sm mt-1">{t('subtitle')}</p>
          <p className="text-gold text-sm mt-2">
            {t('today')} — {format(new Date(), 'MMMM d')}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2].map(n => <div key={n} className="h-20 rounded-2xl shimmer" />)}</div>
        ) : !items.length ? (
          <div className="text-center py-16 space-y-3">
            <CalendarDays size={32} className="mx-auto text-muted" />
            <p className="font-display-en text-2xl text-ivory">{t('empty.title')}</p>
            <p className="text-muted text-sm">{t('empty.body')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card variant="elevated" className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gold">{typeLabel[item.type]}</span>
                    <span className="text-xs text-muted">{item.year}</span>
                  </div>
                  <p className="text-ivory">{item.text}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
