import { cn } from '@/lib/utils';

export const GLOBAL360_LOGO_DARK =
  'https://files.leadconnectorhq.com/file/6af63a7b9b3d448d8097c582/global-360-fondos-oscuros.png';
export const GLOBAL360_LOGO_LIGHT =
  'https://files.leadconnectorhq.com/file/6af63a7b9b3d448d8097c581/global-360-fondos-claros.png';

type Props = {
  variant?: 'dark' | 'light';
  compact?: boolean;
  className?: string;
  imageClassName?: string;
};

/**
 * Official approved GLOBAL 360 artwork hosted by Adelayne.
 * The surrounding text is a responsive wordmark; the emblem is cropped
 * from the ORIGINAL logo instead of being recreated or distorted.
 */
export function Global360Brand({ variant = 'dark', compact = false, className, imageClassName }: Props) {
  return (
    <div className={cn('inline-flex min-w-0 items-center gap-3', className)}>
      <span className={cn(
        'relative shrink-0 overflow-hidden rounded-xl',
        variant === 'dark' ? 'bg-[#05142b]' : 'bg-white',
        compact ? 'h-11 w-11' : 'h-[72px] w-[72px]',
      )}>
        <img
          src={variant === 'dark' ? GLOBAL360_LOGO_DARK : GLOBAL360_LOGO_LIGHT}
          alt=""
          aria-hidden="true"
          className={cn(
            'absolute left-1/2 top-[-1%] h-auto max-w-none -translate-x-1/2 object-contain',
            compact ? 'w-[76px]' : 'w-[122px]',
            imageClassName,
          )}
        />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={cn('whitespace-nowrap font-[Montserrat] font-extrabold tracking-tight', compact ? 'text-lg' : 'text-2xl sm:text-3xl')}>
          <span className={variant === 'dark' ? 'text-white' : 'text-[#0a1b35]'}>Global</span>
          <span className="text-[#f0be4e]">360</span>
        </span>
        <span className={cn('whitespace-nowrap tracking-[0.04em]', variant === 'dark' ? 'text-slate-300' : 'text-[#3a4962]', compact ? 'text-[9px]' : 'text-[11px]')}>
          by Adelayne Global Corp.
        </span>
      </span>
    </div>
  );
}
