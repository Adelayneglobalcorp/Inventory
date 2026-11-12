import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CalculatorNumberKind } from './calculatorNumberInput';

export type CalculatorNumberInputProps = ComponentProps<typeof Input> & {
  kind: CalculatorNumberKind;
  onBeginEdit?: () => void;
};

/** Automatic dollar/percentage adornments; neither symbol enters the numeric data. */
export function CalculatorNumberInput({
  kind,
  onBeginEdit,
  onFocus,
  className,
  ...props
}: CalculatorNumberInputProps) {
  return (
    <div className="relative">
      {kind === 'currency' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-foreground/80"
        >
          $
        </span>
      )}
      <Input
        {...props}
        onFocus={(event) => {
          onBeginEdit?.();
          onFocus?.(event);
        }}
        className={cn(
          'bg-background tabular-nums',
          kind === 'currency' && 'pl-8',
          kind === 'percent' && 'pr-8',
          className,
        )}
      />
      {kind === 'percent' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-foreground/80"
        >
          %
        </span>
      )}
    </div>
  );
}
