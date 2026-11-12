/** How a financial entry is shown; the symbol is rendered by the input, not typed by the user. */
export type CalculatorNumberKind = 'currency' | 'percent' | 'integer';

/**
 * Accept numbers typed without formatting as well as pasted US or Spanish-formatted amounts.
 * Keep an invalid draft out of the calculations without changing what the user is typing.
 */
export function parseCalculatorNumber(raw: string, kind: CalculatorNumberKind): number {
  const value = raw.trim().replace(/[\s\u00a0$%]/g, '');
  if (value === '' || value === '-' || value === '.' || value === ',' ||
      value === '-.' || value === '-,') return 0;

  if (kind === 'integer') {
    const normalized = /^\d{1,3}(?:[,\.]\d{3})+$/.test(value)
      ? value.replace(/[,.]/g, '')
      : value;
    if (!/^\d+$/.test(normalized)) return Number.NaN;
    return Number(normalized);
  }

  const comma = value.lastIndexOf(',');
  const dot = value.lastIndexOf('.');
  // One separator and exactly three following digits represents thousands for money,
  // not a decimal point: 400,000 and 400.000 both mean four hundred thousand.
  const thousands = kind === 'currency' &&
    (/^-?\d{1,3}(,\d{3})+$/.test(value) || /^-?\d{1,3}(\.\d{3})+$/.test(value));
  const normalized = thousands
    ? value.replace(/[,.]/g, '')
    : comma > dot
      ? value.replace(/\./g, '').replace(',', '.')
      : value.replace(/,/g, '');

  if (!/^-?\d*(?:\.\d*)?$/.test(normalized)) return Number.NaN;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : Number.NaN;
}

/** Blank represents no entered amount: never force a row of hardcoded zeroes into inputs. */
export function displayCalculatorNumber(value: number, kind: CalculatorNumberKind): string {
  if (!Number.isFinite(value) || value === 0) return '';
  if (kind === 'integer') return String(Math.round(value));
  return new Intl.NumberFormat('en-US', {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/** On focus, remove thousands separators so typing/deleting digits is natural. */
export function editingCalculatorNumber(value: number, kind: CalculatorNumberKind): string {
  if (!Number.isFinite(value) || value === 0) return '';
  if (kind === 'integer') return String(Math.round(value));
  return String(Number(value.toFixed(kind === 'percent' ? 4 : 2)));
}
