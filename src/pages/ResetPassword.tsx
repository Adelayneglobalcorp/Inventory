import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthShell, PasswordInput, goldButton } from '@/components/auth/AuthUI';

const ResetPassword = () => {
  const { t } = useTranslation();
  const { updatePassword, session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // 'checking' mientras Supabase procesa el enlace; 'ready' con sesión de recuperación; 'invalid' si venció o ya se usó.
  const [linkState, setLinkState] = useState<'checking' | 'ready' | 'invalid'>(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, '') || window.location.search.replace(/^\?/, ''));
    return params.get('error') || params.get('error_code') ? 'invalid' : 'checking';
  });

  useEffect(() => {
    if (linkState === 'invalid') return;
    if (session) {
      setLinkState('ready');
      return;
    }
    // El enlace puede tardar un instante en convertirse en sesión.
    const timer = window.setTimeout(() => setLinkState((s) => (s === 'checking' ? 'invalid' : s)), 4000);
    return () => window.clearTimeout(timer);
  }, [session, linkState]);

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
    <AuthShell>
      {linkState === 'checking' && (
        <div className="flex flex-col items-center py-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
          <p className="mt-4 text-white/80">{t('resetPassword.checkingLink')}</p>
        </div>
      )}

      {linkState === 'invalid' && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="font-[Montserrat] text-2xl font-bold">{t('resetPassword.linkInvalidTitle')}</h1>
          <p className="mt-2 text-white/75">{t('resetPassword.linkInvalidDescription')}</p>
          <Button type="button" onClick={() => navigate('/forgot-password')} className={`${goldButton} mt-6`}>
            {t('resetPassword.requestNewLink')}
          </Button>
        </div>
      )}

      {linkState === 'ready' && (
        <>
          <div className="text-center">
            <h1 className="font-[Montserrat] text-2xl font-bold sm:text-3xl">{t('resetPassword.newPasswordTitle')}</h1>
            <p className="mt-2 text-white/75">{t('resetPassword.newPasswordDescription')}</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <PasswordInput id="password" autoComplete="new-password" placeholder={t('resetPassword.passwordLabel')} minLength={6}
              value={password} onChange={(e) => setPassword(e.target.value)} required />
            <PasswordInput id="confirm-password" autoComplete="new-password" placeholder={t('resetPassword.confirmPasswordLabel')} minLength={6}
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <Button type="submit" disabled={loading} className={goldButton}>
              <Save className="h-5 w-5" />
              {loading ? t('resetPassword.updating') : t('resetPassword.updateButton')}
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  );
};

export default ResetPassword;
