import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Mail, MailCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthShell, IconInput, goldButton, outlineButton } from '@/components/auth/AuthUI';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const send = async () => {
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast.error(t('resetPassword.error') + error.message);
      return;
    }
    setSent(true);
    toast.success(t('resetPassword.success'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await send();
  };

  return (
    <AuthShell>
      {!sent ? (
        <>
          <div className="text-center">
            <h1 className="font-[Montserrat] text-2xl font-bold sm:text-3xl">{t('resetPassword.title')}</h1>
            <p className="mt-2 text-white/75">{t('resetPassword.description')}</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <IconInput icon={Mail} id="email" type="email" autoComplete="email" placeholder={t('resetPassword.emailLabel')}
              value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" disabled={loading} className={goldButton}>
              <Mail className="h-5 w-5" />
              {loading ? t('resetPassword.sending') : t('resetPassword.sendButton')}
            </Button>
          </form>
        </>
      ) : (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
            <MailCheck className="h-7 w-7" />
          </div>
          <h1 className="font-[Montserrat] text-2xl font-bold">{t('resetPassword.sentTitle')}</h1>
          <p className="mt-2 text-white/75">{t('resetPassword.sentDescription', { email })}</p>
          <Button type="button" variant="outline" disabled={loading} onClick={() => void send()} className={`${outlineButton} mt-6`}>
            {loading ? t('resetPassword.sending') : t('resetPassword.resend')}
          </Button>
        </div>
      )}
      <div className="my-6 h-px bg-white/15" />
      <button type="button" onClick={() => navigate('/login')} className="mx-auto flex items-center gap-2 text-sm font-semibold text-gold-400 hover:text-gold-300">
        <ArrowLeft className="h-4 w-4" />{t('login.backToLogin')}
      </button>
    </AuthShell>
  );
};

export default ForgotPassword;
