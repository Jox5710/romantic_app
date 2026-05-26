'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useBucketItems, useAddBucketItem, useCompleteBucketItem, useReorderBucketItems } from '@/lib/queries/bucket';
import { GoldButton } from '@/components/ui/gold-button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { GoldSeal } from '@/components/ui/gold-seal';
import { ListChecks, Plus, GripVertical, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '@/components/tutorial/use-tutorial';

interface BucketItem {
  id: string;
  title: string;
  category: string | null;
  notes: string | null;
  position: number;
  completed_at: string | null;
}

function SortableItem({ item, onComplete }: { item: BucketItem; onComplete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const [sealed, setSealed] = useState(false);

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3">
      <button {...attributes} {...listeners} className="text-muted cursor-grab active:cursor-grabbing p-1 touch-none" aria-label="Drag to reorder">
        <GripVertical size={16} />
      </button>
      <Card variant="elevated" className="flex-1 flex items-center gap-3">
        <button
          type="button"
          onClick={() => { setSealed(true); setTimeout(() => onComplete(item.id), 600); }}
          disabled={!!item.completed_at}
          aria-label="Mark done"
          className="w-6 h-6 rounded-full border-2 border-gold flex items-center justify-center hover:bg-gold/10 transition-colors disabled:opacity-30"
        >
          {item.completed_at && <Check size={12} className="text-gold" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={['text-sm', item.completed_at ? 'line-through text-muted' : 'text-ivory'].join(' ')}>
            {item.title}
          </p>
          {item.category && <p className="text-xs text-muted">{item.category}</p>}
        </div>
        <AnimatePresence>{sealed && <GoldSeal size={32} />}</AnimatePresence>
      </Card>
    </div>
  );
}

export default function BucketPage() {
  const t = useTranslations('bucket');

  useTutorial('bucket', [
    { id: 'bucket-title', titleKey: 'bucket.step1.title', descKey: 'bucket.step1.desc' },
    { id: 'bucket-add', titleKey: 'bucket.step2.title', descKey: 'bucket.step2.desc' },
    { id: 'bucket-list', titleKey: 'bucket.step3.title', descKey: 'bucket.step3.desc' },
    { id: 'bucket-done', titleKey: 'bucket.step4.title', descKey: 'bucket.step4.desc' },
  ]);
  const { coupleId } = useCoupleState();
  const { data: items, isLoading } = useBucketItems(coupleId);
  const add = useAddBucketItem();
  const complete = useCompleteBucketItem();
  const reorder = useReorderBucketItems();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');

  const active = items?.filter((i) => !i.completed_at) ?? [];
  const done = items?.filter((i) => i.completed_at) ?? [];

  async function addItem() {
    if (!coupleId || !title.trim()) return;
    await add.mutateAsync({ couple_id: coupleId, title, category: category || undefined, position: active.length });
    setTitle(''); setCategory(''); setShowForm(false);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active: a, over } = event;
    if (!over || a.id === over.id) return;
    const oldIndex = active.findIndex((i) => i.id === a.id);
    const newIndex = active.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(active, oldIndex, newIndex);
    reorder.mutate(reordered.map((item, pos) => ({ id: item.id, position: pos })));
  }

  return (
    <RouteGuard>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
            <p className="text-ivoryDim text-sm mt-1">{t('subtitle')}</p>
          </div>
          <GoldButton size="sm" onClick={() => setShowForm(true)}><Plus size={14} /> {t('add')}</GoldButton>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card variant="elevated" className="space-y-3">
                <Field label={t('form.title')} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
                <Field label={t('form.category')} placeholder="travel, experience, home…" value={category} onChange={(e) => setCategory(e.target.value)} />
                <div className="flex gap-2">
                  <GoldButton onClick={addItem} loading={add.isPending} disabled={!title.trim()}>Add</GoldButton>
                  <GoldButton variant="ghost" onClick={() => setShowForm(false)}>Cancel</GoldButton>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(n => <div key={n} className="h-14 rounded-2xl shimmer" />)}</div>
        ) : !items?.length ? (
          <div className="text-center py-16 space-y-3">
            <ListChecks size={32} className="mx-auto text-muted" />
            <p className="font-display-en text-2xl text-ivory">{t('empty.title')}</p>
            <p className="text-muted text-sm">{t('empty.body')}</p>
          </div>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={active.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {active.map((item) => (
                  <SortableItem key={item.id} item={item} onComplete={(id) => complete.mutate(id)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {done.length > 0 && (
          <div className="space-y-2 opacity-60">
            <p className="text-xs text-muted uppercase tracking-wider">{t('completed')}</p>
            {done.map((item) => (
              <Card key={item.id} className="flex items-center gap-3 py-3">
                <Check size={14} className="text-gold shrink-0" />
                <p className="text-sm line-through text-muted">{item.title}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
