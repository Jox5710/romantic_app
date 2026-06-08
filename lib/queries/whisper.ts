'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { notifyPartner } from '@/lib/push';
import { addMinutes } from 'date-fns';
import type { WhisperFeeling, WhisperResponse } from '@/lib/supabase/types';

export function useWhispers(coupleId: string | null) {
  return useQuery({
    queryKey: ['whispers', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('whispers')
        .select('*')
        .eq('couple_id', coupleId)
        .order('sent_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!coupleId,
  });
}

export function useSentTodayWhisper(userId: string | null) {
  return useQuery({
    queryKey: ['whisper-today', userId],
    queryFn: async () => {
      if (!userId) return null;
      const supabase = createClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('whispers')
        .select('id, sent_at')
        .eq('author_id', userId)
        .gte('sent_at', today.toISOString())
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });
}

export function useSendWhisper() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: {
      couple_id: string;
      author_id: string;
      recipient_id: string;
      body_what: string;
      feeling: WhisperFeeling;
      body_wish: string;
    }) => {
      const supabase = createClient();
      const now = new Date();
      const { error } = await supabase.from('whispers').insert({
        ...values,
        sent_at: now.toISOString(),
        deliver_at: addMinutes(now, 30).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whispers'] });
      qc.invalidateQueries({ queryKey: ['whisper-today'] });
      notifyPartner('whisper');
    },
    onError: (e: Error) => toast(e.message),
  });
}

export function useRespondToWhisper() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: {
      id: string;
      response: WhisperResponse;
      response_text?: string;
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('whispers')
        .update({ response: values.response, response_text: values.response_text, read_at: new Date().toISOString() })
        .eq('id', values.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['whispers'] }),
    onError: (e: Error) => toast(e.message),
  });
}
