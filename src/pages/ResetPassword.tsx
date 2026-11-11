import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const ResetPassword = () => {
    const { t } = useTranslation();
    const { updatePassword, session } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // If there is no session, we might not have come from a reset link
    // But Supabase typically handles the session establishment from the reset link hash
    useEffect(() => {
        if (!session) {
            console.log('No active session found during password reset');
        }
    }, [session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error(t('resetPassword.passwordMismatch'));
            return;
        }

        if (password.length < 6) {
            toast.error(t('resetPassword.passwordMinLength'));
            return;
        }

        setLoading(true);
        const { error } = await updatePassword(password);
        setLoading(false);

        if (error) {
            toast.error(t('resetPassword.updateError') + error.message);
        } else {
            toast.success(t('resetPassword.updateSuccess'));
            setTimeout(() => navigate('/login'), 2000);
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
                        {t('resetPassword.newPasswordTitle')}
                    </h1>
                </div>

                <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>{t('resetPassword.newPasswordTitle')}</CardTitle>
                        <CardDescription>{t('resetPassword.newPasswordDescription')}</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">{t('resetPassword.passwordLabel')}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">{t('resetPassword.confirmPasswordLabel')}</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full gap-2 gold-gradient text-primary-foreground hover:opacity-90 transition-opacity" disabled={loading}>
                                <Save className="h-4 w-4" />
                                {loading ? t('resetPassword.updating') : t('resetPassword.updateButton')}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default ResetPassword;
