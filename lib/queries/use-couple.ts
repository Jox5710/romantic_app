'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useCouple(coupleId: string | null) {
  return useQuery({
    queryKey: ['couple', coupleId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('couples')
        .select('id, name_a, name_b, name_a_ar, name_b_ar, wedding_date, invite_email, state, created_at')
        .eq('id', coupleId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!coupleId,
    staleTime: 30 * 60 * 1000,
  });
}
