'use client';

import { useEffect, useRef } from 'react';

// Three depth layers — each gets its own parallax float animation and subtly
// different size/opacity ranges so they read as near/mid/far. Total DOM nodes
// stays low (was 34 → 36 across three layers) for mobile perf.
const LAYERS: Array<{
  count: number;
  minSize: number;
  maxSize: number;
  minOpacity: number;
  maxOpacity: number;
  animation: string;
}> = [
  // Far stars — tiny, faint, slow drift
  { count: 16, minSize: 0.8, maxSize: 1.4, minOpacity: 0.08, maxOpacity: 0.35, animation: 'starFloat1 60s ease-in-out infinite alternate' },
  // Mid stars — medium, moderate
  { count: 12, minSize: 1.4, maxSize: 2.2, minOpacity: 0.15, maxOpacity: 0.55, animation: 'starFloat2 45s ease-in-out infinite alternate' },
  // Near stars — larger, brighter, drift faster
  { count:  8, minSize: 2.0, maxSize: 3.4, minOpacity: 0.20, maxOpacity: 0.75, animation: 'starFloat3 30s ease-in-out infinite alternate' },
];

export function AmbientStars() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';

    LAYERS.forEach((layer) => {
      // Each layer gets its own wrapper div so we can apply the float animation
      // to the whole layer without fighting per-star twinkle transforms.
      const wrapper = document.createElement('div');
      wrapper.style.cssText = [
        'position:absolute',
        'inset:0',
        `animation:${layer.animation}`,
        'will-change:transform',
      ].join(';');

      for (let i = 0; i < layer.count; i++) {
        const star = document.createElement('span');
        const size    = layer.minSize + Math.random() * (layer.maxSize - layer.minSize);
        const opacity = layer.minOpacity + Math.random() * (layer.maxOpacity - layer.minOpacity);
        // Twinkle amplitude varies around the base opacity
        const lo = Math.max(0.04, opacity * 0.55).toFixed(3);
        const hi = Math.min(1,    opacity * 1.45).toFixed(3);
        star.style.cssText = [
          'position:absolute',
          `width:${size}px`,
          `height:${size}px`,
          'border-radius:50%',
          'background:var(--gold)',
          `opacity:${opacity}`,
          `top:${Math.random() * 100}%`,
          `left:${Math.random() * 100}%`,
          `--star-lo:${lo}`,
          `--star-hi:${hi}`,
          `animation:twinkle ${2 + Math.random() * 5}s ease-in-out ${Math.random() * 6}s infinite alternate`,
        ].join(';');
        wrapper.appendChild(star);
      }

      el.appendChild(wrapper);
    });
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-[2] overflow-hidden motion-reduce:hidden"
    />
  );
}
