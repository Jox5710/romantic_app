'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GoldButton } from '@/components/ui/gold-button';
import { PenLine, Trash2, Undo2, Eraser } from 'lucide-react';
import { useTutorial } from '@/components/tutorial/use-tutorial';
import { useToast } from '@/components/ui/toast';
import { notifyPartner } from '@/lib/push';

interface Stroke {
  id: string;
  author_id: string;
  points: number[];
  color: string;
  width: number;
  created_at: string;
}

// Logical space the OLD data was stored in (absolute 700×500). Any stroke whose
// coordinates exceed this small threshold is legacy and gets normalized on load;
// new strokes are stored normalized in 0..1 so they stay correct on every device.
const LEGACY_W = 700;
const LEGACY_H = 500;
const ERASE = 'erase'; // sentinel color → destination-out compositing

function normalizePoints(s: Stroke): number[] {
  const isLegacy = s.points.some((v) => v > 1.5);
  if (!isLegacy) return s.points;
  return s.points.map((v, i) => (i % 2 === 0 ? v / LEGACY_W : v / LEGACY_H));
}

function useStrokes(coupleId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['canvas', coupleId],
    enabled: !!coupleId,
    queryFn: async () => {
      const { data } = await supabase
        .from('canvas_strokes')
        .select('*')
        .eq('couple_id', coupleId!)
        .order('created_at');
      return (data ?? []) as Stroke[];
    },
  });
}

