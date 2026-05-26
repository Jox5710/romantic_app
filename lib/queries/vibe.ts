'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';

export function useVibes(coupleId: string | null) {
  return useQuery({
    queryKey: ['vibes', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vibe_pings')
        .select('*')
        .eq('couple_id', coupleId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!coupleId,
  });
}

export function useUpsertVibe() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: {
      couple_id: string;
      user_id: string;
      mood: string;
      energy: number;
      craving: string;
    }) => {
      const supabase = createClient();
      const { error } = await supabase.from('vibe_pings').upsert(
        { ...values, updated_at: new Date().toISOString() },
        { onConflict: 'couple_id,user_id' },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vibes'] }),
    onError: (e: Error) => toast(e.message),
  });
}
