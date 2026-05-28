'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/lib/i18n/navigation';
import { useRespectfulMotion } from '@/lib/hooks/use-respectful-motion';
import { GoldButton } from '@/components/ui/gold-button';
import { Field } from '@/components/ui/field';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { Heart, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';

type Tab = 'magic' | 'password';
type AuthMode = 'signin' | 'signup';

const magicSchema = z.object({ email: z.string().email() });
type MagicForm = z.infer<typeof magicSchema>;

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Required'),
});
type SignInForm = z.infer<typeof signInSchema>;

const signUpSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, 'passwordShort'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword'],
  });
type SignUpForm = z.infer<typeof signUpSchema>;

// ─── Floating sparkle particle ───────────────────────────────────────────────
function Particle({
  x, y, size, duration, delay, repeat,
}: { x: number; y: number; size: number; duration: number; delay: number; repeat: number }) {
  return (
    <motion.span
      className="absolute rounded-full bg-gold pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, willChange: 'transform, opacity' }}
      animate={{ scale: [0, 1, 0], opacity: [0, 0.6, 0], y: [0, -20, -40] }}
      transition={{ duration, delay, repeat, ease: 'easeInOut' }}
    />
  );
}

// ─── Floating heart ───────────────────────────────────────────────────────────
function FloatingHeart({
  x, duration, delay, size, repeat,
}: { x: number; duration: number; delay: number; size: number; repeat: number }) {
  return (
    <motion.div
      className="absolute bottom-0 text-gold/20 pointer-events-none select-none"
      style={{ left: `${x}%`, fontSize: size, willChange: 'transform, opacity' }}
      animate={{ y: [0, -80, -160], opacity: [0, 0.4, 0], rotate: [0, 15, -10] }}
      transition={{ duration, delay, repeat, ease: 'easeOut' }}
    >
      ♥
    </motion.div>
  );
}

type ParticleData = { id: number; x: number; y: number; size: number; duration: number; delay: number };
type HeartData = { id: number; x: number; duration: number; delay: number; size: number };

function buildParticles(): ParticleData[] {
  return Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1.5,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 4,
  }));
}

function buildHearts(): HeartData[] {
  return Array.from({ length: 4 }, (_, i) => ({
    id: i,
    x: 12 + i * 22,
    duration: 4 + Math.random() * 3,
    delay: i * 0.8,
    size: 14 + Math.random() * 10,
  }));
}

// ─── OAuth button ─────────────────────────────────────────────────────────────
function OAuthButton({ provider, label, icon }: { provider: 'google' | 'apple'; label: string; icon: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/en` },
    });
    setLoading(false);
  }
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      disabled={loading}
      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-surface/50 hover:border-gold/40 hover:bg-surface2/60 text-ivory text-sm font-medium transition-colors disabled:opacity-50"
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        icon
      )}
      {label}
    </motion.button>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="relative flex-1 py-2 text-sm font-semibold transition-colors focus-visible:outline-none"
    >
      <span className={active ? 'text-gold' : 'text-ivoryDim hover:text-ivory'}>{children}</span>
      {active && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-full"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}

// ─── Magic link form ──────────────────────────────────────────────────────────
function MagicLinkForm({ t }: { t: ReturnType<typeof useTranslations> }) {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<MagicForm>({ resolver: zodResolver(magicSchema) });

  async function onSubmit({ email }: MagicForm) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/en`, shouldCreateUser: true },
    });
    if (error) setError('email', { message: t('error') });
    else setSent(true);
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-gold/40 bg-surface/60 p-6 text-center space-y-3"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
          className="text-3xl"
        >
          ✉️
        </motion.div>
        <p className="text-ivory font-semibold">{t('sent')}</p>
        <p className="text-ivoryDim text-sm">{t('checkEmail')}</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ivoryDim pointer-events-none">
          <Mail size={16} />
        </span>
        <Field
          type="email"
          placeholder={t('emailPlaceholder')}
          error={errors.email?.message}
          className="pl-9"
          {...register('email')}
        />
      </div>
      <GoldButton type="submit" loading={isSubmitting} size="lg" className="w-full">
        <Sparkles size={16} />
        {t('sendLink')}
      </GoldButton>
    </form>
  );
}

