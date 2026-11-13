import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { HandCoins, Search, House, UserRound, ChartNoAxesCombined, Wallet } from 'lucide-react';
import { getProperties } from '@/lib/properties';
import { usePortalContent } from '@/lib/portalContent';
import type { Property } from '@/types/property';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

/** Property and applicant addresses must never be confused or overwritten. */
type FinancingForm = {
  loanType: 'hard_money' | 'dscr';
  fullName: string;
  email: string;
  phone: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  residentialAddress: string;
  residentialCity: string;
  residentialState: string;
  residentialZip: string;
  housingStatus: '' | 'own' | 'rent';
  creditScore: string;
  investmentProperties: '' | '0' | '1-5' | '5+';
  downPayment: string;
  purchasePrice: string;
  rehabBudget: string;
  arv: string;
  notes: string;
};
const initialValues = (email = ''): FinancingForm => ({
  loanType: 'hard_money', fullName: '', email, phone: '',
  propertyAddress: '', propertyCity: '', propertyState: '', propertyZip: '',
  residentialAddress: '', residentialCity: '', residentialState: '', residentialZip: '',
  housingStatus: '', creditScore: '', investmentProperties: '',
  downPayment: '', purchasePrice: '', rehabBudget: '', arv: '', notes: '',
});

export const parseMoney = (value: string): number => {
  const raw = value.trim().replace(/\s/g, '').replace(/[$]/g, '');
  if (!raw) return NaN;
  const comma = raw.lastIndexOf(',');
  const dot = raw.lastIndexOf('.');
  const normal = comma > dot ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/,/g, '');
  if (!/^-?\d+(?:\.\d*)?$/.test(normal)) return NaN;
  return Number(normal);
};
const optionalAmount = (value: string): number | null =>
  value.trim() === '' ? null : parseMoney(value);
const moneyText = (value: number | null | undefined): string =>
  value == null || !Number.isFinite(Number(value)) ? '' : Number(value).toFixed(2);

