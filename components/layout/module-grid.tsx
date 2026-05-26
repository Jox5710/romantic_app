'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import {
  BookOpen, ListChecks, MessageSquare, Lock, Zap, Map,
  Stars, Wind, Eye, ScrollText, CalendarDays, Heart, Feather,
  ClipboardList, Swords, Utensils, PenLine, PlaySquare, Mic,
} from 'lucide-react';
import { motion } from 'framer-motion';

const modules = [
  { href: '/timeline',      icon: BookOpen,       key: 'timeline' },
  { href: '/bucket',        icon: ListChecks,     key: 'bucket' },
  { href: '/prompt',        icon: MessageSquare,  key: 'prompt' },
  { href: '/capsule',       icon: Lock,           key: 'capsule' },
  { href: '/vibe',          icon: Zap,            key: 'vibe' },
  { href: '/map',           icon: Map,            key: 'map' },
  { href: '/constellation', icon: Stars,          key: 'constellation' },
  { href: '/whisper',       icon: Wind,           key: 'whisper' },
  { href: '/mirror',        icon: Eye,            key: 'mirror' },
  { href: '/promises',      icon: ScrollText,     key: 'promises' },
  { href: '/echo',          icon: CalendarDays,   key: 'echo' },
  { href: '/heartbeat',     icon: Heart,          key: 'heartbeat' },
  { href: '/gratitude',     icon: Feather,        key: 'gratitude' },
  { href: '/blueprint',     icon: ClipboardList,  key: 'blueprint' },
  { href: '/missions',      icon: Swords,         key: 'missions' },
  { href: '/truce',         icon: Feather,        key: 'truce' },
  { href: '/dinner',        icon: Utensils,       key: 'dinner' },
  { href: '/canvas',        icon: PenLine,        key: 'canvas' },
  { href: '/queue',         icon: PlaySquare,     key: 'queue' },
  { href: '/voices',        icon: Mic,            key: 'voices' },
] as const;

export function ModuleGrid() {
  const t = useTranslations('nav');

  return (
    <section className="px-4 pb-12">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
        {modules.map(({ href, icon: Icon, key }, i) => (
          <motion.div
            key={href}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
            whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(201,169,97,0.25)' }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              href={href}
              className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-5 text-center hover:border-gold/40 hover:bg-surface2 transition-all duration-200 group shadow-pop"
            >
              <Icon
                size={22}
                className="text-gold group-hover:text-goldBright transition-colors"
              />
              <span className="text-xs text-ivoryDim group-hover:text-ivory transition-colors">
                {t(key)}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
