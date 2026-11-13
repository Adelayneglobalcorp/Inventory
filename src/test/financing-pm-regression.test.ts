import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import i18n from '@/lib/i18n';
import { pmDisplayArea, pmDisplayWork } from '@/fix-flip/pmDefaults';

const source = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('Global 360: bilingual financing and project manager regression', () => {
  it('translates persisted default room and task names without changing stored values', () => {
    expect(pmDisplayArea('Baños', true)).not.toBe('Baños');
    expect(pmDisplayWork('Reemplazar lavamanos, Reemplazar inodoro', true))
      .not.toContain('Reemplazar');
    expect(pmDisplayWork('Instalar countertop', false)).toBe('Instalar encimera');
    expect(pmDisplayWork('Instalar countertop', true)).toBe('Install countertop');
  });

  it('translates completion dialog, timeline area, item selection and budget table', () => {
    const pm = source('src/fix-flip/FixFlipProjectManagerPage.tsx');
    const timeline = source('src/fix-flip/PmTimelinePanel.tsx');
    const budget = source('src/fix-flip/PmBudgetPanel.tsx');
    expect(pm).toContain('taskLabel={pmDisplayWork(');
    expect(timeline).toContain('pmDisplayArea(areaName, english)');
    expect(timeline).toContain('pmDisplayWork(i.description || i.workType || "—", english)');
    expect(timeline).toContain('english={!es}');
    expect(budget).toContain('pmDisplayArea(area,');
    expect(budget).toContain('pmDisplayWork(it.description || it.workType');
  });

  it('has bilingual labels for every new financing field', () => {
    const keys = [
      'propertySection', 'propertyModeHint', 'applicantSection',
      'residentialAddress', 'residentialCity', 'residentialState', 'residentialZip',
      'housingStatus', 'housingOwn', 'housingRent', 'creditScore', 'creditScoreHint',
      'investmentHistory', 'investmentHistoryHint', 'investmentZero',
      'investmentOneToFive', 'investmentMoreThanFive', 'financialSection',
      'downPayment', 'invalidCreditScore', 'amountsHint',
    ];
    for (const key of keys) {
      expect(i18n.exists('financing.' + key, { lng: 'es' })).toBe(true);
      expect(i18n.exists('financing.' + key, { lng: 'en' })).toBe(true);
      expect(i18n.getResource('es', 'translation', 'financing.' + key))
        .not.toBe(i18n.getResource('en', 'translation', 'financing.' + key));
    }
  });

  it('keeps property and residential address separate, with manual entry available', () => {
    const form = source('src/pages/Financing.tsx');
    expect(form).toContain("useState<'inventory' | 'manual'>('manual')");
    expect(form).toContain('property_address: form.propertyAddress.trim()');
    expect(form).toContain('residential_address: form.residentialAddress.trim()');
    expect(form).toContain('housing_status: form.housingStatus');
    expect(form).toContain('investment_properties_count: form.investmentProperties');
    expect(form).toContain('down_payment_available: downPayment');
    expect(form).toContain('credit_score: score');
    expect(form).toContain('requested_amount: null');
    expect(form).not.toContain("money('amount'");
    expect(form).not.toContain("money('estimatedValue'");
  });

  it('keeps the CRM notification and customer emails aligned with the form', () => {
    const emails = source('supabase/functions/_shared/emails.ts');
    const events = source('supabase/functions/ghl-events/index.ts');
    const migration = source('supabase/migrations/20261113122500_financing_application_details.sql');
    expect(emails).toContain('down_payment_available');
    expect(emails).toContain('credit_score');
    expect(events).toContain('investment_properties_count');
    expect(events).not.toContain('Monto solicitado:');
    expect(migration).toContain('ALTER COLUMN requested_amount DROP NOT NULL');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS residential_address');
  });
});
