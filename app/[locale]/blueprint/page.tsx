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
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { useTutorial } from '@/components/tutorial/use-tutorial';
import { useToast } from '@/components/ui/toast';

type Category = 'sizes' | 'tastes' | 'vitals' | 'family';
const CATEGORIES: Category[] = ['sizes', 'tastes', 'vitals', 'family'];

interface BlueprintItem {
  id: string;
  user_id: string;
  category: string;
  label: string;
  value: string;
}

function useBlueprint(coupleId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['blueprint', coupleId],
    enabled: !!coupleId,
    queryFn: async () => {
      const { data } = await supabase
        .from('blueprint_items')
        .select('*')
        .eq('couple_id', coupleId!)
        .order('created_at');
      return (data ?? []) as BlueprintItem[];
    },
  });
}

function useAddBlueprint(coupleId: string | null, userId: string | null) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: { category: string; label: string; value: string }) => {
      await supabase.from('blueprint_items').insert({ couple_id: coupleId!, user_id: userId!, ...vals });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blueprint', coupleId] }),
  });
}

function useDeleteBlueprint(coupleId: string | null) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await supabase.from('blueprint_items').delete().eq('id', id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blueprint', coupleId] }),
  });
}

export default function BlueprintPage() {
  const t = useTranslations('blueprint');
  const tc = useTranslations('common');
  const { toast } = useToast();

  useTutorial('blueprint', [
    { id: 'blueprint-title', titleKey: 'blueprint.step1.title', descKey: 'blueprint.step1.desc' },
    { id: 'blueprint-tabs', titleKey: 'blueprint.step2.title', descKey: 'blueprint.step2.desc' },
    { id: 'blueprint-items', titleKey: 'blueprint.step3.title', descKey: 'blueprint.step3.desc' },
  ]);
  const { session, coupleId } = useCoupleState();
  const { data: items = [] } = useBlueprint(coupleId);
  const add = useAddBlueprint(coupleId, session?.user.id ?? null);
  const del = useDeleteBlueprint(coupleId);

  const [activeTab, setActiveTab] = useState<Category>('sizes');
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');

  const tabItems = items.filter((i) => i.category === activeTab);

  async function submit() {
    if (!label.trim() || !value.trim()) return;
    try {
      await add.mutateAsync({ category: activeTab, label, value });
      setLabel(''); setValue(''); setShowForm(false);
    } catch {
      toast(tc('error'), 'error');
    }
  }

  return (
    <RouteGuard>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardList size={28} className="text-gold" />
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
                'px-4 py-1.5 rounded-full text-sm transition-colors',
                activeTab === cat ? 'bg-gold text-bg' : 'border border-line text-muted hover:text-ivory',
              ].join(' ')}
            >
              {t(`categories.${cat}`)}
            </button>
          ))}
        </div>

        {/* Items list */}
        {tabItems.length === 0 && !showForm ? (
          <div className="text-center py-16 space-y-4">
            <ClipboardList size={40} className="mx-auto text-muted/40" />
            <p className="text-muted">{t('empty.body')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tabItems.map((item) => (
              <Card key={item.id} variant="elevated" className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-muted uppercase tracking-wider">{item.label}</p>
                  <p className="text-ivory font-medium">{item.value}</p>
                  {item.user_id === session?.user.id && (
                    <p className="text-xs text-gold/60 mt-0.5">{t('you')}</p>
                  )}
                </div>
                {item.user_id === session?.user.id && (
                  <button
                    type="button"
                    onClick={() => del.mutate(item.id, { onError: () => toast(tc('error'), 'error') })}
                    className="text-muted hover:text-red-400 transition-colors"
                    aria-label={tc('delete')}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Add form */}
        {showForm ? (
          <Card variant="elevated" className="space-y-4">
            <Field label={t('form.label')} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Ring size" />
            <Field label={t('form.value')} value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 7" />
            <div className="flex gap-2">
              <GoldButton onClick={submit} loading={add.isPending} size="sm">{t('add')}</GoldButton>
              <GoldButton variant="ghost" size="sm" onClick={() => setShowForm(false)}>{tc('cancel')}</GoldButton>
            </div>
          </Card>
        ) : (
          <GoldButton
            variant="ghost"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} /> {t('add')}
          </GoldButton>
        )}
      </div>
    </RouteGuard>
  );
}
