import { type HTMLAttributes } from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated';
}

export function Card({ variant = 'default', className = '', children, ...rest }: Props) {
  const base = 'rounded-2xl border border-line bg-surface transition-colors';
  const variants = {
    default: 'p-5',
    elevated: 'p-5 shadow-pop',
  };

  return (
    <div className={[base, variants[variant], className].join(' ')} {...rest}>
      {children}
    </div>
  );
}
