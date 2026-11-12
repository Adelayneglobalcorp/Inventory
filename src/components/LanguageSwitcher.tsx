import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage === 'es' ? 'es' : 'en';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-11 min-w-[82px] gap-1.5 rounded-xl border-border/80 bg-background/70 px-2.5 text-foreground shadow-sm transition-colors hover:border-gold-500/50 hover:bg-gold-500/10"
          aria-label={t('common.language')}
          title={t('common.language')}
        >
          <Languages className="h-[18px] w-[18px] shrink-0 text-gold-500" aria-hidden="true" />
          <span className="text-sm font-semibold">{currentLanguage.toUpperCase()}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[165px] rounded-xl">
        <DropdownMenuItem
          onSelect={() => void i18n.changeLanguage('es')}
          className="flex items-center justify-between gap-3"
          aria-current={currentLanguage === 'es' ? 'true' : undefined}
        >
          Español
          {currentLanguage === 'es' && <Check className="h-4 w-4 text-gold-500" aria-hidden="true" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => void i18n.changeLanguage('en')}
          className="flex items-center justify-between gap-3"
          aria-current={currentLanguage === 'en' ? 'true' : undefined}
        >
          English
          {currentLanguage === 'en' && <Check className="h-4 w-4 text-gold-500" aria-hidden="true" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
