'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CoupleState } from '@/lib/supabase/types';
import type { Session } from '@supabase/supabase-js';

interface CoupleStateResult {
  session: Session | null;
  isAdmin: boolean;
  coupleState: CoupleState | null;
  coupleId: string | null;
  loading: boolean;
}

export function useCoupleState(): CoupleStateResult {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [coupleState, setCoupleState] = useState<CoupleState | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load(s: Session | null) {
      if (!s) {
        setSession(null);
        setIsAdmin(false);
        setCoupleState(null);
        setCoupleId(null);
        setLoading(false);
        return;
      }

      setSession(s);

      const [memberRes, adminRes] = await Promise.all([
        supabase
          .from('couple_members')
          .select('couple_id, couples(state)')
          .eq('user_id', s.user.id)
          .maybeSingle(),
        supabase
          .from('admins')
          .select('user_id')
          .eq('user_id', s.user.id)
          .maybeSingle(),
      ]);

      setIsAdmin(!!adminRes.data);

      if (memberRes.data) {
        setCoupleId(memberRes.data.couple_id);
        const couple = memberRes.data.couples as { state: CoupleState } | null;
        setCoupleState(couple?.state ?? null);
      } else {
        setCoupleId(null);
        setCoupleState(null);
      }

      setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => load(data.session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      load(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, isAdmin, coupleState, coupleId, loading };
}
