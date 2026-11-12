import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Calculator, ClipboardList, Home, LogIn, Mail, User, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PhoneInputField } from '@/components/PhoneInputField';
import type { PhoneFieldValue } from '@/components/PhoneInputField';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { cn } from '@/lib/utils';
import { AuthBackground, AuthCard, IconInput, PasswordInput, goldButton, outlineButton } from '@/components/auth/AuthUI';

type Lang = 'es' | 'en';

const Login = () => {
  const { t, i18n } = useTranslation();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(() => {
    try { return localStorage.getItem('g360_remember') !== '0'; } catch { return true; }
  });

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = useState<{
    email: string; password: string; fullName: string; phone: PhoneFieldValue | undefined; language: Lang | '';
  }>({ email: '', password: '', fullName: '', phone: undefined, language: '' });
  const [languageError, setLanguageError] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      localStorage.setItem('g360_remember', remember ? '1' : '0');
      sessionStorage.setItem('g360_session_alive', '1');
    } catch { /* almacenamiento no disponible */ }
    const { error } = await signIn(loginForm.email, loginForm.password);
    setLoading(false);
    if (error) {
      toast.error(t('login.loginFailed') + error.message);
    } else {
      toast.success(t('login.loginSuccess'));
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpForm.language) {
      setLanguageError(true);
      toast.error(t('login.languageRequired'));
      return;
    }
    if (!signUpForm.phone || !isValidPhoneNumber(signUpForm.phone)) {
      toast.error(t('login.phoneInvalid'));
      return;
    }
    setLoading(true);
    const { error } = await signUp(signUpForm.email, signUpForm.password, signUpForm.fullName, {
      phone: signUpForm.phone,
      language: signUpForm.language,
    });
    setLoading(false);
    if (error) {
      toast.error(t('login.signUpFailed') + error.message);
      return;
    }
    void i18n.changeLanguage(signUpForm.language);
    try { sessionStorage.setItem('g360_session_alive', '1'); } catch { /* noop */ }
    toast.success(t('login.signUpReady'));
    navigate('/');
  };

  const chooseLanguage = (language: Lang) => {
    setSignUpForm((f) => ({ ...f, language }));
    setLanguageError(false);
    void i18n.changeLanguage(language);
  };

  return (
    <AuthBackground>
      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-4 py-20 sm:px-8 lg:grid-cols-[1.25fr_1fr] lg:py-10">
        {/* Columna izquierda: marca y propuesta */}
        <section className="order-2 lg:order-1">
          <img src="/global360-dark.png" alt="Global 360 by Adelayne Global Corp" className="mx-auto hidden h-36 w-auto drop-shadow-xl lg:mx-0 lg:block" />
          <h1 className="mt-6 text-center font-[Montserrat] text-3xl font-light leading-tight sm:text-5xl lg:text-left">
            {t('login.heroTitle1')}
            <span className="mt-1 block font-extrabold italic text-transparent bg-clip-text bg-gradient-to-r from-[#f3d488] via-[#d9ad4f] to-[#b8862d]">
              {t('login.heroTitle2')}
            </span>
          </h1>
          <div className="mx-auto mt-3 h-1 w-56 rounded-full bg-gradient-to-r from-transparent via-gold-500 to-transparent lg:mx-0" />
          <p className="mx-auto mt-5 max-w-xl text-center text-base text-white/80 sm:text-lg lg:mx-0 lg:text-left">{t('login.heroSubtitle')}</p>

          <div className="relative mt-7 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <img src="/login-before-after.webp" alt="" className="block h-auto w-full" />
            <span className="absolute bottom-3 left-3 rounded-full border border-white/40 bg-black/55 px-4 py-1 text-xs font-bold tracking-wider sm:text-sm">{t('login.before')}</span>
            <span className="absolute bottom-3 right-3 rounded-full bg-gradient-to-r from-[#f3d488] to-[#d9ad4f] px-4 py-1 text-xs font-bold tracking-wider text-[#0b1730] sm:text-sm">{t('login.after')}</span>
          </div>

          <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-white/85 lg:justify-start">
            <li className="flex items-center gap-2"><Home className="h-5 w-5 text-gold-400" />{t('login.featureInventory')}</li>
            <li className="hidden h-6 w-px bg-white/20 sm:block" aria-hidden="true" />
            <li className="flex items-center gap-2"><Calculator className="h-5 w-5 text-gold-400" />{t('login.featureCalculator')}</li>
            <li className="hidden h-6 w-px bg-white/20 sm:block" aria-hidden="true" />
            <li className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-gold-400" />{t('login.featurePM')}</li>
          </ul>
        </section>

        {/* Columna derecha: tarjeta de acceso */}
        <section className="order-1 lg:order-2">
          <img src="/global360-dark.png" alt="Global 360 by Adelayne Global Corp" className="mx-auto mb-6 h-28 w-auto drop-shadow-xl lg:hidden" />
          <AuthCard>
            {mode === 'login' ? (
              <>
                <div className="text-center">
                  <h2 className="font-[Montserrat] text-2xl font-bold sm:text-3xl">{t('login.welcomeTitle')}</h2>
                  <p className="mt-1.5 text-white/75">{t('login.welcomeSubtitle')}</p>
                </div>
                <form onSubmit={handleLogin} className="mt-7 space-y-4">
                  <IconInput icon={Mail} id="login-email" type="email" autoComplete="email" placeholder={t('login.email')}
                    value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} required />
                  <PasswordInput id="login-password" autoComplete="current-password" placeholder={t('login.password')}
                    value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex cursor-pointer items-center gap-2 text-white/85">
                      <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                        className="h-4 w-4 rounded border-white/40 bg-transparent accent-[#d9ad4f]" />
                      {t('login.remember')}
                    </label>
                    <button type="button" onClick={() => navigate('/forgot-password')} className="text-gold-400 hover:text-gold-300">
                      {t('login.forgotPassword')}
                    </button>
                  </div>
                  <Button type="submit" disabled={loading} className={goldButton}>
                    <LogIn className="h-5 w-5" />{loading ? t('login.signingIn') : t('login.signIn')}
                  </Button>
                </form>
                <div className="my-6 h-px bg-white/15" />
                <Button type="button" variant="outline" onClick={() => setMode('signup')}
                  className={outlineButton}>
                  <UserPlus className="h-5 w-5" />{t('login.signUp')}
                </Button>
              </>
            ) : (
              <>
                <div className="text-center">
                  <h2 className="font-[Montserrat] text-2xl font-bold">{t('login.createTitle')}</h2>
                  <p className="mt-1.5 text-white/75">{t('login.createSubtitle')}</p>
                </div>
                <form onSubmit={handleSignUp} className="mt-6 space-y-4">
                  <fieldset>
                    <legend className="mb-2 text-sm font-semibold text-white/90">{t('login.languageLabel')} <span className="text-gold-400">*</span></legend>
                    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-required="true">
                      {(['es', 'en'] as Lang[]).map((l) => (
                        <button key={l} type="button" role="radio" aria-checked={signUpForm.language === l} onClick={() => chooseLanguage(l)}
                          className={cn('h-12 rounded-xl border text-sm font-semibold transition-colors',
                            signUpForm.language === l ? 'border-gold-500 bg-gold-500/15 text-gold-300' : 'border-white/15 bg-white/5 text-white/85 hover:border-white/35',
                            languageError && !signUpForm.language && 'border-red-400')}>
                          {l === 'es' ? t('login.languageEs') : t('login.languageEn')}
                        </button>
                      ))}
                    </div>
                    {languageError && !signUpForm.language && <p className="mt-1.5 text-xs text-red-300">{t('login.languageRequired')}</p>}
                  </fieldset>
                  <IconInput icon={User} id="signup-name" autoComplete="name" placeholder={t('login.fullName')}
                    value={signUpForm.fullName} onChange={(e) => setSignUpForm({ ...signUpForm, fullName: e.target.value })} required />
                  <IconInput icon={Mail} id="signup-email" type="email" autoComplete="email" placeholder={t('login.email')}
                    value={signUpForm.email} onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })} required />
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-phone" className="text-sm text-white/90">{t('login.phone')}</Label>
                    <PhoneInputField id="signup-phone" value={signUpForm.phone} onChange={(phone) => setSignUpForm({ ...signUpForm, phone })}
                      disabled={loading} placeholder={t('login.phonePlaceholder')} />
                  </div>
                  <PasswordInput id="signup-password" autoComplete="new-password" placeholder={t('uiFixes.passwordMin')} minLength={6}
                    value={signUpForm.password} onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })} required />
                  <Button type="submit" disabled={loading} className={goldButton}>
                    <UserPlus className="h-5 w-5" />{loading ? t('login.creating') : t('login.signUp')}
                  </Button>
                </form>
                <p className="mt-6 text-center text-sm text-white/75">
                  {t('login.haveAccount')}{' '}
                  <button type="button" onClick={() => setMode('login')} className="font-semibold text-gold-400 hover:text-gold-300">{t('login.goSignIn')}</button>
                </p>
              </>
            )}
          </AuthCard>
        </section>
      </div>
    </AuthBackground>
  );
};

export default Login;
