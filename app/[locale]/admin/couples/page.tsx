'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { RouteGuard } from '@/components/route-guard';
import { Card } from '@/components/ui/card';
import { GoldButton } from '@/components/ui/gold-button';
import { Field } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { format } from 'date-fns';
import type { CoupleState } from '@/lib/supabase/types';

type FilterState = 'all' | CoupleState;

interface CoupleRow {
  id: string;
  state: CoupleState;
  name_a: string | null;
  name_b: string | null;
  wedding_date: string | null;
  created_at: string;
  invite_email: string | null;
  admin_note: string | null;
}

export default function CouplesQueuePage() {
  const t = useTranslations('admin.couples');
  const { toast } = useToast();
  const [couples, setCouples] = useState<CoupleRow[]>([]);
  const [filter, setFilter] = useState<FilterState>('pending_admin');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CoupleRow | null>(null);
  const [note, setNote] = useState('');
  const [blessing, setBlessing] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [showDecline, setShowDecline] = useState(false);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    let q = supabase
      .from('couples')
      .select('id,state,name_a,name_b,wedding_date,created_at,invite_email,admin_note')
      .order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('state', filter);
    const { data } = await q;
    setCouples((data ?? []) as CoupleRow[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function bless() {
    if (!selected) return;
    setBlessing(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('couples')
      .update({ state: 'approved', approved_at: new Date().toISOString(), approved_by: user?.id })
      .eq('id', selected.id);
    if (error) { toast(error.message); setBlessing(false); return; }
    toast('Couple blessed!', 'success');
    setSelected(null);
    load();
  }

  async function decline() {
    if (!selected) return;
    setDeclining(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('couples')
      .update({ state: 'rejected', admin_note: note })
      .eq('id', selected.id);
    if (error) { toast(error.message); setDeclining(false); return; }
    toast('Request declined', 'success');
    setSelected(null);
    setShowDecline(false);
    load();
  }

  const filters: Array<{ key: FilterState; label: string }> = [
    { key: 'all', label: t('filter.all') },
    { key: 'pending_admin', label: t('filter.pending') },
    { key: 'approved', label: t('filter.approved') },
    { key: 'rejected', label: t('filter.rejected') },
  ];

  return (
    <RouteGuard>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>

        <div className="flex gap-2 flex-wrap">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => { setFilter(key); setSelected(null); }}
              className={[
                'px-4 py-1.5 rounded-full text-sm transition-colors',
                filter === key ? 'bg-gold text-bg' : 'border border-line text-muted hover:text-ivory',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={selected ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}>
          <div className="space-y-3">
            {loading ? (
              [1, 2, 3].map((n) => <div key={n} className="h-24 rounded-2xl shimmer" />)
            ) : couples.length === 0 ? (
              <div className="text-center py-12 text-muted">No couples found.</div>
            ) : couples.map((c) => (
              <Card
                key={c.id}
                variant="elevated"
                className={[
                  'flex items-center justify-between gap-4 cursor-pointer transition-colors',
                  selected?.id === c.id ? 'border-gold/60' : 'hover:border-gold/20',
                ].join(' ')}
                onClick={() => { setSelected(c); setShowDecline(false); setNote(''); }}
              >
                <div className="space-y-0.5 flex-1">
                  <p className="text-ivory font-medium">
                    {c.name_a ?? '?'} &amp; {c.name_b ?? '(pending)'}
                  </p>
                  <p className="text-xs text-muted">
                    {format(new Date(c.created_at), 'PPP')} · {c.invite_email}
                  </p>
                  <span className={[
                    'inline-block text-xs px-2 py-0.5 rounded-full',
                    c.state === 'approved' ? 'bg-green-900/40 text-green-400' :
                    c.state === 'rejected' ? 'bg-red-900/40 text-red-400' :
                    'bg-gold/10 text-gold',
                  ].join(' ')}>
                    {c.state}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {selected && (
            <Card variant="elevated" className="space-y-4 self-start sticky top-20">
              <div className="flex items-start justify-between">
                <h2 className="font-display-en text-2xl text-ivory">
                  {selected.name_a ?? '?'} &amp; {selected.name_b ?? '(pending)'}
                </h2>
                <button type="button" onClick={() => setSelected(null)} className="text-muted hover:text-ivory">✕</button>
              </div>

              <div className="space-y-2 text-sm">
                <Row label="State" value={selected.state} />
                <Row label="Email" value={selected.invite_email ?? '—'} />
                {selected.wedding_date && (
                  <Row label="Wedding" value={format(new Date(selected.wedding_date), 'PPP')} />
                )}
                <Row label="Created" value={format(new Date(selected.created_at), 'PPPp')} />
                {selected.admin_note && <Row label="Note" value={selected.admin_note} />}
              </div>

              {selected.state === 'pending_admin' && (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <GoldButton onClick={bless} loading={blessing} size="sm">
                      {t('bless')} ✦
                    </GoldButton>
                    <GoldButton variant="danger" onClick={() => setShowDecline(!showDecline)} size="sm">
                      {t('decline')}
                    </GoldButton>
                  </div>
                  {showDecline && (
                    <div className="space-y-3">
                      <Field
                        label={t('note')}
                        placeholder="Reason…"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <GoldButton variant="danger" onClick={decline} loading={declining} size="sm">
                          {t('confirmDecline')}
                        </GoldButton>
                        <GoldButton variant="ghost" onClick={() => setShowDecline(false)} size="sm">
                          Cancel
                        </GoldButton>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-muted w-24 shrink-0">{label}</span>
      <span className="text-ivory">{value}</span>
    </div>
  );
}
