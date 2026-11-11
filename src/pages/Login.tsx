import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { LogIn, UserPlus } from 'lucide-react';
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

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center p-4 relative"
      style={{ backgroundImage: 'linear-gradient(135deg, hsl(220 30% 8% / 0.95), hsl(220 25% 12% / 0.92)), url(/inventory-bg.png)' }}
    >
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src="/logo.png" alt="Inventory by Cash2Day" className="mx-auto mb-8 drop-shadow-lg rounded-lg bg-black/10 p-4 backdrop-blur-sm" style={{ width: 'calc(100% + 20px)', height: '288px' }} />
          <h1 className="font-[Montserrat] text-4xl font-bold text-white">
            {t('login.title')}
          </h1>
          <p className="mt-1 text-sm text-white/70">{t('login.subtitle')}</p>
        </div>

        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-2">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger value="login" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <LogIn className="h-4 w-4" /> {t('login.signIn')}
                </TabsTrigger>
                <TabsTrigger value="signup" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <UserPlus className="h-4 w-4" /> {t('login.signUp')}
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t('login.email')}</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t('login.password')}</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                    <div className="flex justify-end">
                      <Button
                        variant="link"
                        className="px-0 h-auto text-xs text-primary/80 hover:text-primary"
                        onClick={() => navigate('/forgot-password')}
                        type="button"
                      >
                        {t('login.forgotPassword')}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full gap-2 gold-gradient text-primary-foreground hover:opacity-90 transition-opacity" disabled={loading}>
                    <LogIn className="h-4 w-4" />
                    {loading ? t('login.signingIn') : t('login.signIn')}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{t('login.fullName')}</Label>
                    <Input
                      id="signup-name"
                      placeholder="John Doe"
                      value={signUpForm.fullName}
                      onChange={(e) => setSignUpForm({ ...signUpForm, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t('login.email')}</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signUpForm.email}
                      onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">{t('login.phone')}</Label>
                    <PhoneInputField
                      id="signup-phone"
                      value={signUpForm.phone}
                      onChange={(phone) => setSignUpForm({ ...signUpForm, phone })}
                      disabled={loading}
                      placeholder={t('login.phonePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t('login.password')}</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={signUpForm.password}
                      onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2 gold-gradient text-primary-foreground hover:opacity-90 transition-opacity" disabled={loading}>
                    <UserPlus className="h-4 w-4" />
                    {loading ? t('login.creating') : t('login.createAccount')}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div >
  );
};

export default Login;
