'use client';

import { useEffect, useRef } from 'react';

// Trimmed from 80 → 34: far fewer animated DOM nodes keeps low-end phones smooth
// with no perceptible loss in the ambient star field.
const STAR_COUNT = 34;

export function AmbientStars() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';

    for (let i = 0; i < STAR_COUNT; i++) {
      const star = document.createElement('span');
      const size = Math.random() * 2 + 1;
      star.style.cssText = [
        `position:absolute`,
        `width:${size}px`,
        `height:${size}px`,
        `border-radius:50%`,
        `background:var(--gold)`,
        `opacity:${Math.random() * 0.5 + 0.1}`,
        `top:${Math.random() * 100}%`,
        `left:${Math.random() * 100}%`,
        `animation:twinkle ${2 + Math.random() * 4}s ease-in-out ${Math.random() * 4}s infinite alternate`,
      ].join(';');
      el.appendChild(star);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden motion-reduce:hidden"
    />
  );
}
