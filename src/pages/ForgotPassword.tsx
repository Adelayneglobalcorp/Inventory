import { Global360Brand } from '@/components/branding/Global360Brand';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const ForgotPassword = () => {
    const { t } = useTranslation();
    const { resetPassword } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await resetPassword(email);
        setLoading(false);

        if (error) {
            toast.error(t('resetPassword.error') + error.message);
        } else {
            toast.success(t('resetPassword.success'));
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
                    <Global360Brand variant="dark" className="mx-auto mb-8 justify-center" />
                    <h1 className="font-[Montserrat] text-4xl font-bold text-white">
                        {t('resetPassword.title')}
                    </h1>
                </div>

                <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>{t('resetPassword.title')}</CardTitle>
                        <CardDescription>{t('resetPassword.description')}</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('resetPassword.emailLabel')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={t('uiFixes.emailExample')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full gap-2 gold-gradient text-primary-foreground hover:opacity-90 transition-opacity" disabled={loading}>
                                <Mail className="h-4 w-4" />
                                {loading ? t('resetPassword.sending') : t('resetPassword.sendButton')}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full gap-2 text-muted-foreground"
                                onClick={() => navigate('/login')}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                {t('login.backToLogin')}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPassword;
