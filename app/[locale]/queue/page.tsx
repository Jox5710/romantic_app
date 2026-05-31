'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { GoldButton } from '@/components/ui/gold-button';
import { Field } from '@/components/ui/field';
import { GoldSeal } from '@/components/ui/gold-seal';
import { PlaySquare, Plus, Check } from 'lucide-react';
import { useTutorial } from '@/components/tutorial/use-tutorial';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/toast';

type QueueCategory = 'movie' | 'show' | 'book' | 'place';
const CATEGORIES: QueueCategory[] = ['movie', 'show', 'book', 'place'];
const CATEGORY_ICONS: Record<QueueCategory, string> = { movie: '🎬', show: '📺', book: '📚', place: '📍' };

interface QueueItem {
  id: string;
  title: string;
  category: QueueCategory;
  url: string | null;
  image_url: string | null;
  position: number;
  watched_at: string | null;
  rating_a: number | null;
  rating_b: number | null;
}

function useQueue(coupleId: string | null, cat: QueueCategory) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['queue', coupleId, cat],
    enabled: !!coupleId,
    queryFn: async () => {
      const { data } = await supabase
        .from('queue_items')
        .select('*')
        .eq('couple_id', coupleId!)
        .eq('category', cat)
        .order('position');
      return (data ?? []) as QueueItem[];
    },
  });
}

export default function QueuePage() {
  const t = useTranslations('queue');
  const tc = useTranslations('common');
  const { toast } = useToast();

  useTutorial('queue', [
    { id: 'queue-title', titleKey: 'queue.step1.title', descKey: 'queue.step1.desc' },
    { id: 'queue-tabs', titleKey: 'queue.step2.title', descKey: 'queue.step2.desc' },
    { id: 'queue-list', titleKey: 'queue.step3.title', descKey: 'queue.step3.desc' },
  ]);
  const { coupleId } = useCoupleState();
  const qc = useQueryClient();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<QueueCategory>('movie');
  const { data: items = [] } = useQueue(coupleId, activeTab);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const pending = items.filter((i) => !i.watched_at);
  const watched = items.filter((i) => i.watched_at);

  const addItem = useMutation({
    mutationFn: async () => {
      if (!coupleId || !title.trim()) return;
      const maxPos = items.reduce((m, i) => Math.max(m, i.position), 0);
      await supabase.from('queue_items').insert({
        couple_id: coupleId,
        title,
        category: activeTab,
        url: url || null,
        position: maxPos + 1,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['queue', coupleId, activeTab] }); setTitle(''); setUrl(''); setShowForm(false); },
    onError: () => toast(tc('error'), 'error'),
  });

  const markWatched = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('queue_items').update({ watched_at: new Date().toISOString() }).eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue', coupleId, activeTab] }),
    onError: () => toast(tc('error'), 'error'),
  });

  return (
    <RouteGuard>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <PlaySquare size={28} className="text-gold" />
          <div>
            <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
            <p className="text-ivoryDim text-sm mt-0.5">{t('subtitle')}</p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => { setActiveTab(cat); setShowForm(false); }}
              className={[
                'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-colors',
                activeTab === cat ? 'bg-gold text-bg' : 'border border-line text-muted hover:text-ivory',
              ].join(' ')}
            >
              <span>{CATEGORY_ICONS[cat]}</span> {t(`categories.${cat}`)}
            </button>
          ))}
        </div>

        {/* Pending items */}
        {pending.length > 0 && (
          <div className="space-y-2">
            {pending.map((item) => (
              <Card key={item.id} variant="elevated" className="flex items-center gap-3">
                <span className="text-xl">{CATEGORY_ICONS[item.category]}</span>
                <div className="flex-1">
                  <p className="text-ivory">{item.title}</p>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold/70 hover:text-gold">
                      {new URL(item.url).hostname}
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => markWatched.mutate(item.id)}
                  disabled={markWatched.isPending && markWatched.variables === item.id}
                  className="text-muted hover:text-gold transition-colors disabled:opacity-50"
                  aria-label={t('watched')}
                >
                  <Check size={16} />
                </button>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {pending.length === 0 && !showForm && (
          <div className="text-center py-12 space-y-3">
            <p className="text-4xl">{CATEGORY_ICONS[activeTab]}</p>
            <p className="text-muted text-sm">{t('empty.body')}</p>
          </div>
        )}

        {/* Add form */}
        {showForm ? (
          <Card variant="elevated" className="space-y-4">
            <Field label={t('form.title')} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Name…" />
            <Field label={t('form.url')} value={url} onChange={(e) => setUrl(e.target.value)} type="url" placeholder="https://…" />
            <div className="flex gap-2">
              <GoldButton onClick={() => addItem.mutate()} loading={addItem.isPending} size="sm" disabled={!title.trim()}>{tc('add')}</GoldButton>
              <GoldButton variant="ghost" size="sm" onClick={() => setShowForm(false)}>{tc('cancel')}</GoldButton>
            </div>
          </Card>
        ) : (
          <GoldButton variant="ghost" onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus size={16} /> {t('add')}
          </GoldButton>
        )}

        {/* Watched */}
        {watched.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-muted text-xs uppercase tracking-widest">{t('completedHeader')}</h2>
            {watched.map((item) => (
              <Card key={item.id} variant="default" className="flex items-center gap-3 opacity-60">
                <GoldSeal />
                <div className="flex-1">
                  <p className="text-ivory line-through decoration-muted">{item.title}</p>
                  <p className="text-xs text-muted">{format(new Date(item.watched_at!), 'PPP')}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
