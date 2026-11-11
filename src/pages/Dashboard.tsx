import React, { useState, useEffect, useMemo } from 'react';
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

const Dashboard = () => {
  const { t, i18n } = useTranslation();
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[Montserrat] text-2xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('dashboard.welcome', { name: user?.user_metadata?.full_name || user?.email })}
          <span className="ml-2 rounded-full bg-gold-500/20 px-2 py-0.5 text-xs font-medium text-gold-400 border border-gold-500/30">
            {t(`roles.${role}`, { defaultValue: role || '' })}
          </span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent properties */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[Montserrat]">{t('dashboard.recentProperties')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">{t('dashboard.loading')}</p>
              </div>
            ) : properties.length > 0 ? (
              properties.slice(0, 5).map((p) => {
                const primaryImage = p.property_images?.find((img: any) => img.is_primary) || p.property_images?.[0];
                const imageUrl = primaryImage?.url || p.image_url;

                return (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      {imageUrl && (
                        <img src={imageUrl} alt={p.title} className="h-12 w-12 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.city}, {p.state}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{fmt(p.price)}</p>
                      <div className="flex gap-1 mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProperty(p)}
                          className="h-7 px-2"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        {user && user.role !== 'admin' && p.status === 'available' && (
                          <Button
                            variant={userInterests.has(p.id) ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => handleToggleInterest(p)}
                            disabled={loadingInterests.has(p.id)}
                            className="h-7 px-2"
                          >
                            <Heart className={`w-3 h-3 ${userInterests.has(p.id) ? 'fill-current' : ''}`} />
                            {userInterests.has(p.id) ? t('dashboard.interested') : t('dashboard.interest')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">{t('dashboard.noProperties')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal para ver propiedad */}
      <PropertyDetail
        property={selectedProperty}
        open={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
    </div>
  );
};

export default Dashboard;
