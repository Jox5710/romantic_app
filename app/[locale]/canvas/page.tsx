'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GoldButton } from '@/components/ui/gold-button';
import { PenLine, Trash2 } from 'lucide-react';
import { useTutorial } from '@/components/tutorial/use-tutorial';
import { useToast } from '@/components/ui/toast';

interface Stroke {
  id: string;
  author_id: string;
  points: number[];
  color: string;
  width: number;
  created_at: string;
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const currentPoints = useRef<number[]>([]);
  const [color, setColor] = useState('#c9a961');

  // Draw all strokes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (stroke.points.length < 4) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0], stroke.points[1]);
      for (let i = 2; i < stroke.points.length; i += 2) {
        ctx.lineTo(stroke.points[i], stroke.points[i + 1]);
      }
      ctx.stroke();
    });
  }, [strokes]);

  const saveStroke = useMutation({
    mutationFn: async (points: number[]) => {
      if (!coupleId || !session) return;
      await supabase.from('canvas_strokes').insert({
        couple_id: coupleId,
        author_id: session.user.id,
        points,
        color,
        width: 3,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['canvas', coupleId] }),
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

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    // The canvas internal bitmap stays at 700×500 but CSS rescales it to fit
    // the container. Scale pointer coords back into bitmap space so strokes
    // line up under your finger on any viewport (mobile, tablet, desktop).
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return [(cx - rect.left) * scaleX, (cy - rect.top) * scaleY];
  }

  function onStart(e: React.MouseEvent | React.TouchEvent) {
    drawing.current = true;
    const [x, y] = getPos(e);
    currentPoints.current = [x, y];
  }

  function onMove(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return;
    const [x, y] = getPos(e);
    currentPoints.current.push(x, y);

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pts = currentPoints.current;
    if (pts.length >= 4) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.moveTo(pts[pts.length - 4], pts[pts.length - 3]);
      ctx.lineTo(pts[pts.length - 2], pts[pts.length - 1]);
      ctx.stroke();
    }
  }

  function onEnd() {
    if (!drawing.current) return;
    drawing.current = false;
    if (currentPoints.current.length >= 4) {
      saveStroke.mutate([...currentPoints.current]);
    }
    currentPoints.current = [];
  }

  const COLORS = ['#c9a961', '#e8d5a0', '#f8f4e8', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6'];

  return (
    <RouteGuard>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PenLine size={24} className="text-gold" />
            <h1 className="font-display-en text-2xl sm:text-3xl text-ivory">{t('title')}</h1>
          </div>
          <GoldButton
            variant="ghost"
            size="sm"
            onClick={() => clearCanvas.mutate()}
            loading={clearCanvas.isPending}
            className="flex items-center gap-1.5"
          >
            <Trash2 size={13} /> {t('clear')}
          </GoldButton>
        </div>

        {/* Color picker */}
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={['w-7 h-7 rounded-full transition-transform', color === c ? 'scale-125 ring-2 ring-white/40' : ''].join(' ')}
              aria-label={c}
            />
          ))}
        </div>

        {/* Canvas */}
        <div className="rounded-2xl overflow-hidden border border-line bg-surface2">
          <canvas
            ref={canvasRef}
            width={700}
            height={500}
            className="w-full max-h-[60vh] sm:max-h-none object-contain touch-none cursor-crosshair"
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
