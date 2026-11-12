// Piezas visuales compartidas por las pantallas de acceso de Global 360
// (login, registro, olvidé mi contraseña, nueva contraseña).
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Lock, type LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Lang = 'es' | 'en';

/** Selector ES | EN de la esquina superior. */
export function LangPill() {
  const { i18n } = useTranslation();
  const current: Lang = i18n.resolvedLanguage === 'en' ? 'en' : 'es';
  return (
    <div className="flex items-center gap-1 rounded-full border border-gold-500/60 bg-black/20 px-1.5 py-1 text-sm font-bold backdrop-blur">
      {(['es', 'en'] as Lang[]).map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span className="mx-0.5 h-4 w-px bg-white/30" aria-hidden="true" />}
          <button
            type="button"
            onClick={() => void i18n.changeLanguage(l)}
            aria-pressed={current === l}
            className={cn('rounded-full px-2.5 py-1 transition-colors', current === l ? 'text-gold-400' : 'text-white/80 hover:text-white')}
          >
            {l.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}

export function IconInput({ icon: Icon, className, ...props }: React.ComponentProps<typeof Input> & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/60" aria-hidden="true" />
      <Input {...props} className={cn('h-12 rounded-xl border-white/15 bg-white/5 pl-11 text-white placeholder:text-white/55 focus-visible:ring-gold-500/60', className)} />
    </div>
  );
}

export function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <IconInput icon={Lock} {...props} type={show ? 'text' : 'password'} className="pr-11" />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/60 hover:text-white"
        aria-label={show ? t('login.hidePassword') : t('login.showPassword')}
      >
        {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
      </button>
    </div>
  );
}

/** Fondo azul marino con brillos dorados y el selector de idioma. */
export function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#071226] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: 'radial-gradient(60% 50% at 20% 10%, rgba(217,173,79,.18), transparent 70%), radial-gradient(50% 60% at 90% 80%, rgba(56,104,186,.22), transparent 70%), linear-gradient(180deg,#0a1a38 0%,#071226 100%)' }}
      />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-[120%] rotate-[-6deg] bg-gradient-to-r from-transparent via-gold-500/25 to-transparent blur-2xl" />
      <div className="absolute right-4 top-4 z-20 sm:right-8 sm:top-6"><LangPill /></div>
      {children}
    </div>
  );
}

/** Tarjeta de vidrio con borde dorado. */
export function AuthCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-md rounded-[28px] border border-gold-500/40 bg-white/[0.06] p-7 shadow-[0_0_60px_-15px_rgba(217,173,79,0.45)] backdrop-blur-xl sm:p-9', className)}>
      {children}
    </div>
  );
}

/** Pantalla simple centrada (logo + tarjeta), para recuperar o crear contraseña. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthBackground>
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-16">
        <img src="/global360-dark.png" alt="Global 360 by Adelayne Global Corp" className="mb-7 h-32 w-auto drop-shadow-xl sm:h-36" />
        <AuthCard>{children}</AuthCard>
      </div>
    </AuthBackground>
  );
}

export const goldButton = 'h-12 w-full gap-2 rounded-full gold-gradient text-base font-bold text-[#0b1730] hover:opacity-90';
export const outlineButton = 'h-12 w-full gap-2 rounded-full border-gold-500/70 bg-transparent text-base font-semibold text-white hover:bg-gold-500/10 hover:text-white';