export default function Financing() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || 'es').startsWith('en') ? 'en' : 'es';
  const portal = usePortalContent('financing', lang);
  const { user } = useAuth();
  const [form, setForm] = useState<FinancingForm>(() => initialValues(user?.email ?? ''));
  const [submitting, setSubmitting] = useState(false);
  const [inventory, setInventory] = useState<Property[]>([]);
  const [inventoryError, setInventoryError] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [propertyMode, setPropertyMode] = useState<'inventory' | 'manual'>('manual');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  useEffect(() => {
    if (!user?.email) return;
    setForm(prev => prev.email ? prev : { ...prev, email: user.email ?? '' });
  }, [user?.email]);
  useEffect(() => {
    let active = true;
    getProperties().then(({ data, error }) => {
      if (!active) return;
      setInventory(data ?? []);
      setInventoryError(Boolean(error));
    }).catch(() => { if (active) setInventoryError(true); });
    return () => { active = false; };
  }, []);

  const filteredInventory = useMemo(() =>
    inventory.filter(p =>
      (p.address + ' ' + p.city + ' ' + p.state).toLowerCase().includes(inventorySearch.toLowerCase())),
    [inventory, inventorySearch]);

  const clearProperty = () => {
    setSelectedPropertyId('');
    setForm(prev => ({ ...prev,
      propertyAddress: '', propertyCity: '', propertyState: '', propertyZip: '',
      purchasePrice: '', rehabBudget: '', arv: '',
    }));
  };
  const switchPropertyMode = (next: 'inventory' | 'manual') => {
    if (next === propertyMode) return;
    setPropertyMode(next);
    clearProperty();
  };
  const useInventoryProperty = (id: string) => {
    setSelectedPropertyId(id);
    const property = inventory.find(p => p.id === id);
    if (!property) { clearProperty(); return; }
    setForm(prev => ({
      ...prev,
      propertyAddress: property.address, propertyCity: property.city, propertyState: property.state,
      propertyZip: property.zip_code ?? '',
      purchasePrice: moneyText(property.price),
      arv: moneyText(property.arv),
      rehabBudget: moneyText(property.rehab_cost),
    }));
  };
  const update = (name: keyof FinancingForm, value: string) =>
    setForm(prev => ({ ...prev, [name]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || submitting) return;

    const required = [
      form.fullName, form.email, form.phone,
      form.propertyAddress, form.propertyCity, form.propertyState, form.propertyZip,
      form.residentialAddress, form.residentialCity, form.residentialState, form.residentialZip,
      form.housingStatus, form.investmentProperties, form.downPayment,
    ];
    if (required.some(value => !value.trim()) || (propertyMode === 'inventory' && !selectedPropertyId)) {
      toast.error(t('financing.required'));
      return;
    }
    const downPayment = parseMoney(form.downPayment);
    if (!Number.isFinite(downPayment) || downPayment < 0 ||
        [form.purchasePrice, form.rehabBudget, form.arv].some(value =>
          value.trim() && (!Number.isFinite(parseMoney(value)) || parseMoney(value) < 0))) {
      toast.error(t('financing.invalidAmount'));
      return;
    }
    const score = form.creditScore.trim() ? Number(form.creditScore) : null;
    if (score !== null && (!Number.isInteger(score) || score < 300 || score > 850)) {
      toast.error(t('financing.invalidCreditScore'));
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('financing_requests').insert({
      user_id: user.id,
      loan_type: form.loanType,
      full_name: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      property_address: form.propertyAddress.trim(),
      city: form.propertyCity.trim(),
      state: form.propertyState.trim(),
      postal_code: form.propertyZip.trim(),
      requested_amount: null,
      purchase_price: optionalAmount(form.purchasePrice),
      rehab_budget: optionalAmount(form.rehabBudget),
      after_repair_value: optionalAmount(form.arv),
      estimated_property_value: null,
      residential_address: form.residentialAddress.trim(),
      residential_city: form.residentialCity.trim(),
      residential_state: form.residentialState.trim(),
      residential_postal_code: form.residentialZip.trim(),
      housing_status: form.housingStatus,
      credit_score: score,
      down_payment_available: downPayment,
      investment_properties_count: form.investmentProperties,
      notes: [selectedPropertyId ? 'Inventory property ID: ' + selectedPropertyId : '', form.notes.trim()]
        .filter(Boolean).join('\n') || null,
    });
    setSubmitting(false);
    if (error) {
      console.error('Unable to save financing request:', error.code);
      toast.error(t('financing.error'));
      return;
    }
    toast.success(t('financing.success'));
    setForm(initialValues(user.email ?? ''));
    setSelectedPropertyId('');
    setPropertyMode('manual');
    setInventorySearch('');
  };

  const field = (
    name: keyof FinancingForm, label: string,
    opts: { type?: string; required?: boolean; money?: boolean; readOnly?: boolean;
      inputMode?: 'numeric' | 'decimal'; min?: string; max?: string; note?: string } = {},
  ) => (
    <div className="min-w-0 space-y-2" key={name}>
      <Label htmlFor={'financing-' + name} className="text-xs font-semibold tracking-wide text-slate-200">
        {label}{opts.required ? <span className="ml-1 text-amber-400">*</span> : null}
      </Label>
      <Input id={'financing-' + name} name={name} value={form[name]}
        onChange={event => update(name, event.target.value)}
        onBlur={() => {
          if (!opts.money || !form[name].trim()) return;
          const parsed = parseMoney(form[name]);
          if (Number.isFinite(parsed) && parsed >= 0) update(name, parsed.toFixed(2));
        }}
        inputMode={opts.money ? 'decimal' : opts.inputMode}
        type={opts.money ? 'text' : opts.type ?? 'text'}
        min={opts.min} max={opts.max} required={opts.required}
        readOnly={opts.readOnly} disabled={submitting}
        className={opts.readOnly ? 'border-gold-500/20 bg-muted/25 text-slate-300' : ''}
      />
      {opts.note ? <p className="text-xs text-muted-foreground">{opts.note}</p> : null}
    </div>
  );
  const money = (name: keyof FinancingForm, label: string, required = false) =>
    field(name, label, { money: true, required });

  const section = 'rounded-2xl border border-border/70 bg-background/20 p-4 sm:p-6';
  const selection = 'h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground';

  return (
    <div className="mx-auto max-w-5xl space-y-7 pb-8">
      <header className="relative overflow-hidden rounded-[26px] border border-gold-400/20 bg-gradient-to-br from-[#20385d] via-[#162841] to-[#101d32] px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.17)] sm:px-8 sm:py-10">
        <div className="relative space-y-3">
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white sm:text-4xl">
            <HandCoins className="h-7 w-7 shrink-0 text-gold-400" aria-hidden="true" />
            {portal('title', t('financing.title'))}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            {portal('subtitle', t('financing.subtitle'))}
          </p>
        </div>
      </header>

      <Card className="overflow-hidden rounded-[24px] border-border/70 bg-card/90 shadow-[0_16px_50px_rgba(0,0,0,0.15)]">
        <CardHeader className="border-b border-border/60 bg-muted/20 py-6">
          <CardTitle>{portal('title', t('financing.title'))}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-6">
            <section className={section}>
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-gold-400">
                <House size={19} /> {t('financing.propertySection')}
              </h2>
              <div className="mb-5 space-y-2">
                <Label htmlFor="financing-loanType">{t('financing.type')}</Label>
                <select id="financing-loanType" value={form.loanType}
                  onChange={event => update('loanType', event.target.value)}
                  disabled={submitting} className={selection}>
                  <option value="hard_money">{t('financing.hard_money')}</option>
                  <option value="dscr">{t('financing.dscr')}</option>
                </select>
              </div>
              <p className="mb-3 text-sm text-slate-300">{t('financing.propertyModeHint')}</p>
              <fieldset className="mb-4 flex flex-wrap gap-5">
                <legend className="sr-only">{t('financing.propertySection')}</legend>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="radio" name="property-mode" checked={propertyMode === 'manual'}
                    onChange={() => switchPropertyMode('manual')} disabled={submitting}/>
                  {t('financing.manualProperty')}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="radio" name="property-mode" checked={propertyMode === 'inventory'}
                    onChange={() => switchPropertyMode('inventory')} disabled={submitting}/>
                  {t('financing.inventoryProperty')}
                </label>
              </fieldset>
              {propertyMode === 'inventory' && (
                <div className="mb-5 space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                    <Input value={inventorySearch} onChange={e => setInventorySearch(e.target.value)}
                      className="pl-9" placeholder={t('financing.searchProperty')} disabled={submitting} />
                  </div>
                  <select value={selectedPropertyId} onChange={e => useInventoryProperty(e.target.value)}
                    className={selection} disabled={submitting} required>
                    <option value="">{t('financing.chooseProperty')}</option>
                    {filteredInventory.map(p => <option key={p.id} value={p.id}>{p.address}, {p.city}, {p.state}</option>)}
                  </select>
                  {inventoryError && <p className="text-xs text-amber-400">{t('financing.inventoryUnavailable')}</p>}
                  <p className="text-xs text-muted-foreground">{t('financing.autoFillHint')}</p>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  {field('propertyAddress', t('financing.propertyAddress'), { required: true })}
                </div>
                {field('propertyCity', t('financing.city'), { required: true })}
                {field('propertyState', t('financing.state'), { required: true })}
                {field('propertyZip', t('financing.zip'), { required: true })}
              </div>
            </section>

            <section className={section}>
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-gold-400">
                <UserRound size={19} /> {t('financing.applicantSection')}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {field('fullName', t('financing.name'), { required: true })}
                {field('email', t('financing.email'), { type: 'email', required: true })}
                {field('phone', t('financing.phone'), { type: 'tel', required: true })}
                <div className="sm:col-span-2">
                  {field('residentialAddress', t('financing.residentialAddress'), { required: true })}
                </div>
                {field('residentialCity', t('financing.residentialCity'), { required: true })}
                {field('residentialState', t('financing.residentialState'), { required: true })}
                {field('residentialZip', t('financing.residentialZip'), { required: true })}
                <div className="space-y-2">
                  <Label htmlFor="financing-housingStatus">{t('financing.housingStatus')} <span className="text-amber-400">*</span></Label>
                  <select id="financing-housingStatus" className={selection} value={form.housingStatus}
                    onChange={event => update('housingStatus', event.target.value)} disabled={submitting} required>
                    <option value="">{t('financing.chooseOption')}</option>
                    <option value="own">{t('financing.housingOwn')}</option>
                    <option value="rent">{t('financing.housingRent')}</option>
                  </select>
                </div>
                {field('creditScore', t('financing.creditScore'), { type: 'number', inputMode: 'numeric',
                  min: '300', max: '850', note: t('financing.creditScoreHint') })}
              </div>
            </section>

            <section className={section}>
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-gold-400">
                <ChartNoAxesCombined size={19} /> {t('financing.experienceSection')}
              </h2>
              <p className="mb-3 text-sm text-slate-300">{t('financing.investmentHistoryHint')}</p>
              <Label htmlFor="financing-investmentProperties">{t('financing.investmentHistory')} <span className="text-amber-400">*</span></Label>
              <select id="financing-investmentProperties" value={form.investmentProperties}
                onChange={e => update('investmentProperties', e.target.value)}
                className={'mt-2 ' + selection} disabled={submitting} required>
                <option value="">{t('financing.chooseOption')}</option>
                <option value="0">{t('financing.investmentZero')}</option>
                <option value="1-5">{t('financing.investmentOneToFive')}</option>
                <option value="5+">{t('financing.investmentMoreThanFive')}</option>
              </select>
            </section>

            <section className={section}>
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-gold-400">
                <Wallet size={19} /> {t('financing.financialSection')}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {money('purchasePrice', t('financing.purchasePrice'))}
                {money('rehabBudget', t('financing.rehabBudget'))}
                {money('arv', t('financing.arv'))}
                {money('downPayment', t('financing.downPayment'), true)}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{t('financing.amountsHint')}</p>
            </section>

            <section className={section}>
              <Label htmlFor="financing-notes">{t('financing.notes')}</Label>
              <Textarea id="financing-notes" className="mt-2" value={form.notes}
                onChange={event => update('notes', event.target.value)}
                disabled={submitting} rows={4}/>
            </section>

            <div className="flex flex-col gap-4 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
                {portal('privacy', t('financing.privacy'))}
              </p>
              <Button type="submit" disabled={submitting} className="h-11 shrink-0 rounded-xl px-7 shadow-lg">
                {submitting ? t('financing.sending') : portal('submit', t('financing.submit'))}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
