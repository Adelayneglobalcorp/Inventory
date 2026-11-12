import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CalculatorNumberInput } from './CalculatorNumberInput';
import {
  displayCalculatorNumber,
  editingCalculatorNumber,
  parseCalculatorNumber,
} from './calculatorNumberInput';

describe('Fix & Flip calculator number entry', () => {
  it('shows blank empty/zero fields instead of fixed decimal zeroes', () => {
    expect(displayCalculatorNumber(0, 'currency')).toBe('');
    expect(displayCalculatorNumber(0, 'percent')).toBe('');
    expect(displayCalculatorNumber(0, 'integer')).toBe('');
    expect(editingCalculatorNumber(0, 'currency')).toBe('');
  });

  it('automatically formats monetary amounts and restores plain digits on focus', () => {
    expect(parseCalculatorNumber('400000', 'currency')).toBe(400000);
    expect(parseCalculatorNumber('$ 400,000', 'currency')).toBe(400000);
    expect(parseCalculatorNumber('400.000', 'currency')).toBe(400000);
    expect(parseCalculatorNumber('1,234.50', 'currency')).toBe(1234.5);
    expect(parseCalculatorNumber('1.234,50', 'currency')).toBe(1234.5);
    expect(displayCalculatorNumber(400000, 'currency')).toBe('400,000');
    expect(editingCalculatorNumber(400000, 'currency')).toBe('400000');
    expect(displayCalculatorNumber(1234.5, 'currency')).toBe('1,234.5');
  });

  it('understands percentages without requiring the percent sign to be typed', () => {
    expect(parseCalculatorNumber('10', 'percent')).toBe(10);
    expect(parseCalculatorNumber('12,5', 'percent')).toBe(12.5);
    expect(parseCalculatorNumber('12.5%', 'percent')).toBe(12.5);
    expect(displayCalculatorNumber(12.5, 'percent')).toBe('12.5');
    expect(editingCalculatorNumber(12.5, 'percent')).toBe('12.5');
  });

  it('uses plain integer values for project months', () => {
    expect(parseCalculatorNumber('5', 'integer')).toBe(5);
    expect(parseCalculatorNumber('5.5', 'integer')).toBeNaN();
    expect(displayCalculatorNumber(5, 'integer')).toBe('5');
    expect(editingCalculatorNumber(5, 'integer')).toBe('5');
  });

  it('keeps blank and incomplete edits available without inserting malformed values', () => {
    expect(parseCalculatorNumber('', 'currency')).toBe(0);
    expect(parseCalculatorNumber('.', 'currency')).toBe(0);
    expect(parseCalculatorNumber('not money', 'currency')).toBeNaN();
  });

  it('renders the dollar sign automatically with an empty amount field', () => {
    const begin = vi.fn();
    render(
      <CalculatorNumberInput kind="currency" aria-label="Purchase amount"
        defaultValue="" onBeginEdit={begin} />,
    );
    const input = screen.getByRole('textbox', { name: 'Purchase amount' });
    expect((input as HTMLInputElement).value).toBe('');
    expect(screen.getByText('$')).toBeTruthy();
    fireEvent.focus(input);
    expect(begin).toHaveBeenCalledTimes(1);
    fireEvent.change(input, { target: { value: '400000' } });
    expect((input as HTMLInputElement).value).toBe('400000');
  });

  it('renders percentages with a suffix and leaves month counts undecorated', () => {
    const { unmount } = render(
      <CalculatorNumberInput kind="percent" aria-label="Down payment percentage" defaultValue="" />,
    );
    expect(screen.getByText('%')).toBeTruthy();
    expect(screen.queryByText('$')).toBeNull();
    unmount();

    render(<CalculatorNumberInput kind="integer" aria-label="Project months" defaultValue="" />);
    expect(screen.queryByText('%')).toBeNull();
    expect(screen.queryByText('$')).toBeNull();
  });
});
