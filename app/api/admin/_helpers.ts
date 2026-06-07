import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

type AdminCheckOk = { ok: true; userId: string };
type AdminCheckFail = { ok: false; response: NextResponse };

export async function requireAdmin(): Promise<AdminCheckOk | AdminCheckFail> {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  }

  const { data: adminRow } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminRow) {
    return { ok: false, response: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  }

  return { ok: true, userId: user.id };
}

export function jsonOk<T>(body: T) {
  return NextResponse.json(body);
}

export function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}
