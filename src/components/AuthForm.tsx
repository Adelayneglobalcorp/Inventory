import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { PhoneInputField } from '@/components/PhoneInputField';
import type { PhoneFieldValue } from '@/components/PhoneInputField';
import { isValidPhoneNumber } from 'libphonenumber-js';

export const AuthForm: React.FC = () => {
  const { t } = useTranslation();
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerPhone, setRegisterPhone] = useState<PhoneFieldValue | undefined>(undefined);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      setError(error.message);
    } else {
      setMessage(t('login.loginSuccess'));
    }

    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!registerPhone || !isValidPhoneNumber(registerPhone)) {
      setError(t('login.phoneInvalid'));
      return;
    }
    setLoading(true);

    const { error } = await signUp(registerEmail, registerPassword, registerFullName, {
      phone: registerPhone,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage(t('login.signUpSuccess'));
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterFullName('');
      setRegisterPhone(undefined);
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('uiFixes.authPropertyManager')}</CardTitle>
          <CardDescription>
            {t('uiFixes.authDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t('login.signIn')}</TabsTrigger>
              <TabsTrigger value="register">{t('login.signUp')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t('login.email')}</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder={t('uiFixes.emailExample')}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">{t('login.password')}</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('login.signingIn') : t('login.signIn')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">{t('login.fullName')}</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder={t('uiFixes.nameExample')}
                    value={registerFullName}
                    onChange={(e) => setRegisterFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">{t('login.email')}</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder={t('uiFixes.emailExample')}
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-phone">{t('login.phone')}</Label>
                  <PhoneInputField
                    id="register-phone"
                    value={registerPhone}
                    onChange={setRegisterPhone}
                    disabled={loading}
                    placeholder={t('login.phonePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">{t('login.password')}</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('login.creating') : t('login.createAccount')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        {error && (
          <CardFooter>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardFooter>
        )}

        {message && (
          <CardFooter>
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};
