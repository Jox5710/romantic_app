'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';

export function useBucketItems(coupleId: string | null) {
  return useQuery({
    queryKey: ['bucket', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bucket_items')
        .select('*')
        .eq('couple_id', coupleId)
        .order('position');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!coupleId,
    staleTime: 15 * 60 * 1000,
  });
}

export function useAddBucketItem() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (values: { couple_id: string; title: string; category?: string; notes?: string; position: number }) => {
      const supabase = createClient();
      const { error } = await supabase.from('bucket_items').insert(values);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bucket'] }),
    onError: (e: Error) => toast(e.message),
  });
}

export function useCompleteBucketItem() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('bucket_items')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bucket'] }),
    onError: (e: Error) => toast(e.message),
  });
}

export function useReorderBucketItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Array<{ id: string; position: number }>) => {
      const supabase = createClient();
      await Promise.all(
        items.map(({ id, position }) =>
          supabase.from('bucket_items').update({ position }).eq('id', id),
        ),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bucket'] }),
  });
}