// ─── Password form ────────────────────────────────────────────────────────────
function PasswordForm({ t }: { t: ReturnType<typeof useTranslations> }) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const signInForm = useForm<SignInForm>({ resolver: zodResolver(signInSchema) });
  const signUpForm = useForm<SignUpForm>({ resolver: zodResolver(signUpSchema) });

  const handleSignIn = useCallback(async ({ email, password }: SignInForm) => {
    setGlobalError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) setGlobalError(`${t('passwordError')} (${error.message})`);
  }, [t]);

  const handleSignUp = useCallback(async ({ email, password }: SignUpForm) => {
    setGlobalError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/en` },
    });
    if (error) setGlobalError(t('signUpError'));
    else setSuccess(t('signUpSuccess'));
  }, [t]);

  const switchMode = useCallback((next: AuthMode) => {
    setMode(next);
    setGlobalError(null);
    setSuccess(null);
  }, []);

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-gold/40 bg-surface/60 p-6 text-center space-y-3"
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }} className="text-3xl">
          🎉
        </motion.div>
        <p className="text-ivory font-semibold">{success}</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sign in / Sign up toggle */}
      <div className="flex rounded-xl overflow-hidden border border-line">
        {(['signin', 'signup'] as AuthMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={[
              'flex-1 py-2 text-xs font-semibold transition-colors',
              mode === m
                ? 'bg-gold text-bg'
                : 'text-ivoryDim hover:text-ivory hover:bg-surface2/40',
            ].join(' ')}
          >
            {m === 'signin' ? t('signIn') : t('signUp')}
          </button>
        ))}
      </div>

      {globalError && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-400 text-center">
          {globalError}
        </motion.p>
      )}

      <AnimatePresence mode="wait">
        {mode === 'signin' ? (
          <motion.form
            key="signin"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            onSubmit={signInForm.handleSubmit(handleSignIn)}
            className="space-y-3"
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ivoryDim pointer-events-none"><Mail size={16} /></span>
              <Field type="email" placeholder={t('emailPlaceholder')} error={signInForm.formState.errors.email?.message} className="pl-9" {...signInForm.register('email')} />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ivoryDim pointer-events-none"><Lock size={16} /></span>
              <Field
                type={showPw ? 'text' : 'password'}
                placeholder={t('passwordPlaceholder')}
                error={signInForm.formState.errors.password?.message}
                className="pl-9 pr-10"
                {...signInForm.register('password')}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ivoryDim hover:text-ivory transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <GoldButton type="submit" loading={signInForm.formState.isSubmitting} size="lg" className="w-full mt-1">
              {t('signIn')}
            </GoldButton>
          </motion.form>
        ) : (
          <motion.form
            key="signup"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            onSubmit={signUpForm.handleSubmit(handleSignUp)}
            className="space-y-3"
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ivoryDim pointer-events-none"><Mail size={16} /></span>
              <Field type="email" placeholder={t('emailPlaceholder')} error={signUpForm.formState.errors.email?.message} className="pl-9" {...signUpForm.register('email')} />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ivoryDim pointer-events-none"><Lock size={16} /></span>
              <Field
                type={showPw ? 'text' : 'password'}
                placeholder={t('passwordPlaceholder')}
                error={signUpForm.formState.errors.password?.message}
                className="pl-9 pr-10"
                {...signUpForm.register('password')}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ivoryDim hover:text-ivory transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ivoryDim pointer-events-none"><Lock size={16} /></span>
              <Field
                type={showCPw ? 'text' : 'password'}
                placeholder={t('confirmPassword')}
                error={signUpForm.formState.errors.confirmPassword?.message}
                className="pl-9 pr-10"
                {...signUpForm.register('confirmPassword')}
              />
              <button type="button" onClick={() => setShowCPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ivoryDim hover:text-ivory transition-colors">
                {showCPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <GoldButton type="submit" loading={signUpForm.formState.isSubmitting} size="lg" className="w-full mt-1">
              {t('signUp')}
            </GoldButton>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SignInPage() {
  const t = useTranslations('auth.signIn');
  const router = useRouter();
  const { repeat } = useRespectfulMotion();
  const [tab, setTab] = useState<Tab>('magic');
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [hearts, setHearts] = useState<HeartData[]>([]);
  const [redirecting, setRedirecting] = useState(false);

  // Generate random positions only on the client to avoid SSR/hydration mismatch
  useEffect(() => {
    setParticles(buildParticles());
    setHearts(buildHearts());
  }, []);

  // Once a session exists (just signed in, or already signed in), get off /sign-in.
  // The home page's RouteGuard then routes onwards (invite / awaiting / dashboard).
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setRedirecting(true);
        router.replace('/');
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
        setRedirecting(true);
        router.replace('/');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <LoadingOverlay show={redirecting} label={t('redirecting')} fullscreen />

      {/* Adaptive background gradient */}
      <div className="fixed inset-0 -z-10 bg-bg">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(201,169,97,0.10) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(201,169,97,0.06) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Floating particles — client-only to prevent hydration mismatch */}
      {particles.map((p) => (
        <Particle key={p.id} {...p} repeat={repeat} />
      ))}

      {/* Floating hearts */}
      {hearts.map((h) => (
        <FloatingHeart key={h.id} {...h} repeat={repeat} />
      ))}

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* Glow ring behind card */}
        <div
          className="absolute inset-0 -z-10 rounded-3xl blur-2xl opacity-20"
          style={{ background: 'radial-gradient(ellipse at center, rgba(201,169,97,0.5), transparent 70%)' }}
        />

        <div className="rounded-3xl border border-gold/25 bg-surface/75 backdrop-blur-xl shadow-popLg p-8 space-y-7">
          {/* Logo + Title */}
          <div className="text-center space-y-4">
            <motion.div
              className="mx-auto relative w-fit"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 120, delay: 0.15 }}
            >
              {/* Pulsing rings (gated on reduced-motion + tab visibility) */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-gold/40"
                style={{ willChange: 'transform, opacity' }}
                animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.4, repeat, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border border-gold/20"
                style={{ willChange: 'transform, opacity' }}
                animate={{ scale: [1, 2.0, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.4, delay: 0.6, repeat, ease: 'easeInOut' }}
              />
              <div className="relative z-10 w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                <Heart className="text-gold" size={40} fill="currentColor" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="space-y-1"
            >
              <h1 className="font-display-en text-3xl text-ivory">{t('title')}</h1>
              <p className="text-ivoryDim text-sm">{t('subtitle')}</p>
            </motion.div>
          </div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex border-b border-line"
          >
            <TabBtn active={tab === 'magic'} onClick={() => setTab('magic')}>
              {t('tabMagic')}
            </TabBtn>
            <TabBtn active={tab === 'password'} onClick={() => setTab('password')}>
              {t('tabPassword')}
            </TabBtn>
          </motion.div>

          {/* Tab content */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <AnimatePresence mode="wait">
              {tab === 'magic' ? (
                <motion.div
                  key="magic"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.25 }}
                >
                  <MagicLinkForm t={t} />
                </motion.div>
              ) : (
                <motion.div
                  key="password"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                >
                  <PasswordForm t={t} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="flex items-center gap-3"
          >
            <div className="flex-1 h-px bg-line" />
            <span className="text-muted text-xs">{t('orContinueWith')}</span>
            <div className="flex-1 h-px bg-line" />
          </motion.div>

          {/* OAuth buttons */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.72 }}
            className="flex gap-3"
          >
            <OAuthButton
              provider="google"
              label="Google"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              }
            />
            <OAuthButton
              provider="apple"
              label="Apple"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-ivory">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.39.07 2.35.74 3.17.78 1.21-.22 2.37-.91 3.65-.84 1.56.09 2.73.73 3.5 1.89-3.25 1.96-2.48 6.12.81 7.33-.57 1.47-1.32 2.92-3.13 4.72zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              }
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
