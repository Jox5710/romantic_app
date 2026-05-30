'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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

const CoupleStateContext = createContext<CoupleStateResult | null>(null);

/**
 * Single source of truth for auth/couple state. Mounted once near the root, it
 * opens ONE `onAuthStateChange` subscription and runs the member/admin queries
 * once per auth change — instead of every component (RouteGuard ×27, UserMenu,
 * dashboard, …) doing its own. This removes the per-navigation loading flash,
 * the cascading re-renders, and the sign-out redirect races.
 */
export function CoupleStateProvider({ children }: { children: React.ReactNode }) {
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

  return (
    <CoupleStateContext.Provider value={{ session, isAdmin, coupleState, coupleId, loading }}>
      {children}
    </CoupleStateContext.Provider>
  );
}

export function useCoupleState(): CoupleStateResult {
  const ctx = useContext(CoupleStateContext);
  if (!ctx) {
    throw new Error('useCoupleState must be used within a CoupleStateProvider');
  }
  return ctx;
}
