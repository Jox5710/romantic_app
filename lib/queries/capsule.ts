'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';

export function useCapsuleLetters(coupleId: string | null) {
  return useQuery({
    queryKey: ['capsule', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const supabase = createClient();
      // Returns all of the couple's letters — sealed and unlocked. RLS scopes
      // them to the caller's couple; the UI gates decryption on unlock_at.
      const { data, error } = await supabase
        .from('capsule_letters')
        .select('*')
        .eq('couple_id', coupleId)
        .order('unlock_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!coupleId,
  });
}

export function useAddCapsuleLetter() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: {
      couple_id: string;
      author_id: string;
      recipient: 'partner' | 'both' | 'future_us';
      ciphertext: string;
      nonce: string;
      unlock_at: string;
    }) => {
      const supabase = createClient();
      const { error } = await supabase.from('capsule_letters').insert(values);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['capsule'] }),
    onError: (e: Error) => toast(e.message),
  });
}
