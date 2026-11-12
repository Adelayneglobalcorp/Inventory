import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getProperties } from '@/lib/properties';
import PropertyDetail from '@/components/properties/PropertyDetail';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Heart, Plus, TrendingUp, Home, Building2, BarChart3, Users, DollarSign, CheckCircle, ShoppingBag, Clock } from 'lucide-react';
import { addInterest, checkUserInterest, removeInterestByUserAndProperty, getUserInterests } from '@/lib/interests';
import { notifyLeadConnectorPropertyInterest } from '@/lib/propertyInterestWebhook';
import type { Property } from '@/types/property';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { usePortalContent } from '@/lib/portalContent';

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const portal = usePortalContent('dashboard', i18n.language.startsWith('en') ? 'en' : 'es');
  const { user, role, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [userInterests, setUserInterests] = useState<Set<string>>(new Set());
  const [loadingInterests, setLoadingInterests] = useState<Set<string>>(new Set());

  console.log('🔍 Dashboard - User:', user?.email);
  console.log('🔍 Dashboard - Role:', role);
  console.log('🔍 Dashboard - Auth loading:', authLoading);
  console.log('🔍 Dashboard - Role === admin:', role === 'admin');

  const handleViewProperty = (property: Property) => {
    console.log('🔍 Dashboard: Viewing property:', property);
    setSelectedProperty(property);
  };

  // Cargar intereses del usuario
  const loadUserInterests = async () => {
    if (!user || user.role === 'admin') return;

    try {
      const { error, data } = await getUserInterests(user.id);
      if (!error && data) {
        const interestIds = new Set(data.map(interest => interest.property_id));
        setUserInterests(interestIds);
      }
    } catch (err) {
      console.error('❌ Error loading user interests:', err);
    }
  };

  // Manejar agregar/quitar interés (toggle)
  const handleToggleInterest = async (property: Property) => {
    if (!user || user.role === 'admin') {
      toast.error(t('dashboard.adminNoInterest')); // Note: need to add this key or use a default
      return;
    }

    setLoadingInterests(prev => new Set(prev).add(property.id));

    try {
      if (userInterests.has(property.id)) {
        // Quitar interés
        const { error } = await removeInterestByUserAndProperty(user.id, property.id);
        if (error) {
          toast.error(t('dashboard.errorRemoveInterest') + error.message);
        } else {
          toast.success(t('dashboard.interestRemoved'));
          setUserInterests(prev => {
            const newSet = new Set(prev);
            newSet.delete(property.id);
            return newSet;
          });
        }
      } else {
        // Agregar interés
        const { error } = await addInterest(property.id, user.id, t('dashboard.interestedInProperty'));
        if (error) {
          if (error.message.includes('Ya has mostrado interés')) {
            toast.error(t('dashboard.alreadyInterested'));
            // Sincronizar el estado local
            setUserInterests(prev => new Set(prev).add(property.id));
          } else {
            // Si el error es por tabla no existente, lo ignoramos
            if (error.message.includes('Not Acceptable') || error.message.includes('406')) {
              console.log('📝 Tabla property_interests no existe, simulando interés en Dashboard');
              toast.success(t('dashboard.interestSuccess'));
              setUserInterests(prev => new Set(prev).add(property.id));
              void notifyLeadConnectorPropertyInterest(property, user);
            } else {
              toast.error(t('dashboard.errorAddInterest') + error.message);
            }
          }
        } else {
          toast.success(t('dashboard.interestSuccess'));
          setUserInterests(prev => new Set(prev).add(property.id));
          void notifyLeadConnectorPropertyInterest(property, user);
        }
      }
    } catch (err) {
      toast.error(t('dashboard.errorGenericInterest'));
    } finally {
      setLoadingInterests(prev => {
        const newSet = new Set(prev);
        newSet.delete(property.id);
        return newSet;
      });
    }
  };

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const { data, error } = await getProperties();
        if (error) throw error;
        setProperties(data || []);
      } catch (error) {
        console.error('Error loading properties:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
    loadUserInterests();
  }, [user]);

  const stats = useMemo(() => {
    if (loading || properties.length === 0) {
      return {
        total: 0,
        available: 0,
        onSale: 0,
        sold: 0,
        totalValue: 0,
        avgRoi: 0,
        totalArv: 0
      };
    }

    const total = properties.length;
    const available = properties.filter((p) => p.status === 'available').length;
    const onSale = properties.filter((p) => p.status === 'on_sale').length;
    const sold = properties.filter((p) => p.status === 'sold').length;
    const totalValue = properties.reduce((sum, p) => sum + p.price, 0);
    const avgRoi = properties.reduce((sum, p) => sum + p.roi, 0) / total;
    const totalArv = properties.reduce((sum, p) => sum + p.arv, 0);

    return { total, available, onSale, sold, totalValue, avgRoi, totalArv };
  }, [properties, loading]);

  const fmt = (n: number) =>
    new Intl.NumberFormat(i18n.resolvedLanguage === 'es' ? 'es-US' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const statCards = [
    { title: t('dashboard.stats.totalProperties'), value: stats.total, icon: Building2, color: 'text-gold-500' },
    { title: t('dashboard.stats.available'), value: stats.available, icon: CheckCircle, color: 'text-emerald-400' },
    { title: t('dashboard.stats.onSale'), value: stats.onSale, icon: ShoppingBag, color: 'text-amber-400' },
    { title: t('dashboard.stats.sold'), value: stats.sold, icon: Clock, color: 'text-red-400' },
    { title: t('dashboard.stats.portfolioValue'), value: fmt(stats.totalValue), icon: DollarSign, color: 'text-gold-500' },
    { title: t('dashboard.stats.totalArv'), value: fmt(stats.totalArv), icon: DollarSign, color: 'text-emerald-400' },
  ];


  const quickLinks = [
    { to: '/properties', label: t('nav.properties'), icon: Building2 },
    { to: '/calculator', label: t('nav.calculator'), icon: BarChart3 },
    { to: '/deals', label: t('nav.deals'), icon: TrendingUp },
    { to: '/project-manager', label: t('nav.projectManager'), icon: Home },
    { to: '/financing', label: t('nav.financing'), icon: DollarSign },
  ];

  return (
    <div className="space-y-7 pb-8">
      <section className="relative isolate overflow-hidden rounded-[28px] border border-gold-500/20 bg-gradient-to-br from-[#112e50] via-[#0a1e38] to-[#07162c] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.2)] sm:p-8 lg:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-36 h-96 w-96 rounded-full border border-gold-400/10 bg-gold-500/[0.07] blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-8 h-40 w-40 rounded-full bg-blue-400/[0.07] blur-3xl" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-7 rounded-full bg-gold-400" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">GLOBAL 360 <span className="text-white/60">/ FIX &amp; FLIP</span></span>
            </div>
            <div>
              <h1 className="font-[Montserrat] text-3xl font-bold tracking-tight text-white sm:text-4xl">{portal('title', t('dashboard.title'))}</h1>
              <p className="mt-3 max-w-2xl break-words text-sm leading-relaxed text-slate-300 sm:text-base">
                {portal('subtitle', t('dashboard.welcome', { name: user?.user_metadata?.full_name || user?.email }))}
              </p>
            </div>
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/10 px-3 py-1.5 text-xs font-medium text-gold-300">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
              {t('nav.role')}: {t(`roles.${role}`, { defaultValue: role || '' })}
            </div>
          </div>
          <Link to="/properties" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-gold-400 px-5 text-sm font-bold text-[#13213a] shadow-[0_10px_30px_rgba(234,179,8,0.14)] transition-all hover:-translate-y-0.5 hover:bg-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:self-end">
            <Building2 className="h-4 w-4" />
            {t('nav.properties')}
          </Link>
        </div>
      </section>

      <section aria-label={portal('title', t('dashboard.title'))} className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="h-6 w-1 rounded-full bg-gold-400" aria-hidden="true" />
          <h2 className="font-[Montserrat] text-lg font-semibold tracking-tight text-foreground sm:text-xl">{portal('title', t('dashboard.title'))}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat, index) => (
            <Card key={stat.title} className="group relative min-w-0 overflow-hidden rounded-2xl border-white/[0.08] bg-[#192840]/90 shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition-all duration-200 hover:-translate-y-1 hover:border-gold-400/25 hover:shadow-[0_20px_42px_rgba(0,0,0,0.2)]">
              <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-gold-400/60 via-gold-400/10 to-transparent opacity-70" />
              <CardContent className="flex min-h-[132px] items-center justify-between gap-3 px-5 py-6">
                <div className="min-w-0 space-y-4">
                  <p className="max-w-[230px] text-xs font-medium leading-snug text-slate-300 sm:text-sm">{stat.title}</p>
                  <p className="break-words text-2xl font-bold tracking-tight text-white tabular-nums sm:text-3xl">{loading ? '—' : stat.value}</p>
                </div>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] sm:h-14 sm:w-14 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="h-6 w-1 rounded-full bg-gold-400" aria-hidden="true" />
          <h2 className="font-[Montserrat] text-lg font-semibold tracking-tight text-foreground sm:text-xl">{t('nav.dashboard')}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {quickLinks.map((item) => (
            <Link key={item.to} to={item.to} className="group flex min-h-[116px] min-w-0 flex-col items-start justify-between gap-4 rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-gold-400/35 hover:bg-[#1b2b45] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold-400/20 bg-gold-400/10 text-gold-400 transition-colors group-hover:bg-gold-400/20">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="min-w-0 break-words text-sm font-semibold leading-snug text-foreground group-hover:text-gold-300">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="h-6 w-1 rounded-full bg-gold-400" aria-hidden="true" />
            <h2 className="font-[Montserrat] text-lg font-semibold tracking-tight text-foreground sm:text-xl">{t('dashboard.recentProperties')}</h2>
          </div>
          <Link to="/properties" className="inline-flex items-center gap-2 rounded-lg border border-gold-400/25 bg-gold-400/10 px-3 py-2 text-xs font-semibold text-gold-300 transition-colors hover:bg-gold-400/20">
            {t('nav.properties')}
            <Building2 className="h-4 w-4" />
          </Link>
        </div>
        <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/85 shadow-[0_14px_48px_rgba(0,0,0,0.12)]">
          <CardContent className="p-3 sm:p-5">
            <div className="space-y-3">
              {loading ? (
                <div className="rounded-xl border border-border/60 bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">{t('dashboard.loading')}</div>
              ) : properties.length > 0 ? (
                properties.slice(0, 5).map((p) => {
                  const primaryImage = p.property_images?.find((img: any) => img.is_primary) || p.property_images?.[0];
                  const imageUrl = primaryImage?.url || p.image_url;
                  return (
                    <div key={p.id} className="flex flex-col gap-4 rounded-xl border border-border/70 bg-background/25 p-3 transition-all duration-200 hover:border-gold-400/20 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                      <div className="flex min-w-0 items-center gap-4">
                        {imageUrl ? (
                          <img src={imageUrl} alt={p.title} className="h-20 w-24 shrink-0 rounded-xl object-cover ring-1 ring-white/10 sm:h-[76px] sm:w-[112px]" />
                        ) : (
                          <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/50 text-gold-400 sm:h-[76px] sm:w-[112px]">
                            <Building2 className="h-8 w-8" aria-hidden="true" />
                          </div>
                        )}
                        <div className="min-w-0 space-y-2">
                          <p className="break-words text-sm font-semibold text-white sm:text-base">{p.title}</p>
                          <p className="text-xs text-muted-foreground">{p.city}, {p.state}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                        <p className="text-base font-bold text-gold-300 tabular-nums">{fmt(p.price)}</p>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewProperty(p)} className="h-9 rounded-lg px-3" aria-label={t('nav.properties')} title={t('nav.properties')}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user && user.role !== 'admin' && p.status === 'available' && (
                            <Button variant={userInterests.has(p.id) ? 'secondary' : 'outline'} size="sm" onClick={() => handleToggleInterest(p)} disabled={loadingInterests.has(p.id)} className="h-9 rounded-lg px-3">
                              <Heart className={`h-4 w-4 ${userInterests.has(p.id) ? 'fill-current' : ''}`} />
                              {userInterests.has(p.id) ? t('dashboard.interested') : t('dashboard.interest')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-400">
                    <Building2 className="h-7 w-7" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('dashboard.noProperties')}</p>
                  <Link to="/properties" className="rounded-lg border border-gold-400/25 px-4 py-2 text-sm font-medium text-gold-300 transition-colors hover:bg-gold-400/10">{t('nav.properties')}</Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <PropertyDetail property={selectedProperty} open={!!selectedProperty} onClose={() => setSelectedProperty(null)} />
    </div>
  );
};

export default Dashboard;
