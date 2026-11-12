import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, X, Building2, LayoutDashboard, Shield, LogOut, User, Calculator, FolderKanban, ClipboardList, HandCoins } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const WHATSAPP_E164 = '19549070540';
const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_E164}`;
const WHATSAPP_DISPLAY = '+19549070540';

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

const Navbar = () => {
  const { t } = useTranslation();
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const links = [
    { to: '/dashboard', label: t('nav.dashboard'), shortLabel: t('nav.shortDashboard'), icon: LayoutDashboard },
    { to: '/properties', label: t('nav.properties'), shortLabel: t('nav.properties'), icon: Building2 },
    { to: '/calculator', label: t('nav.calculator'), shortLabel: t('nav.calculator'), icon: Calculator },
    { to: '/deals', label: t('nav.deals'), shortLabel: t('nav.deals'), icon: FolderKanban },
    { to: '/project-manager', label: t('nav.projectManager'), shortLabel: t('nav.shortProjects'), icon: ClipboardList },
    { to: '/financing', label: t('nav.financing'), shortLabel: t('nav.shortFinancing'), icon: HandCoins },
    ...(role === 'admin' ? [{ to: '/admin', label: t('nav.admin'), shortLabel: t('nav.admin'), icon: Shield }] : []),
  ];

  const isActive = (path: string) =>
    location.pathname === path || (path === '/project-manager' && location.pathname.startsWith('/project-manager/'));

  return (
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-card/95 shadow-[0_3px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl" aria-label={t('nav.navigation')}>
      <div className="mx-auto flex h-[84px] w-full max-w-[1600px] items-center justify-between gap-3 px-3 sm:px-5 lg:px-7">
        <Link to="/properties" className="flex min-w-0 shrink-0 items-center rounded-lg transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Global 360 by Adelayne Global Corp">
          <img src="/logo.png" alt="Global 360 by Adelayne Global Corp" className="h-[60px] w-auto max-w-[130px] object-contain sm:max-w-[160px]" />
        </Link>

        {/* Compact on laptops; icons and readable labels on larger screens. */}
        <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex xl:gap-1.5" aria-label={t('nav.modules')}>
          {links.map((link) => (
            <Tooltip key={link.to} delayDuration={100}>
              <TooltipTrigger asChild>
                <Link
                  to={link.to}
                  aria-label={link.label}
                  aria-current={isActive(link.to) ? 'page' : undefined}
                  className={`group relative flex h-[54px] w-[54px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary xl:h-[62px] xl:w-auto xl:min-w-[80px] xl:px-2 2xl:min-w-[95px] 2xl:px-3 ${isActive(link.to)
                    ? 'border-gold-500/50 bg-gradient-to-b from-gold-500/20 to-gold-500/5 text-gold-400 shadow-[0_8px_24px_rgba(0,0,0,0.16)]'
                    : 'border-transparent text-muted-foreground hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  <link.icon className="h-6 w-6 shrink-0 transition-transform group-hover:scale-110" aria-hidden="true" />
                  <span className="hidden max-w-[113px] truncate whitespace-nowrap text-xs font-semibold leading-tight xl:block">{link.shortLabel}</span>
                  {isActive(link.to) && <span className="absolute -bottom-1 h-1 w-6 rounded-full bg-gold-400" />}
                  <span className="sr-only">{link.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={12} className="max-w-[230px] rounded-xl border-gold-500/25 bg-[#1a2743] px-4 py-2.5 text-sm font-semibold text-white shadow-2xl">
                {link.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <LanguageSwitcher />
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp ${WHATSAPP_DISPLAY}`}
            title={`WhatsApp ${WHATSAPP_DISPLAY}`}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-emerald-400 transition-colors hover:bg-muted hover:text-emerald-300"
          >
            <WhatsAppGlyph className="h-6 w-6" />
          </a>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl border-border/80" aria-label={user?.email || t('nav.role')} title={user?.email || t('nav.role')}>
                <User className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px] max-w-[280px]">
              <DropdownMenuItem disabled className="overflow-hidden text-xs text-muted-foreground">
                <span className="truncate">{user?.email}</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                {t('nav.role')}: {t(`roles.${role}`, { defaultValue: role || '' })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> {t('nav.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="max-h-[calc(100vh-84px)] overflow-y-auto border-t border-border/70 bg-card px-3 pb-4 pt-3 md:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-2 gap-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive(link.to) ? 'page' : undefined}
                className={`flex min-h-[64px] min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${isActive(link.to)
                  ? 'border-gold-500/40 bg-gold-500/15 text-gold-400'
                  : 'border-border/70 bg-background/40 text-foreground hover:bg-muted'
                }`}
              >
                <link.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words leading-snug">{link.label}</span>
              </Link>
            ))}
          </div>
          <div className="mx-auto mt-3 flex max-w-lg items-center justify-between gap-3 border-t border-border/70 pt-3">
            <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-emerald-400">
              <WhatsAppGlyph className="h-4 w-4" /> WhatsApp
            </a>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 text-destructive">
              <LogOut className="h-4 w-4" /> {t('nav.signOut')}
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