export default function CanvasPage() {
  const t = useTranslations('canvas');
  const tc = useTranslations('common');
  const { toast } = useToast();

  useTutorial('canvas', [
    { id: 'canvas-title', titleKey: 'canvas.step1.title', descKey: 'canvas.step1.desc' },
    { id: 'canvas-colors', titleKey: 'canvas.step2.title', descKey: 'canvas.step2.desc' },
    { id: 'canvas-draw', titleKey: 'canvas.step3.title', descKey: 'canvas.step3.desc' },
  ]);
  const { session, coupleId } = useCoupleState();
  const { data: strokes = [] } = useStrokes(coupleId);
  const qc = useQueryClient();
  const supabase = createClient();

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const currentPoints = useRef<number[]>([]); // normalized 0..1, flat [x,y,...]
  const [color, setColor] = useState('#c9a961');
  const [erasing, setErasing] = useState(false);
  const [brush, setBrush] = useState(3); // logical px

  // Draw one stroke into the 2D context. `points` are normalized 0..1; scale to
  // the live bitmap so everything lines up regardless of viewport/DPR.
  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, pts: number[], strokeColor: string, w: number) => {
    if (pts.length < 4) return;
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.globalCompositeOperation = strokeColor === ERASE ? 'destination-out' : 'source-over';
    ctx.strokeStyle = strokeColor === ERASE ? 'rgba(0,0,0,1)' : strokeColor;
    ctx.lineWidth = w * dpr;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0] * W, pts[1] * H);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i] * W, pts[i + 1] * H);
    ctx.stroke();
    ctx.restore();
  }, []);

  // Full redraw of all persisted strokes.
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach((s) => drawStroke(ctx, normalizePoints(s), s.color, s.width));
  }, [strokes, drawStroke]);

  // Keep the bitmap sized to the displayed box × DPR so strokes are crisp and the
  // pointer math (normalized) maps 1:1. This is the core fix for the touch shift:
  // no more object-contain letterbox / fixed 700×500 aspect mismatch.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(wrap.clientWidth * dpr);
      const h = Math.round(wrap.clientHeight * dpr);
      if (w === 0 || h === 0) return;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      redraw();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [redraw]);

  useEffect(() => { redraw(); }, [redraw]);

  // Live realtime: a partner's strokes (and clears) appear instantly. Previously
  // missing — strokes only showed up on remount/refetch.
  useEffect(() => {
    if (!coupleId) return;
    const channel = supabase
      .channel(`canvas:${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'canvas_strokes', filter: `couple_id=eq.${coupleId}` },
        () => qc.invalidateQueries({ queryKey: ['canvas', coupleId] }),
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [coupleId, supabase, qc]);

  const saveStroke = useMutation({
    mutationFn: async (points: number[]) => {
      if (!coupleId || !session) return;
      await supabase.from('canvas_strokes').insert({
        couple_id: coupleId,
        author_id: session.user.id,
        points,
        color: erasing ? ERASE : color,
        width: brush,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canvas', coupleId] });
      if (!erasing) notifyPartner('canvas');
    },
    onError: () => toast(tc('error'), 'error'),
  });

  const clearCanvas = useMutation({
    mutationFn: async () => {
      if (!coupleId) return;
      await supabase.from('canvas_strokes').delete().eq('couple_id', coupleId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['canvas', coupleId] }),
    onError: () => toast(tc('error'), 'error'),
  });

  // Undo = remove MY most recent stroke (never the partner's).
  const undo = useMutation({
    mutationFn: async () => {
      if (!coupleId || !session) return;
      const mine = strokes.filter((s) => s.author_id === session.user.id);
      const last = mine[mine.length - 1];
      if (!last) return;
      await supabase.from('canvas_strokes').delete().eq('id', last.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['canvas', coupleId] }),
    onError: () => toast(tc('error'), 'error'),
  });

  // Normalized pointer position (0..1) — viewport-relative, so page scroll and
  // native WebView insets are handled automatically by getBoundingClientRect.
  function getPos(e: React.MouseEvent | React.TouchEvent): [number, number] {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (cx - rect.left) / rect.width;
    const y = (cy - rect.top) / rect.height;
    return [Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y))];
  }

  function onStart(e: React.MouseEvent | React.TouchEvent) {
    if ('touches' in e) e.preventDefault();
    drawing.current = true;
    const [x, y] = getPos(e);
    currentPoints.current = [x, y];
  }

  function onMove(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return;
    if ('touches' in e) e.preventDefault();
    const [x, y] = getPos(e);
    const pts = currentPoints.current;
    pts.push(x, y);
    if (pts.length >= 4) {
      const ctx = canvasRef.current!.getContext('2d')!;
      drawStroke(ctx, [pts[pts.length - 4], pts[pts.length - 3], pts[pts.length - 2], pts[pts.length - 1]], erasing ? ERASE : color, brush);
    }
  }

  function onEnd() {
    if (!drawing.current) return;
    drawing.current = false;
    if (currentPoints.current.length >= 4) saveStroke.mutate([...currentPoints.current]);
    currentPoints.current = [];
  }

  const COLORS = ['#c9a961', '#e8d5a0', '#f8f4e8', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6'];
  const BRUSHES = [2, 4, 8];

  return (
    <RouteGuard>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PenLine size={24} className="text-gold" />
            <h1 className="font-display-en text-2xl sm:text-3xl text-ivory">{t('title')}</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <GoldButton variant="ghost" size="sm" onClick={() => undo.mutate()} loading={undo.isPending} className="flex items-center gap-1.5">
              <Undo2 size={13} /> {t('undo')}
            </GoldButton>
            <GoldButton variant="ghost" size="sm" onClick={() => clearCanvas.mutate()} loading={clearCanvas.isPending} className="flex items-center gap-1.5">
              <Trash2 size={13} /> {t('clear')}
            </GoldButton>
          </div>
        </div>

        {/* Tools */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Colors */}
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setColor(c); setErasing(false); }}
                style={{ backgroundColor: c }}
                className={['w-7 h-7 rounded-full transition-transform', !erasing && color === c ? 'scale-125 ring-2 ring-white/40' : ''].join(' ')}
                aria-label={c}
              />
            ))}
          </div>
          <div className="w-px h-6 bg-line" />
          {/* Brush sizes */}
          <div className="flex items-center gap-2">
            {BRUSHES.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBrush(b)}
                aria-label={`brush-${b}`}
                className={['flex items-center justify-center w-7 h-7 rounded-full border transition-colors', brush === b ? 'border-gold bg-gold/10' : 'border-line'].join(' ')}
              >
                <span className="rounded-full bg-ivory" style={{ width: b + 2, height: b + 2 }} />
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-line" />
          {/* Eraser */}
          <button
            type="button"
            onClick={() => setErasing((v) => !v)}
            aria-label={t('eraser')}
            className={['flex items-center gap-1.5 px-3 h-7 rounded-full border text-xs transition-colors', erasing ? 'border-gold bg-gold/10 text-gold' : 'border-line text-muted'].join(' ')}
          >
            <Eraser size={13} /> {t('eraser')}
          </button>
        </div>

        {/* Canvas */}
        <div ref={wrapRef} className="rounded-2xl overflow-hidden border border-line bg-surface2 w-full h-[calc(100dvh-12rem)] sm:h-[calc(100dvh-10rem)]">
          <canvas
            ref={canvasRef}
            className="w-full h-full touch-none cursor-crosshair block"
            onMouseDown={onStart}
            onMouseMove={onMove}
            onMouseUp={onEnd}
            onMouseLeave={onEnd}
            onTouchStart={onStart}
            onTouchMove={onMove}
            onTouchEnd={onEnd}
          />
        </div>

        <p className="text-xs text-muted text-center">{t('subtitle')}</p>
      </div>
    </RouteGuard>
  );
}
