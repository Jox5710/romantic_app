'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { startOfDay, endOfDay } from 'date-fns';

export function useTodayHeartbeats(coupleId: string | null) {
  return useQuery({
    queryKey: ['heartbeats', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('heartbeats')
        .select('*')
        .eq('couple_id', coupleId)
        .gte('sent_at', startOfDay(new Date()).toISOString())
        .lte('sent_at', endOfDay(new Date()).toISOString())
        .order('sent_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!coupleId,
    // Realtime is unavailable in this deployment, so poll to keep the You/Partner
    // counts live. Pauses automatically while the tab is hidden.
    refetchInterval: 6000,
    refetchIntervalInBackground: false,
  });
}

export function useSendHeartbeat() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: { couple_id: string; from_user: string; to_user: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from('heartbeats').insert(values);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['heartbeats'] }),
    onError: (e: Error) => toast(e.message),
  });
}
