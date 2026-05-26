'use client';

import { useEffect, useState, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { GoldButton } from '@/components/ui/gold-button';
import { useToast } from '@/components/ui/toast';
import { useRouter } from '@/lib/i18n/navigation';
import { Heart } from 'lucide-react';

function AcceptInner() {
  const t = useTranslations('auth.accept');
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code') ?? '';

  const [couple, setCouple] = useState<{ id: string; name_a: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!code) { setLoading(false); return; }
    const supabase = createClient();
    supabase
      .from('couples')
      .select('id, name_a')
      .eq('invite_code', code.toUpperCase())
      .eq('state', 'invited')
      .maybeSingle()
      .then(({ data }: { data: { id: string; name_a: string | null } | null }) => {
        setCouple(data ?? null);
        setLoading(false);
      });
  }, [code]);

  async function accept() {
    if (!couple) return;
    setAccepting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: memberErr } = await supabase.from('couple_members').insert({
      user_id: user.id,
      couple_id: couple.id,
      role: 'partner',
      confirmed_at: new Date().toISOString(),
    });

    if (memberErr) {
      toast(memberErr.message);
      setAccepting(false);
      return;
    }

    const { error: coupleErr } = await supabase
      .from('couples')
      .update({ partner_id: user.id, state: 'mutual' })
      .eq('id', couple.id);

    if (coupleErr) {
      toast(coupleErr.message);
      setAccepting(false);
      return;
    }

    router.replace('/awaiting');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-gold shimmer" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center animate-fade-up">
        <Heart className="mx-auto text-gold" size={40} fill="currentColor" />

        {couple ? (
          <>
            <div className="space-y-2">
              <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
              {couple.name_a && (
                <p className="text-ivoryDim">
                  {couple.name_a} {t('subtitle')}
                </p>
              )}
            </div>
            <GoldButton onClick={accept} loading={accepting} size="lg" className="w-full">
              {t('accept')}
            </GoldButton>
          </>
        ) : (
          <div className="space-y-2">
            <h2 className="font-display-en text-2xl text-ivory">Invitation not found</h2>
            <p className="text-ivoryDim text-sm">
              This code may be invalid or already used.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-gold shimmer" />
      </div>
    }>
      <AcceptInner />
    </Suspense>
  );
}
