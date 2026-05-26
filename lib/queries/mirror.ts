'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { startOfWeek, format } from 'date-fns';

export function useCurrentMirrorSession(coupleId: string | null) {
  return useQuery({
    queryKey: ['mirror-session', coupleId],
    queryFn: async () => {
      if (!coupleId) return null;
      const supabase = createClient();
      const weekOf = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

      const { data: existing } = await supabase
        .from('mirror_sessions')
        .select('*, mirror_questions(*), mirror_answers(*)')
        .eq('couple_id', coupleId)
        .eq('week_of', weekOf)
        .maybeSingle();

      if (existing) return existing;

      const { data: questions } = await supabase.from('mirror_questions').select('id');
      if (!questions?.length) return null;

      const seed = parseInt(weekOf.replace(/-/g, ''), 10);
      const q = questions[seed % questions.length];

      const { data: newSession } = await supabase
        .from('mirror_sessions')
        .insert({ couple_id: coupleId, question_id: q.id, week_of: weekOf })
        .select('*, mirror_questions(*), mirror_answers(*)')
        .single();

      return newSession;
    },
    enabled: !!coupleId,
  });
}

export function usePastMirrorSessions(coupleId: string | null) {
  return useQuery({
    queryKey: ['mirror-past', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const supabase = createClient();
      const weekOf = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('mirror_sessions')
        .select('*, mirror_questions(*), mirror_answers(*)')
        .eq('couple_id', coupleId)
        .lt('week_of', weekOf)
        .order('week_of', { ascending: false });
      return data ?? [];
    },
    enabled: !!coupleId,
  });
}

export function useSubmitMirrorAnswer() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (values: { session_id: string; user_id: string; answer: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from('mirror_answers').insert(values);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mirror-session'] }),
    onError: (e: Error) => toast(e.message),
  });
}
