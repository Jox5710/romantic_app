'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import type { PlaceKind } from '@/lib/supabase/types';

export function usePlaces(coupleId: string | null) {
  return useQuery({
    queryKey: ['places', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!coupleId,
    staleTime: 30 * 60 * 1000,
  });
}

export function useAddPlace() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (values: {
      couple_id: string;
      name: string;
      lat: number;
      lng: number;
      kind: PlaceKind;
      visited_at?: string;
      note?: string;
    }) => {
      const supabase = createClient();
      const { error } = await supabase.from('places').insert(values);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['places'] }),
    onError: (e: Error) => toast(e.message),
  });
}

export function useDeletePlace() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('places').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['places'] }),
    onError: (e: Error) => toast(e.message),
  });
}
