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
    <div className="space-y-2" key={name}>
      <Label htmlFor={'financing-' + name}>{label}</Label>
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
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <h1 className="flex items-center gap-3 text-3xl font-semibold">
          <Landmark className="h-7 w-7" aria-hidden="true" />
          {t('financing.title')}
        </h1>
        <p className="text-muted-foreground">{t('financing.subtitle')}</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>{t('financing.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="financing-loanType">{t('financing.type')}</Label>
              <select
                id="financing-loanType"
                value={form.loanType}
                onChange={(event) => update('loanType', event.target.value)}
                disabled={submitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="hard_money">{t('financing.hard_money')}</option>
                <option value="dscr">{t('financing.dscr')}</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="space-y-2">
              <Label htmlFor="financing-notes">{t('financing.notes')}</Label>
              <Textarea
                id="financing-notes"
                value={form.notes}
                onChange={(event) => update('notes', event.target.value)}
                disabled={submitting}
                rows={4}
              />
            </div>
            <p className="text-sm text-muted-foreground">{t('financing.privacy')}</p>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('financing.sending') : t('financing.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
