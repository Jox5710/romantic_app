'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Mic, Play, Pause } from 'lucide-react';
import { useTutorial } from '@/components/tutorial/use-tutorial';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/toast';

interface VoiceNote {
  id: string;
  author_id: string;
  storage_path: string;
  duration_sec: number;
  played_at: string | null;
  created_at: string;
}

function useVoiceNotes(coupleId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['voices', coupleId],
    enabled: !!coupleId,
    queryFn: async () => {
      const { data } = await supabase
        .from('voice_notes')
        .select('*')
        .eq('couple_id', coupleId!)
        .order('created_at', { ascending: false });
      return (data ?? []) as VoiceNote[];
    },
  });
}

function WaveformBar({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-0.5 h-8">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          style={{ height: `${30 + Math.sin(i * 0.8) * 50}%` }}
          className={['w-1 rounded-full transition-colors', active ? 'bg-gold' : 'bg-muted/40'].join(' ')}
        />
      ))}
    </div>
  );
}

function NoteCard({ note, isMe }: { note: VoiceNote; isMe: boolean }) {
  const supabase = createClient();
  const t = useTranslations('voices');
  const tc = useTranslations('common');
  const { toast } = useToast();
  const [playing, setPlaying] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function play() {
    if (!url) {
      const { data, error } = await supabase.storage.from('voice-notes').createSignedUrl(note.storage_path, 300);
      if (error || !data?.signedUrl) {
        toast(tc('error'), 'error');
        return;
      }
      setUrl(data.signedUrl);
      const audio = new Audio(data.signedUrl);
      audioRef.current = audio;
      audio.play();
      setPlaying(true);
      audio.onended = () => setPlaying(false);
    } else if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.play();
        setPlaying(true);
      }
    }
  }

  return (
    <Card variant="elevated" className={['space-y-3', note.played_at || isMe ? '' : 'border-gold/30'].join(' ')}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={play}
          className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center hover:bg-gold/20 transition-colors"
          aria-label={playing ? t('pause') : t('play')}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <div className="flex-1">
          <WaveformBar active={playing} />
        </div>
        <p className="text-xs text-muted tabular-nums">{note.duration_sec}s</p>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">{format(new Date(note.created_at), 'PPp')}</p>
        {!isMe && !note.played_at && (
          <span className="text-xs text-gold">{t('newBadge')}</span>
        )}
        {isMe && <span className="text-xs text-muted/60">{t('you')}</span>}
      </div>
    </Card>
  );
}

export default function VoicesPage() {
  const t = useTranslations('voices');
  const tc = useTranslations('common');
  const { toast } = useToast();

  useTutorial('voices', [
    { id: 'voices-title', titleKey: 'voices.step1.title', descKey: 'voices.step1.desc' },
    { id: 'voices-record', titleKey: 'voices.step2.title', descKey: 'voices.step2.desc' },
    { id: 'voices-list', titleKey: 'voices.step3.title', descKey: 'voices.step3.desc' },
  ]);
  const { session, coupleId } = useCoupleState();
  const { data: notes = [] } = useVoiceNotes(coupleId);
  const qc = useQueryClient();
  const supabase = createClient();

  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    setSupported(!!navigator.mediaDevices?.getUserMedia);
  }, []);

  // Live updates: when either partner adds a note, refetch (realtime is now
  // enabled on voice_notes). Without this the partner's note never appears
  // until a manual reload.
  useEffect(() => {
    if (!coupleId) return;
    const ch = supabase
      .channel(`voices-${coupleId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'voice_notes', filter: `couple_id=eq.${coupleId}` }, () => {
        qc.invalidateQueries({ queryKey: ['voices', coupleId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [coupleId, qc, supabase]);

  const saveNote = useMutation({
    mutationFn: async ({ blob, duration }: { blob: Blob; duration: number }) => {
      if (!coupleId || !session) return;
      const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm';
      const path = `${coupleId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('voice-notes')
        .upload(path, blob, { contentType: blob.type || 'audio/webm' });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from('voice_notes').insert({
        couple_id: coupleId,
        author_id: session.user.id,
        storage_path: path,
        duration_sec: Math.max(1, Math.round(duration)),
      });
      if (insErr) throw insErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voices', coupleId] }),
    onError: () => toast(tc('error'), 'error'),
  });

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      startTimeRef.current = new Date();
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.start();
      setRecording(true);
    } catch {
      toast(tc('error'), 'error');
    }
  }

  function stopRecording() {
    if (!mediaRef.current || !startTimeRef.current) return;
    const duration = (Date.now() - startTimeRef.current.getTime()) / 1000;
    const mr = mediaRef.current;
    const mime = mr.mimeType || 'audio/webm';
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      // Ignore accidental ultra-short taps that produce an empty/garbage clip.
      if (duration >= 0.4 && blob.size > 0) saveNote.mutate({ blob, duration });
      mr.stream.getTracks().forEach((tr) => tr.stop());
    };
    mr.stop();
    mediaRef.current = null;
    setRecording(false);
  }

  // Tap-to-toggle: a single click starts, the next stops. Far more reliable
  // than press-and-hold, which on mobile fires touch + synthetic-mouse events
  // together and double-triggered start/stop (the "voices not working" bug).
  function toggleRecording() {
    if (recording) stopRecording();
    else startRecording();
  }

  return (
    <RouteGuard>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Mic size={28} className="text-gold" />
          <div>
            <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
            <p className="text-ivoryDim text-sm mt-0.5">{t('subtitle')}</p>
          </div>
        </div>

        {/* Record button */}
        {supported ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <button
              type="button"
              onClick={toggleRecording}
              disabled={saveNote.isPending}
              className={[
                'w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 select-none disabled:opacity-50',
                recording
                  ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/30 animate-pulse'
                  : 'bg-gold/10 border-2 border-gold text-gold hover:bg-gold/20',
              ].join(' ')}
              aria-label={recording ? t('recording') : t('record')}
            >
              <Mic size={32} className={recording ? 'text-white' : 'text-gold'} />
            </button>
            <p className="text-xs text-muted text-center">
              {saveNote.isPending ? t('uploading') : recording ? `${t('recording')} — ${t('tapToStop')}` : t('tapToRecord')}
            </p>
          </div>
        ) : (
          <p className="text-muted text-sm text-center">{t('unsupported')}</p>
        )}

        {/* Notes list */}
        {notes.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Mic size={40} className="mx-auto text-muted/30" />
            <p className="text-muted text-sm">{t('empty.body')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isMe={note.author_id === session?.user.id}
              />
            ))}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
