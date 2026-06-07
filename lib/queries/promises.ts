'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import type { PromiseCadence } from '@/lib/supabase/types';

export function usePromises(coupleId: string | null) {
  return useQuery({
    queryKey: ['promises', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('promises')
        .select('*')
        .eq('couple_id', coupleId)
        .eq('active', true)
        .order('created_at');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!coupleId,
    staleTime: 15 * 60 * 1000,
  });
}

export function useAddPromise() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (values: { couple_id: string; author_id: string; text: string; cadence: PromiseCadence }) => {
      const supabase = createClient();
      const { error } = await supabase.from('promises').insert({ ...values, kept_count: 0, broken_count: 0, active: true });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promises'] }),
    onError: (e: Error) => toast(e.message),
  });
}

export function useCheckPromise() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ promise_id, kept, currentKept, currentBroken }: { promise_id: string; kept: boolean; currentKept: number; currentBroken: number }) => {
      const supabase = createClient();
      await Promise.all([
        supabase.from('promise_checks').insert({ promise_id, kept }),
        supabase.from('promises').update({
          kept_count: kept ? currentKept + 1 : currentKept,
          broken_count: kept ? currentBroken : currentBroken + 1,
        }).eq('id', promise_id),
      ]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promises'] }),
    onError: (e: Error) => toast(e.message),
  });
}
