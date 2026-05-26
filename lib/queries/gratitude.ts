'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { format } from 'date-fns';

export function useGratitudes(coupleId: string | null) {
  return useQuery({
    queryKey: ['gratitudes', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('gratitudes')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!coupleId,
  });
}

export function useAddGratitude() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: { couple_id: string; user_id: string; for_text: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from('gratitudes').insert({
        ...values,
        for_date: format(new Date(), 'yyyy-MM-dd'),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gratitudes'] }),
    onError: (e: Error) => toast(e.message),
  });
}
