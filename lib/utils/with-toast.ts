/**
 * Tiny wrapper for Supabase mutations that surfaces failures via toast.
 * Pages typically call:
 *
 *   const result = await withErrorToast(
 *     supabase.from('promises').insert({...}),
 *     toast,
 *     t('error'),
 *   );
 *   if (!result) return;
 *
 * — one line, consistent UX. Returns the data on success, null on error.
 */
type ToastFn = (message: string, type?: 'success' | 'error') => void;

interface SupabaseResult<T> {
  data: T | null;
  error: { message: string } | null;
}

export async function withErrorToast<T>(
  promise: PromiseLike<SupabaseResult<T>>,
  toast: ToastFn,
  fallback: string,
): Promise<T | null> {
  const { data, error } = await promise;
  if (error) {
    toast(fallback, 'error');
    return null;
  }
  return data;
}
