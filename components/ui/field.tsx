import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react';

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
}

type InputProps = FieldProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { textarea: true };

const inputClass =
  'w-full bg-surface2 border border-line rounded-xl px-4 py-3 text-ivory placeholder:text-muted focus:outline-none focus:border-gold transition-colors text-sm';

export const Field = forwardRef<HTMLInputElement, InputProps>(function Field(
  { label, error, hint, className = '', ...rest },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-ivoryDim uppercase tracking-wider">
          {label}
        </label>
      )}
      <input ref={ref} className={[inputClass, error ? 'border-red-500' : '', className].join(' ')} {...rest} />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
});

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaProps>(function TextareaField(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { label, error, hint, textarea, className = '', ...rest },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-ivoryDim uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={4}
        className={[inputClass, error ? 'border-red-500' : '', 'resize-none', className].join(' ')}
        {...rest}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
});
