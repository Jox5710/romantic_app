'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { format, isPast } from 'date-fns';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useCapsuleLetters, useAddCapsuleLetter } from '@/lib/queries/capsule';
import { encrypt, decrypt } from '@/lib/crypto';
import { GoldButton } from '@/components/ui/gold-button';
import { Card } from '@/components/ui/card';
import { Field, TextareaField } from '@/components/ui/field';
import { Lock, MailOpen, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CapsuleRecipient } from '@/lib/supabase/types';
import { useTutorial } from '@/components/tutorial/use-tutorial';

export default function CapsulePage() {
  const t = useTranslations('capsule');

  useTutorial('capsule', [
    { id: 'capsule-title', titleKey: 'capsule.step1.title', descKey: 'capsule.step1.desc' },
    { id: 'capsule-encrypt', titleKey: 'capsule.step2.title', descKey: 'capsule.step2.desc' },
    { id: 'capsule-list', titleKey: 'capsule.step3.title', descKey: 'capsule.step3.desc' },
  ]);
  const { session, coupleId } = useCoupleState();
  const { data: letters } = useCapsuleLetters(coupleId);
  const add = useAddCapsuleLetter();

  const [showForm, setShowForm] = useState(false);
  const [body, setBody] = useState('');
  const [recipient, setRecipient] = useState<CapsuleRecipient>('partner');
  const [unlockAt, setUnlockAt] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [saving, setSaving] = useState(false);

  const [openedLetters, setOpenedLetters] = useState<Record<string, string>>({});
  const [openPassphrase, setOpenPassphrase] = useState('');
  const [openingId, setOpeningId] = useState<string | null>(null);

  async function submit() {
    if (!coupleId || !session || !body.trim() || !unlockAt || !passphrase) return;
    setSaving(true);
    const { ciphertext, nonce } = await encrypt(body, passphrase);
    await add.mutateAsync({
      couple_id: coupleId,
      author_id: session.user.id,
      recipient,
      ciphertext,
      nonce,
      unlock_at: new Date(unlockAt).toISOString(),
    });
    setBody(''); setPassphrase(''); setUnlockAt('');
    setShowForm(false);
    setSaving(false);
  }

  async function openLetter(id: string, ciphertext: string, nonce: string) {
    if (!openPassphrase) return;
    try {
      const plain = await decrypt(ciphertext, nonce, openPassphrase);
      setOpenedLetters((prev) => ({ ...prev, [id]: plain }));
      setOpeningId(null);
      setOpenPassphrase('');
    } catch {
      alert('Wrong passphrase or corrupted letter.');
    }
  }

  return (
    <RouteGuard>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
            <p className="text-ivoryDim text-sm mt-1">{t('subtitle')}</p>
          </div>
          <GoldButton size="sm" onClick={() => setShowForm(true)}><Plus size={14} /> {t('compose')}</GoldButton>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card variant="elevated" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-gold text-sm uppercase tracking-wider">{t('compose')}</h2>
                  <button type="button" onClick={() => setShowForm(false)} className="text-muted hover:text-ivory"><X size={16} /></button>
                </div>
                <TextareaField textarea label={t('form.body')} value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
                <div className="space-y-1.5">
                  <label className="text-xs text-ivoryDim uppercase tracking-wider">{t('form.recipient')}</label>
                  <div className="flex gap-2">
                    {(['partner', 'both', 'future_us'] as CapsuleRecipient[]).map((r) => (
                      <button key={r} type="button" onClick={() => setRecipient(r)}
                        className={['px-3 py-1.5 rounded-full border text-xs transition-all', recipient === r ? 'border-gold bg-gold/10 text-gold' : 'border-line text-muted'].join(' ')}>
                        {t(`form.recipients.${r}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <Field label={t('form.unlockAt')} type="date" value={unlockAt} onChange={(e) => setUnlockAt(e.target.value)} />
                <Field label={t('form.passphrase')} type="password" placeholder="••••••••" hint={t('form.passphraseHint')} value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
                <GoldButton onClick={submit} loading={saving} disabled={!body.trim() || !unlockAt || !passphrase} className="w-full">
                  Seal letter
                </GoldButton>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {!letters?.length ? (
          <div className="text-center py-16 space-y-3">
            <Lock size={32} className="mx-auto text-muted" />
            <p className="font-display-en text-2xl text-ivory">{t('empty.title')}</p>
            <p className="text-muted text-sm">{t('empty.body')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {letters.map((letter) => {
              const unlocked = isPast(new Date(letter.unlock_at));
              const opened = openedLetters[letter.id];
              return (
                <Card key={letter.id} variant="elevated" className="space-y-3">
                  <div className="flex items-center gap-3">
                    {unlocked ? <MailOpen size={18} className="text-gold" /> : <Lock size={18} className="text-muted" />}
                    <div className="flex-1">
                      <p className="text-sm text-ivory">{t(`form.recipients.${letter.recipient}`)}</p>
                      <p className="text-xs text-muted">
                        {unlocked ? `Unlocked ${format(new Date(letter.unlock_at), 'PP')}` : t('sealed', { date: format(new Date(letter.unlock_at), 'PP') })}
                      </p>
                    </div>
                  </div>
                  {opened ? (
                    <p className="text-ivory text-sm leading-relaxed bg-surface2 rounded-xl p-4">{opened}</p>
                  ) : unlocked && openingId !== letter.id ? (
                    <GoldButton size="sm" variant="ghost" onClick={() => setOpeningId(letter.id)}>{t('open')}</GoldButton>
                  ) : unlocked && openingId === letter.id ? (
                    <div className="flex gap-2">
                      <Field type="password" placeholder="Passphrase" value={openPassphrase} onChange={(e) => setOpenPassphrase(e.target.value)} className="flex-1" />
                      <GoldButton size="sm" onClick={() => openLetter(letter.id, letter.ciphertext, letter.nonce)}>Open</GoldButton>
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
