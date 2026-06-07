'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { RouteGuard } from '@/components/route-guard';
import { Card } from '@/components/ui/card';
import { GoldButton } from '@/components/ui/gold-button';
import { Field } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { format } from 'date-fns';
import { CheckCircle2, AlertCircle, Trash2, KeyRound } from 'lucide-react';
import type { AdminUserRow } from '@/lib/admin-types';

type Filter = 'all' | 'unconfirmed';

export default function UsersPage() {
  const t = useTranslations('admin.users');
  const tCouples = useTranslations('admin.couples');
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetValue, setResetValue] = useState('');
  const [resettingId, setResettingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    if (!res.ok) {
      toast(t('loadError'));
      setLoading(false);
      return;
    }
    setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function confirmEmail(userId: string) {
    setConfirmingId(userId);
    const res = await fetch('/api/admin/confirm-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) toast(t('confirmError'));
    else { toast(t('confirmed'), 'success'); load(); }
    setConfirmingId(null);
  }

  async function deleteUser(userId: string) {
    setDeletingId(userId);
    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast(body?.error ?? t('deleteError'));
    } else {
      toast(t('deleted'), 'success');
      load();
    }
    setDeletingId(null);
    setDeleteConfirm(null);
  }

  async function setPassword(userId: string) {
    if (resetValue.length < 6) { toast(t('passwordTooShort'), 'error'); return; }
    setResettingId(userId);
    const res = await fetch('/api/admin/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password: resetValue }),
    });
    if (!res.ok) toast(t('passwordError'), 'error');
    else { toast(t('passwordSet'), 'success'); setResetId(null); setResetValue(''); }
    setResettingId(null);
  }

  const unconfirmedCount = users.filter((u) => !u.email_confirmed_at).length;
  const displayed = filter === 'unconfirmed'
    ? users.filter((u) => !u.email_confirmed_at)
    : users;

  return (
    <RouteGuard>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        <div className="space-y-1">
          <h1 className="font-display-en text-2xl sm:text-4xl text-ivory">{t('title')}</h1>
          <p className="text-ivoryDim text-sm">{t('subtitle')}</p>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'unconfirmed'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={[
                'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-colors',
                filter === f ? 'bg-gold text-bg' : 'border border-line text-muted hover:text-ivory',
              ].join(' ')}
            >
              {t(`filter.${f}`)}
              {f === 'unconfirmed' && unconfirmedCount > 0 && (
                <span className={[
                  'text-xs px-1.5 py-0.5 rounded-full',
                  filter === f ? 'bg-bg/20 text-bg' : 'bg-gold/15 text-gold',
                ].join(' ')}>
                  {unconfirmedCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* User list */}
        <div className="space-y-2">
          {loading ? (
            [1, 2, 3, 4].map((n) => (
              <div key={n} className="h-16 rounded-2xl shimmer" />
            ))
          ) : displayed.length === 0 ? (
            <div className="text-center py-12 text-muted">
              {filter === 'unconfirmed' ? t('filter.unconfirmed') : t('loadError')}
            </div>
          ) : (
            displayed.map((user) => (
              <Card
                key={user.id}
                variant="elevated"
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  {/* Confirmation status icon */}
                  <div className="shrink-0">
                    {user.email_confirmed_at ? (
                      <CheckCircle2 size={16} className="text-green-400" />
                    ) : (
                      <AlertCircle size={16} className="text-gold" />
                    )}
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-ivory text-sm font-medium truncate">{user.email}</p>
                    <p className="text-xs text-muted">
                      {t('joined')} {format(new Date(user.created_at), 'PP')}
                      {user.couple_name
                        ? ` · ${user.couple_name} (${user.couple_state ? tCouples(`state.${user.couple_state}`) : ''})`
                        : ` · ${t('noCouple')}`
                      }
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!user.email_confirmed_at && (
                      <GoldButton
                        size="sm"
                        loading={confirmingId === user.id}
                        onClick={() => confirmEmail(user.id)}
                      >
                        {t('confirmEmail')}
                      </GoldButton>
                    )}

                    <button
                      type="button"
                      onClick={() => { setResetId(resetId === user.id ? null : user.id); setResetValue(''); }}
                      className="p-1.5 rounded-lg text-muted hover:text-gold hover:bg-surface2 transition-colors"
                      aria-label={t('resetPassword')}
                      title={t('resetPassword')}
                    >
                      <KeyRound size={14} />
                    </button>

                    {deleteConfirm === user.id ? (
                      <div className="flex gap-1.5">
                        <GoldButton
                          variant="danger"
                          size="sm"
                          loading={deletingId === user.id}
                          onClick={() => deleteUser(user.id)}
                        >
                          {t('confirmDelete')}
                        </GoldButton>
                        <GoldButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          {t('cancel')}
                        </GoldButton>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(user.id)}
                        className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-900/20 transition-colors"
                        aria-label={t('deleteUser')}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline reset-password row */}
                {resetId === user.id && (
                  <div className="flex items-end gap-2 pt-1 border-t border-line">
                    <Field
                      label={t('newPassword')}
                      type="text"
                      value={resetValue}
                      placeholder={t('newPasswordPlaceholder')}
                      onChange={(e) => setResetValue(e.target.value)}
                      className="flex-1"
                    />
                    <GoldButton
                      size="sm"
                      loading={resettingId === user.id}
                      disabled={resetValue.length < 6}
                      onClick={() => setPassword(user.id)}
                    >
                      {t('setPassword')}
                    </GoldButton>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </RouteGuard>
  );
}
