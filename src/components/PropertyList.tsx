import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { getProperties, deleteProperty, updateProperty } from '@/lib/properties';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, BedDouble, Bath, Square, Eye, Edit, Trash2, Heart, Users, Search, Share2 } from 'lucide-react';
import type { Property } from '@/types/property';
import { toast } from 'sonner';
import { usePdfShare } from '@/hooks/usePdfShare';
import PropertyInterests from '@/components/PropertyInterests';
import { addInterest, checkUserInterest, getUserInterests, removeInterestByUserAndProperty } from '@/lib/interests';
import { notifyLeadConnectorPropertyInterest } from '@/lib/propertyInterestWebhook';
import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';

interface PropertyListProps {
  onEdit?: (property: Property) => void;
  onView?: (property: Property) => void;
  adminMode?: boolean;
  showAdminActions?: boolean;
}

export const PropertyList = forwardRef<
  { refreshProperties: () => void },
  PropertyListProps
>(({ onEdit, onView, adminMode = false, showAdminActions = false }, ref) => {
  const { t, i18n } = useTranslation();
  const { user, role } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [priceRange, setPriceRange] = useState<number[]>([0, 1000000]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [interestsDialogOpen, setInterestsDialogOpen] = useState(false);
  const [selectedPropertyForInterests, setSelectedPropertyForInterests] = useState<Property | null>(null);
  const [userInterests, setUserInterests] = useState<Set<string>>(new Set());
  const [loadingInterests, setLoadingInterests] = useState<Set<string>>(new Set());
  const { shareProperty, isGenerating } = usePdfShare();

  useEffect(() => {
    loadProperties();
  }, []);

  useImperativeHandle(ref, () => ({
    refreshProperties: loadProperties
  }));

  const loadProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await getProperties();
      if (error) throw error;

      setProperties(data || []);
    } catch (err: any) {
      setError(err.message);
      toast.error(t('uiFixes.propertyLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusUpdate = async (propertyId: string, newStatus: string) => {
    try {
      const { error } = await updateProperty(propertyId, { status: newStatus as any });
      if (error) throw new Error(typeof error === 'string' ? error : 'Error desconocido');
      
      toast.success(t('uiFixes.propertyStatusSaved'));
      
      // Update local state without full reload
      setProperties(prev => prev.map(p => 
        p.id === propertyId ? { ...p, status: newStatus as any } : p
      ));
    } catch (err: any) {
      toast.error(t('uiFixes.propertyStatusFailed'));
    }
  };

  const handleDelete = async () => {
    if (!propertyToDelete) return;

    try {
      const { error } = await deleteProperty(propertyToDelete.id);
      if (error) throw error;

      toast.success(t('uiFixes.propertyDeleted'));
      setDeleteDialogOpen(false);
      loadProperties();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleViewInterests = (property: Property) => {
    setSelectedPropertyForInterests(property);
    setInterestsDialogOpen(true);
    loadUserInterests();
  };

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

  const handleToggleInterest = async (property: Property) => {
    if (!user || user.role === 'admin') {
      toast.error(t('dashboard.adminNoInterest'));
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
        const { error } = await addInterest(property.id, user.id, 'Interesado en esta propiedad');
        if (error) {
          if (error.message.includes('Ya has mostrado interés')) {
            toast.error(t('dashboard.alreadyInterested'));
            // Sincronizar el estado local
            setUserInterests(prev => new Set(prev).add(property.id));
          } else {
            // Si el error es por tabla no existente, lo ignoramos
            if (error.message.includes('Not Acceptable') || error.message.includes('406')) {
              console.log('📝 Tabla property_interests no existe, simulando interés en PropertyList');
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

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];

    return matchesSearch && matchesStatus && matchesPrice;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    } else if (sortBy === 'price_asc') {
      return a.price - b.price;
    } else if (sortBy === 'price_desc') {
      return b.price - a.price;
    }
    return 0;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'on_sale': return 'bg-yellow-500';
      case 'sold': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return t('properties.list.status.available');
      case 'on_sale': return t('properties.list.status.onSale');
      case 'sold': return t('properties.list.status.sold');
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(i18n.resolvedLanguage === 'es' ? 'es-US' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">{t('properties.list.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            {t('properties.list.title')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('properties.list.total', { count: filteredProperties.length })}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('properties.list.filters.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={t('properties.list.filters.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="min-w-[150px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('properties.list.filters.status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('properties.list.filters.all')}</SelectItem>
                    <SelectItem value="available">{t('properties.list.filters.available')}</SelectItem>
                    <SelectItem value="on_sale">{t('properties.list.filters.onSale')}</SelectItem>
                    <SelectItem value="sold">{t('properties.list.filters.sold')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[170px]">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('uiFixes.sortBy')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t('uiFixes.sortNewest')}</SelectItem>
                    <SelectItem value="price_asc">{t('uiFixes.sortLow')}</SelectItem>
                    <SelectItem value="price_desc">{t('uiFixes.sortHigh')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 max-w-xl">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-muted-foreground">{t('uiFixes.priceRange')}</span>
                <span className="text-primary font-bold">
                  {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
                </span>
              </div>
              <Slider
                min={0}
                max={5000000}
                step={10000}
                value={priceRange}
                onValueChange={(val) => setPriceRange(val)}
                className="cursor-pointer"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Tarjetas de Propiedades */}
      <div className="space-y-4">
        {filteredProperties.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
            <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">{t('properties.list.noProperties')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProperties.map((property) => {
              const mainImage = property.property_images?.find(img => img.is_primary)?.url ||
                property.property_images?.[0]?.url ||
                property.image_url ||
                '/inventory-bg.png';

              return (
                <Card key={property.id} id={`property-card-${property.id}`} className="group overflow-hidden border-0 shadow-sm hover:shadow-2xl transition-all duration-500 rounded-3xl bg-card/50 backdrop-blur-sm">
                  {/* Imagen de la propiedad */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={mainImage}
                      alt={property.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Overlay Gradients */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent opacity-40" />

                    {/* Badge / Selector de estado */}
                    <div className="absolute top-4 right-4 z-10 w-36 flex justify-end">
                      {showAdminActions && role === 'admin' ? (
                        <Select 
                          value={property.status} 
                          onValueChange={(val) => handleQuickStatusUpdate(property.id, val)}
                        >
                          <SelectTrigger className={`h-8 border-0 shadow-lg text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md focus:ring-0 ${
                            property.status === 'available' ? 'bg-emerald-500/90' :
                            property.status === 'on_sale' ? 'bg-amber-500/90' :
                            'bg-red-500/90'
                          }`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">{t('properties.list.status.available')}</SelectItem>
                            <SelectItem value="on_sale">{t('properties.list.status.onSale')}</SelectItem>
                            <SelectItem value="sold">{t('properties.list.status.sold')}</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={`px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-lg border-0 backdrop-blur-md ${property.status === 'available' ? 'bg-emerald-500/90 text-white' :
                          property.status === 'on_sale' ? 'bg-amber-500/90 text-white' :
                            'bg-red-500/90 text-white'
                          }`}>
                          {getStatusText(property.status)}
                        </Badge>
                      )}
                    </div>


                    {/* Price Tag Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <div className="text-white">
                        <p className="text-2xl font-black font-[Montserrat] leading-none drop-shadow-md">
                          {formatCurrency(property.price)}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 drop-shadow-sm">
                          {t('properties.list.sqft')}: {property.sqft}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contenido de la tarjeta */}
                  <CardContent className="p-6 space-y-5">
                    {/* Título y ubicación */}
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-xl leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                        {property.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <p className="text-xs font-medium line-clamp-1">
                          {property.address}, {property.city}
                        </p>
                      </div>
                    </div>

                    {/* Características Grid */}
                    <div className="grid grid-cols-3 gap-2 py-4 border-y border-border/50">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5 text-primary">
                          <BedDouble className="w-4 h-4" />
                          <span className="text-sm font-bold">{property.bedrooms}</span>
                        </div>
                        <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/70">{t('properties.list.bed')}</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 border-x border-border/50 px-2">
                        <div className="flex items-center gap-1.5 text-primary">
                          <Bath className="w-4 h-4" />
                          <span className="text-sm font-bold">{property.bathrooms}</span>
                        </div>
                        <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/70">{t('properties.list.bath')}</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5 text-primary">
                          <Square className="w-4 h-4" />
                          <span className="text-sm font-bold">{property.sqft}</span>
                        </div>
                        <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/70">ft²</span>
                      </div>
                    </div>

                    {/* Rent & ARV Highlights */}
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground/60">{t('properties.list.labels.rent')}</span>
                        <p className="text-sm font-black text-emerald-600">{formatCurrency(property.monthly_rent)} {t('uiFixes.perMonth')}</p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <span className="text-muted-foreground/60">ARV</span>
                        <p className="text-sm font-black text-primary">{formatCurrency(property.arv)}</p>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center gap-1 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-shrink-0 px-2.5 h-11 rounded-xl font-bold shadow-md gold-gradient transition-all hover:shadow-xl active:scale-95 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onView?.(property);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        {t('properties.list.actions.view')}
                      </Button>

                      {/* Botón de compartir - Para todos */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 flex-shrink-0 rounded-xl hover:bg-primary/5 hover:border-primary/20 transition-all group/share"
                        onClick={async (e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          void shareProperty(property);
                        }}
                        disabled={isGenerating}
                      >
                        <Share2 className={`w-5 h-5 text-muted-foreground group-hover/share:text-primary transition-all ${isGenerating ? 'animate-pulse' : ''}`} />
                      </Button>

                      {/* Botón de interés para usuarios */}
                      {user && user.role !== 'admin' && property.status === 'available' && !adminMode && (
                        <Button
                          variant={userInterests.has(property.id) ? "secondary" : "outline"}
                          size="icon"
                          className={`h-11 w-11 flex-shrink-0 rounded-xl transition-all ${userInterests.has(property.id)
                            ? 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100'
                            : 'hover:border-red-200 hover:bg-red-50 group/heart'
                            }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleToggleInterest(property);
                          }}
                          disabled={loadingInterests.has(property.id)}
                        >
                          <Heart className={`w-5 h-5 transition-all ${userInterests.has(property.id)
                            ? 'fill-current scale-110'
                            : 'group-hover/heart:text-red-500 group-hover/heart:scale-110'
                            }`} />
                        </Button>
                      )}

                      {/* Botones de admin */}
                      {showAdminActions && role === 'admin' && (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 flex-shrink-0 rounded-xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onEdit?.(property);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-11 w-11 flex-shrink-0 rounded-xl shadow-lg shadow-red-500/10"
                            onClick={(e) => {
                              console.log('Delete button clicked for:', property.id);
                              e.preventDefault();
                              e.stopPropagation();
                              setPropertyToDelete(property);
                              setTimeout(() => setDeleteDialogOpen(true), 0);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('properties.list.delete.title')}</DialogTitle>
            <DialogDescription>
              {t('properties.list.delete.description', { title: propertyToDelete?.title })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('properties.list.delete.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('properties.list.delete.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Intereses */}
      <Dialog open={interestsDialogOpen} onOpenChange={setInterestsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              {t('properties.interests.title')}
            </DialogTitle>
          </DialogHeader>
          {selectedPropertyForInterests && (
            <PropertyInterests
              propertyId={selectedPropertyForInterests.id}
              propertyTitle={selectedPropertyForInterests.title}
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
});

PropertyList.displayName = 'PropertyList';
