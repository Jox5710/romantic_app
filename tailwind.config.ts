import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        gold: 'var(--gold)',
        goldBright: 'var(--gold-bright)',
        goldDeep: 'var(--gold-deep)',
        ivory: 'var(--ivory)',
        ivoryDim: 'var(--ivory-dim)',
        muted: 'var(--muted)',
        line: 'var(--line)',
      },
      fontFamily: {
        'display-en': ['var(--font-cormorant)', 'serif'],
        'display-ar': ['var(--font-aref-ruqaa)', 'serif'],
        'body-en': ['var(--font-manrope)', 'sans-serif'],
        'body-ar': ['var(--font-tajawal)', 'sans-serif'],
        hand: ['var(--font-caveat)', 'cursive'],
      },
      boxShadow: {
        pop: 'inset 0 1px 0 rgba(255,240,200,0.04), inset 0 -1px 0 rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)',
        popLg: 'inset 0 1px 0 rgba(255,240,200,0.05), inset 0 -1px 0 rgba(0,0,0,0.7), 0 20px 50px rgba(0,0,0,0.6)',
        gold: '0 8px 20px rgba(201,169,97,0.3), inset 0 1px 0 rgba(255,255,255,0.4)',
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        twinkle: 'twinkle 3s ease-in-out infinite alternate',
        'seal-stamp': 'seal-stamp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'heartbeat-pulse': 'heartbeat-pulse 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        twinkle: {
          '0%': { opacity: '0.3', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1.2)' },
        },
        'seal-stamp': {
          '0%': { transform: 'scale(0) rotate(-30deg)', opacity: '0' },
          '60%': { transform: 'scale(1.15) rotate(5deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'heartbeat-pulse': {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.25)' },
          '60%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
