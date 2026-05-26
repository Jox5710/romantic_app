'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { format } from 'date-fns';

function hashDate(dateStr: string, count: number): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return hash % count;
}

export function useTodayPrompt(locale: string) {
  return useQuery({
    queryKey: ['daily-prompt', locale],
    queryFn: async () => {
      const supabase = createClient();
      const { data: allPrompts } = await supabase.from('daily_prompts').select('*');
      if (!allPrompts || allPrompts.length === 0) return null;

      const today = format(new Date(), 'yyyy-MM-dd');
      const idx = hashDate(today, allPrompts.length);
      return { prompt: allPrompts[idx], today };
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useTodayAnswers(coupleId: string | null, promptId: string | null) {
  return useQuery({
    queryKey: ['prompt-answers', coupleId, promptId],
    queryFn: async () => {
      if (!coupleId || !promptId) return [];
      const supabase = createClient();
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('prompt_answers')
        .select('*')
        .eq('couple_id', coupleId)
        .eq('prompt_id', promptId)
        .eq('for_date', today);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!coupleId && !!promptId,
  });
}

export function useSubmitAnswer() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: {
      couple_id: string;
      prompt_id: string;
      user_id: string;
      answer: string;
      for_date: string;
    }) => {
      const supabase = createClient();
      const { error } = await supabase.from('prompt_answers').insert(values);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prompt-answers'] }),
    onError: (e: Error) => toast(e.message),
  });
}
