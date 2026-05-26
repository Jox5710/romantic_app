import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const GoldButton = forwardRef<HTMLButtonElement, Props>(function GoldButton(
  { variant = 'primary', size = 'md', loading, children, className = '', disabled, ...rest },
  ref,
) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-gold text-bg shadow-gold hover:bg-goldBright active:scale-95',
    ghost:
      'border border-line text-gold hover:border-gold hover:bg-surface2 active:scale-95',
    danger:
      'bg-red-900/60 text-red-200 border border-red-800 hover:bg-red-900 active:scale-95',
  };

  const sizes = {
    sm: 'text-xs px-4 py-1.5',
    md: 'text-sm px-6 py-2.5',
    lg: 'text-base px-8 py-3',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[base, variants[variant], sizes[size], className].join(' ')}
      {...rest}
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : null}
      {children}
    </button>
  );
});
