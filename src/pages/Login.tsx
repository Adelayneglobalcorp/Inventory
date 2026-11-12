import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { LogIn, UserPlus, House, Calculator, ClipboardList, ArrowUpRight } from 'lucide-react';
import { Global360Brand } from '@/components/branding/Global360Brand';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { PhoneInputField } from '@/components/PhoneInputField';
import type { PhoneFieldValue } from '@/components/PhoneInputField';
import { isValidPhoneNumber } from 'libphonenumber-js';

const Login = () => {
  const { t } = useTranslation();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [signUpForm, setSignUpForm] = useState<{
    email: string;
    password: string;
    fullName: string;
    phone: PhoneFieldValue | undefined;
  }>({
    email: '',
    password: '',
    fullName: '',
    phone: undefined,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('🔍 Login attempt with:', { email: loginForm.email, hasPassword: !!loginForm.password });

    const { error } = await signIn(loginForm.email, loginForm.password);
    setLoading(false);

    if (error) {
      console.error('❌ Login failed:', error);
      toast.error(t('login.loginFailed') + error.message);
    } else {
      console.log('✅ Login successful, redirecting...');
      toast.success(t('login.loginSuccess'));
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpForm.phone || !isValidPhoneNumber(signUpForm.phone)) {
      toast.error(t('login.phoneInvalid'));
      return;
    }
    setLoading(true);
    const { error } = await signUp(signUpForm.email, signUpForm.password, signUpForm.fullName, {
      phone: signUpForm.phone,
    });
    setLoading(false);
    if (error) {
      toast.error(t('login.signUpFailed') + error.message);
    } else {
      toast.success(t('login.signUpSuccess'));
      setSignUpForm((prev) => ({ ...prev, email: '', password: '', fullName: '', phone: undefined }));
    }
  };

  const isSpanish = t('login.signIn').toLowerCase().includes('sesión') || t('login.signIn').toLowerCase().includes('sesion');

  const features = [
    { icon: House, label: 'Inventory' },
    { icon: Calculator, label: isSpanish ? 'Calculadora' : 'Calculator' },
    { icon: ClipboardList, label: 'Project Manager' },
  ];

  return (
    <main className="g360-login relative min-h-screen overflow-hidden bg-[#06172e] text-white">
      <div aria-hidden="true" className="g360-login-glow pointer-events-none absolute -left-48 top-[28%] h-[580px] w-[580px] rounded-full bg-[#175080]/20 blur-[110px]" />
      <div aria-hidden="true" className="g360-login-glow pointer-events-none absolute -right-40 bottom-0 h-[440px] w-[440px] rounded-full bg-[#bb8d28]/10 blur-[110px]" />
      <div className="absolute right-4 top-4 z-30 sm:right-8 sm:top-6">
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1550px] items-center gap-8 px-5 pb-12 pt-20 sm:px-9 lg:grid-cols-[minmax(0,1.12fr)_minmax(390px,.88fr)] lg:gap-14 lg:px-12 lg:py-14 xl:gap-20">
        <section className="g360-entrance-left flex min-w-0 flex-col items-start">
          <Global360Brand variant="dark" className="mb-9" />

          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#dfba64]/90">
            {isSpanish ? 'Herramientas para Fix & Flip' : 'Tools for Fix & Flip'}
          </p>
          <h1 className="max-w-[700px] font-[Montserrat] text-[clamp(2.15rem,4.15vw,4.1rem)] font-semibold leading-[1.12] tracking-[-0.05em] text-white">
            {isSpanish ? 'Transforma propiedades' : 'Turn properties'}{' '}
            <span className="block bg-gradient-to-r from-[#fbe39a] via-[#edc05a] to-[#bd8b24] bg-clip-text font-bold text-transparent">
              {isSpanish ? 'en grandes oportunidades.' : 'into opportunities.'}
            </span>
          </h1>
          <p className="mt-5 max-w-[590px] text-sm leading-7 text-slate-200/80 sm:text-base">
            {isSpanish
              ? 'Herramientas y recursos para aprender, analizar y gestionar proyectos Fix & Flip a tu ritmo.'
              : 'Tools and resources to learn, analyze, and manage Fix & Flip projects at your own pace.'}
          </p>

          <div className="g360-before-after relative mt-9 w-full max-w-[720px] overflow-hidden rounded-[26px] border border-white/15 bg-[#0a2038] shadow-[0_22px_60px_rgba(0,0,0,.32)] sm:mt-10">
            <div className="grid h-[210px] grid-cols-2 sm:h-[265px] lg:h-[290px]">
              <div className="relative min-w-0 overflow-hidden">
                <img
                  src="https://unsplash.com/photos/v54e-On6ojQ/download?w=850&q=80"
                  alt={isSpanish ? 'Casa con necesidades de remodelación' : 'House in need of renovation'}
                  className="h-full w-full object-cover object-center brightness-[.72] saturate-[.8]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07172d]/65 to-transparent" />
                <span className="absolute bottom-4 left-4 rounded-full border border-white/30 bg-[#07172c]/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
                  {isSpanish ? 'Antes' : 'Before'}
                </span>
              </div>
              <div className="relative min-w-0 overflow-hidden">
                <img
                  src="https://unsplash.com/photos/MUiv6OcHoto/download?w=850&q=80"
                  alt={isSpanish ? 'Ejemplo de vivienda renovada' : 'Example of a renovated home'}
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07172d]/30 to-transparent" />
                <span className="absolute bottom-4 right-4 rounded-full bg-gradient-to-r from-[#efc457] to-[#bc8b24] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#07172d]">
                  {isSpanish ? 'Después' : 'After'}
                </span>
              </div>
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 rotate-[10deg] bg-gradient-to-b from-transparent via-[#f9d56b] to-transparent shadow-[0_0_18px_rgba(247,193,79,.8)]" />
            <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#f4cd73]/50 bg-[#071c35]/90 text-[#f7cc62] shadow-[0_0_26px_rgba(251,196,83,.35)] backdrop-blur">
              <ArrowUpRight size={22} strokeWidth={1.6} />
            </div>
            <span className="absolute right-3 top-3 rounded-md bg-[#06172c]/75 px-2 py-1 text-[9px] text-slate-200 backdrop-blur">
              {isSpanish ? 'Imágenes ilustrativas' : 'Illustrative images'}
            </span>
          </div>

          <div className="mt-6 flex w-full max-w-[720px] flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/[.12] pt-5 sm:gap-x-9">
            {features.map((feature) => (
              <div key={feature.label} className="flex items-center gap-2 text-xs text-slate-200/85 sm:text-sm">
                <feature.icon className="h-4 w-4 shrink-0 text-[#e9bd5d]" strokeWidth={1.6} aria-hidden="true" />
                <span>{feature.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section aria-label={isSpanish ? 'Acceso a Global 360' : 'Global 360 access'} className="g360-entrance-card w-full min-w-0 lg:justify-self-end">
          <div className="relative mx-auto w-full max-w-[485px] overflow-hidden rounded-[29px] border border-[#e5b85f]/30 bg-gradient-to-br from-[#183454]/85 via-[#091c34]/95 to-[#071628]/95 p-1 shadow-[0_25px_80px_rgba(0,0,0,.4)] backdrop-blur-2xl">
            <div aria-hidden="true" className="pointer-events-none absolute -left-36 -top-48 h-64 w-96 rounded-full bg-[#ffd47f]/10 blur-[65px]" />
            <div className="relative rounded-[25px] px-5 py-8 sm:px-8 sm:py-10">
              <div className="mb-7 text-center">
                <h2 className="font-[Montserrat] text-2xl font-bold tracking-tight text-white sm:text-[27px]">
                  {isSpanish ? 'Bienvenido a Global 360' : 'Welcome to Global 360'}
                </h2>
                <p className="mt-2 text-sm text-[#cedae9]">
                  {isSpanish ? 'Accede a tus herramientas Fix & Flip.' : 'Access your Fix & Flip tools.'}
                </p>
              </div>

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="mb-5 grid h-11 w-full grid-cols-2 rounded-xl border border-white/10 bg-[#08182b]/65 p-1">
                  <TabsTrigger value="login" className="gap-1.5 rounded-lg text-[13px] text-slate-300 data-[state=active]:bg-[#e8b94b] data-[state=active]:font-semibold data-[state=active]:text-[#07182a]">
                    <LogIn className="h-3.5 w-3.5" /> {t('login.signIn')}
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="gap-1.5 rounded-lg text-[13px] text-slate-300 data-[state=active]:bg-[#e8b94b] data-[state=active]:font-semibold data-[state=active]:text-[#07182a]">
                    <UserPlus className="h-3.5 w-3.5" /> {t('login.signUp')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-xs font-medium text-slate-200">{t('login.email')}</Label>
                      <Input id="login-email" type="email" autoComplete="email" placeholder={t('uiFixes.emailExample')}
                        className="g360-auth-input h-12 rounded-xl border-white/15 bg-[#28435f]/65 text-white placeholder:text-slate-400 focus-visible:ring-[#e9bc56]"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-xs font-medium text-slate-200">{t('login.password')}</Label>
                      <Input id="login-password" type="password" autoComplete="current-password" placeholder="••••••••"
                        className="g360-auth-input h-12 rounded-xl border-white/15 bg-[#28435f]/65 text-white placeholder:text-slate-400 focus-visible:ring-[#e9bc56]"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
                      <div className="flex justify-end">
                        <Button type="button" variant="link" className="h-auto px-0 text-xs text-[#f0c860] hover:text-[#ffde8b]"
                          onClick={() => navigate('/forgot-password')}>{t('login.forgotPassword')}</Button>
                      </div>
                    </div>
                    <Button type="submit" disabled={loading}
                      className="h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-[#f9d775] via-[#edbf50] to-[#c7932f] text-sm font-bold text-[#0a1c33] shadow-[0_12px_30px_rgba(214,163,51,.19)] transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white">
                      <LogIn className="h-4 w-4" /> {loading ? t('login.signingIn') : t('login.signIn')}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-xs text-slate-200">{t('login.fullName')}</Label>
                      <Input id="signup-name" autoComplete="name" placeholder={t('uiFixes.nameExample')} className="g360-auth-input h-11 border-white/15 bg-[#28435f]/65 text-white placeholder:text-slate-400"
                        value={signUpForm.fullName} onChange={(e) => setSignUpForm({ ...signUpForm, fullName: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-xs text-slate-200">{t('login.email')}</Label>
                      <Input id="signup-email" type="email" autoComplete="email" placeholder={t('uiFixes.emailExample')} className="g360-auth-input h-11 border-white/15 bg-[#28435f]/65 text-white placeholder:text-slate-400"
                        value={signUpForm.email} onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone" className="text-xs text-slate-200">{t('login.phone')}</Label>
                      <PhoneInputField id="signup-phone" value={signUpForm.phone}
                        onChange={(phone) => setSignUpForm({ ...signUpForm, phone })} disabled={loading}
                        placeholder={t('login.phonePlaceholder')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-xs text-slate-200">{t('login.password')}</Label>
                      <Input id="signup-password" type="password" autoComplete="new-password" placeholder={t('uiFixes.passwordMin')}
                        className="g360-auth-input h-11 border-white/15 bg-[#28435f]/65 text-white placeholder:text-slate-400"
                        value={signUpForm.password} onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })} required minLength={6} />
                    </div>
                    <Button type="submit" disabled={loading}
                      className="h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-[#f9d775] via-[#edbf50] to-[#c7932f] text-sm font-bold text-[#0a1c33] hover:brightness-110">
                      <UserPlus className="h-4 w-4" /> {loading ? t('login.creating') : t('login.createAccount')}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <p className="mt-7 border-t border-white/[.12] pt-5 text-center text-[11px] text-slate-400">
                Global 360 <span className="mx-1 text-[#c9a457]">•</span> by Adelayne Global Corp.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
