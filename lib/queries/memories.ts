'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { notifyPartner } from '@/lib/push';

export function useMemories(coupleId: string | null) {
  return useQuery({
    queryKey: ['memories', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('memories')
        .select('*, places(name, lat, lng, kind)')
        .eq('couple_id', coupleId)
        .order('occurred_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!coupleId,
    staleTime: 15 * 60 * 1000,
  });
}

export function useAddMemory() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: {
      couple_id: string;
      created_by: string;
      occurred_at: string;
      caption: string;
      body?: string;
      image_url?: string;
      place_id?: string;
    }) => {
      const supabase = createClient();
      const { error } = await supabase.from('memories').insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memories'] });
      notifyPartner('memory');
    },
    onError: (e: Error) => toast(e.message),
  });
}

export function useDeleteMemory() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('memories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['memories'] }),
    onError: (e: Error) => toast(e.message),
  });
}
