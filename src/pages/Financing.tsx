import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type FinancingForm = {
  loanType: 'hard_money' | 'dscr';
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  amount: string;
  purchasePrice: string;
  rehabBudget: string;
  arv: string;
  estimatedValue: string;
  notes: string;
};

const initialValues = (email = ''): FinancingForm => ({
  loanType: 'hard_money', fullName: '', email, phone: '',
  address: '', city: '', state: '', postalCode: '',
  amount: '', purchasePrice: '', rehabBudget: '', arv: '', estimatedValue: '', notes: '',
});

const optionalAmount = (value: string): number | null =>
  value.trim() === '' ? null : Number(value);

export default function Financing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState<FinancingForm>(() => initialValues(user?.email ?? ''));
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof FinancingForm, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || submitting) return;
    if (![form.fullName, form.email, form.phone, form.address, form.city, form.state].every((v) => v.trim())) {
      toast.error(t('financing.required'));
      return;
    }
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(t('financing.invalidAmount'));
      return;
    }
    const otherAmounts = [form.purchasePrice, form.rehabBudget, form.arv, form.estimatedValue];
    if (otherAmounts.some((v) => v.trim() !== '' && (!Number.isFinite(Number(v)) || Number(v) < 0))) {
      toast.error(t('financing.invalidAmount'));
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('financing_requests').insert({
      user_id: user.id,
      loan_type: form.loanType,
      full_name: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      property_address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postal_code: form.postalCode.trim() || null,
      requested_amount: amount,
      purchase_price: optionalAmount(form.purchasePrice),
      rehab_budget: optionalAmount(form.rehabBudget),
      after_repair_value: optionalAmount(form.arv),
      estimated_property_value: optionalAmount(form.estimatedValue),
      notes: form.notes.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      console.error('Unable to save financing request:', error.code);
      toast.error(t('financing.error'));
      return;
    }
    toast.success(t('financing.success'));
    setForm(initialValues(user.email ?? ''));
  };

  const field = (
    name: keyof FinancingForm,
    label: string,
    opts: { type?: string; required?: boolean; min?: string; step?: string } = {},
  ) => (
    <div className="min-w-0 space-y-2" key={name}>
      <Label htmlFor={'financing-' + name} className="text-xs font-semibold tracking-wide text-slate-200">{label}</Label>
      <Input
        id={'financing-' + name}
        name={name}
        value={form[name]}
        onChange={(event) => update(name, event.target.value)}
        type={opts.type ?? 'text'}
        required={opts.required}
        min={opts.min}
        step={opts.step}
        disabled={submitting}
      />
    </div>
  );

  const money = (name: keyof FinancingForm, label: string, required = false) =>
    field(name, label, { type: 'number', min: '0', step: '0.01', required });

  return (
    <div className="mx-auto max-w-5xl space-y-7 pb-8">
      <header className="relative overflow-hidden rounded-[26px] border border-gold-400/20 bg-gradient-to-br from-[#20385d] via-[#162841] to-[#101d32] px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.17)] sm:px-8 sm:py-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 h-72 w-72 rounded-full bg-gold-400/[0.07] blur-3xl" />
        <div className="relative space-y-3">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white sm:text-4xl">
          <Landmark className="h-7 w-7 shrink-0 text-gold-400 sm:h-9 sm:w-9" aria-hidden="true" />
          {t('financing.title')}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">{t('financing.subtitle')}</p>
        </div>
      </header>
      <Card className="overflow-hidden rounded-[24px] border-border/70 bg-card/90 shadow-[0_16px_50px_rgba(0,0,0,0.15)]">
        <CardHeader className="border-b border-border/60 bg-muted/20 py-6">
          <CardTitle>{t('financing.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-7">
            <div className="space-y-3 rounded-2xl border border-border/70 bg-background/30 p-4 sm:p-5">
              <Label htmlFor="financing-loanType" className="text-sm font-semibold">{t('financing.type')}</Label>
              <select
                id="financing-loanType"
                value={form.loanType}
                onChange={(event) => update('loanType', event.target.value)}
                disabled={submitting}
                className="flex h-11 w-full rounded-xl border border-border/90 bg-background/70 px-4 py-2 text-sm outline-none transition-colors focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/10"
              >
                <option value="hard_money">{t('financing.hard_money')}</option>
                <option value="dscr">{t('financing.dscr')}</option>
              </select>
            </div>
            <div className="grid gap-5 rounded-2xl border border-border/70 bg-background/20 p-4 sm:grid-cols-2 sm:p-6">
              {field('fullName', t('financing.name'), { required: true })}
              {field('email', t('financing.email'), { type: 'email', required: true })}
              {field('phone', t('financing.phone'), { type: 'tel', required: true })}
              {field('address', t('financing.propertyAddress'), { required: true })}
              {field('city', t('financing.city'), { required: true })}
              {field('state', t('financing.state'), { required: true })}
              {field('postalCode', t('financing.zip'))}
              {money('amount', t('financing.amount'), true)}
              {money('purchasePrice', t('financing.purchasePrice'))}
              {money('rehabBudget', t('financing.rehabBudget'))}
              {money('arv', t('financing.arv'))}
              {money('estimatedValue', t('financing.estimatedValue'))}
            </div>
            <div className="space-y-3 rounded-2xl border border-border/70 bg-background/20 p-4 sm:p-6">
              <Label htmlFor="financing-notes" className="text-sm font-semibold">{t('financing.notes')}</Label>
              <Textarea
                id="financing-notes"
                value={form.notes}
                onChange={(event) => update('notes', event.target.value)}
                disabled={submitting}
                rows={4}
              />
            </div>
            <div className="flex flex-col gap-4 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">{t('financing.privacy')}</p>
              <Button type="submit" disabled={submitting} className="h-11 shrink-0 rounded-xl px-7 shadow-lg">
                {submitting ? t('financing.sending') : t('financing.submit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
