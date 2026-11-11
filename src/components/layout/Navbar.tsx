import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, X, Building2, LayoutDashboard, Shield, LogOut, User, Calculator, FolderKanban, HardHat } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const WHATSAPP_E164 = '19549070540';
const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_E164}`;
const WHATSAPP_DISPLAY = '+19549070540';

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
    >
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
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/properties', label: t('nav.properties'), icon: Building2 },
    { to: '/calculator', label: t('nav.calculator'), icon: Calculator },
    { to: '/deals', label: t('nav.deals'), icon: FolderKanban },
    { to: '/project-manager', label: t('nav.projectManager'), icon: HardHat },
    ...(role === 'admin' ? [{ to: '/admin', label: t('nav.admin'), icon: Shield }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-32 max-w-7xl items-center justify-between px-4">
        <Link to="/properties" className="flex items-center gap-2">
          <img src="/logo.png" alt="Inventory by Cash2Day" className="drop-shadow-md rounded bg-black/10 p-3 backdrop-blur-sm" style={{ width: 'calc(100% + 20px)', height: '128px' }} />
        </Link>

        {/* Desktop nav */}
        <div className="hidden flex-wrap items-center justify-end gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive(link.to)
                ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden grid-cols-[auto_minmax(0,220px)] items-center gap-x-2 gap-y-1.5 border-l border-border/40 pl-3 md:grid">
          <div className="row-span-2 flex justify-center self-center">
            <LanguageSwitcher />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto min-h-9 w-full justify-start gap-2 px-2 py-1.5 font-normal text-muted-foreground hover:text-foreground"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                  <User className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-left text-sm">{user?.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-xs text-muted-foreground">
                {t('nav.role')}: {role}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                {t('nav.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-9 w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-emerald-400"
            aria-label={`WhatsApp ${WHATSAPP_DISPLAY}`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center">
              <WhatsAppGlyph className="h-4 w-4 text-emerald-500" />
            </span>
            <span className="min-w-0 flex-1 truncate text-left tabular-nums tracking-tight">
              {WHATSAPP_DISPLAY}
            </span>
          </a>
        </div>

        {/* Mobile toggle */}
        <div className="flex flex-col items-end gap-1.5 md:hidden">
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X /> : <Menu />}
            </Button>
          </div>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-9 w-full max-w-[220px] items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-emerald-400"
            aria-label={`WhatsApp ${WHATSAPP_DISPLAY}`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center">
              <WhatsAppGlyph className="h-4 w-4 text-emerald-500" />
            </span>
            <span className="min-w-0 flex-1 truncate text-left tabular-nums tracking-tight">
              {WHATSAPP_DISPLAY}
            </span>
          </a>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t bg-card p-4 md:hidden">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${isActive(link.to) ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' : 'text-muted-foreground'
                }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 mt-2 text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            {t('nav.signOut')}
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
