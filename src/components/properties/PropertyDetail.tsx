import type { Property } from '@/types/property';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BedDouble, Bath, Ruler, Calendar, DollarSign, TrendingUp, Home, MapPin, ChevronLeft, ChevronRight, Heart, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePdfShare } from '@/hooks/usePdfShare';
import { addInterest, checkUserInterest, removeInterestByUserAndProperty } from '@/lib/interests';
import { notifyLeadConnectorPropertyInterest } from '@/lib/propertyInterestWebhook';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const statusConfig = {
  available: { label: 'Available', className: 'bg-emerald-500/10 text-emerald-600' },
  on_sale: { label: 'On Sale', className: 'bg-amber-500/10 text-amber-600' },
  sold: { label: 'Sold', className: 'bg-red-500/10 text-red-600' },
};

interface PropertyDetailProps {
  property: Property | null;
  open: boolean;
  onClose: () => void;
  id?: string;
  pureContent?: boolean;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const PropertyDetail = ({ property, open, onClose, id, pureContent = false }: PropertyDetailProps) => {
  const { t } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingInterest, setIsAddingInterest] = useState(false);
  const { sharePdf, isGenerating } = usePdfShare();
  const [hasInterest, setHasInterest] = useState(false);
  const { user } = useAuth();

  // Cargar estado del interés cuando se abre el modal
  useEffect(() => {
    if ((open || pureContent) && property) {
      const checkInterestStatus = async () => {
        if (!property || !user || user.role === 'admin') return;

        try {
          const { error, data } = await checkUserInterest(property.id, user.id);
          if (!error) {
            setHasInterest(!!data);
          } else {
            setHasInterest(false);
          }
        } catch (err) {
          console.error('❌ Exception checking interest status:', err);
          setHasInterest(false);
        }
      };

      checkInterestStatus();
    }
  }, [open, pureContent, property, user]);

  // Retornar null si no hay propiedad, pero después de todos los hooks
  if (!property) return null;

  const status = statusConfig[property.status];

  // Obtener imágenes de la propiedad
  const images = property?.property_images || [];
  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[currentImageIndex] : null;
  const imageUrl = currentImage?.url || property?.image_url || '/inventory-bg.png';

  // Manejar agregar/quitar interés (toggle)
  const handleToggleInterest = async () => {
    if (!property || !user || user.role === 'admin') {
      toast.error(t('dashboard.adminNoInterest'));
      return;
    }

    setIsAddingInterest(true);

    try {
      if (hasInterest) {
        // Quitar interés
        const { error } = await removeInterestByUserAndProperty(user.id, property.id);
        if (error) {
          toast.error(t('dashboard.errorRemoveInterest') + error.message);
        } else {
          toast.success(t('properties.list.messages.interestRemoved'));
          setHasInterest(false);
        }
      } else {
        // Agregar interés
        const { error } = await addInterest(property.id, user.id, t('dashboard.interestedInProperty'));
        if (error) {
          if (error.message.includes('Ya has mostrado interés')) {
            toast.error(t('dashboard.alreadyInterested'));
            setHasInterest(true); // Sincronizar el estado local
          } else {
            toast.error(t('dashboard.errorAddInterest') + error.message);
          }
        } else {
          toast.success(t('properties.list.messages.interestAdded'));
          setHasInterest(true);
          void notifyLeadConnectorPropertyInterest(property, user);
        }
      }
    } catch (err) {
      console.error('❌ Exception toggling interest:', err);
      toast.error(t('dashboard.errorAddInterest'));
    } finally {
      setIsAddingInterest(false);
    }
  };

  const nextImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const Content = (
    <div className="flex flex-col" id={id || `property-detail-${property?.id}`}>
      {/* Main Image Section */}
      <div className="relative aspect-video w-full bg-black overflow-hidden group border-b border-border/50">
        <img src={imageUrl} alt={currentImage?.alt_text || property.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <Badge className={`absolute left-4 top-4 px-3 py-1 text-sm font-semibold backdrop-blur-md shadow-lg ${status.className}`}>
          {property.status === 'available' ? t('properties.list.status.available') :
            property.status === 'on_sale' ? t('properties.list.status.onSale') :
              t('properties.list.status.sold')}
        </Badge>

        {/* Navigation Arrows */}
        {hasImages && images.length > 1 && (
          <div data-pdf-ignore="true">
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${index === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Thumbnails Grid Section */}
      {hasImages && (
        <div className="px-6 py-4 bg-muted/10 border-b border-border/50" data-pdf-ignore="true">
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-[180px] overflow-y-auto pr-2 scrollbar-thin">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setCurrentImageIndex(index)}
                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${index === currentImageIndex
                  ? 'border-primary ring-2 ring-primary/30 scale-95 shadow-lg'
                  : 'border-transparent hover:border-primary/40 hover:scale-105'
                  }`}
              >
                <img src={image.url} alt={image.alt_text} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Property Info Details Section */}
      <div className="p-8 space-y-10">
        {/* Main Info Section */}
        <div className="px-6 py-8 space-y-8 flex-1">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 price-display">
            <div className="space-y-2">
              <h3 className="text-5xl font-black text-primary tracking-tighter font-[Montserrat]">{fmt(property.price)}</h3>
              <p className="text-xl font-bold text-muted-foreground/80">{fmt(property.arv)} {t('properties.list.arv')}</p>
            </div>
            <Badge className={`px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] shadow-lg ${status.className}`}>
              {property.status === 'available' ? t('properties.list.status.available') :
                property.status === 'on_sale' ? t('properties.list.status.onSale') :
                  t('properties.list.status.sold')}
            </Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground/90 border-t border-border/40 pt-4">
            {property.title}
          </h2>
        </div>

        {/* Icons List - Matching user's request for "Full Info" */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
          {/* Basic Specs */}
          <div className="flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors">
              <BedDouble className="h-5 w-5 text-primary" />
            </div>
            <span className="text-base font-bold text-foreground/80">
              {property.bedrooms} {t('properties.list.beds')}
            </span>
          </div>

          <div className="flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors">
              <Bath className="h-5 w-5 text-primary" />
            </div>
            <span className="text-base font-bold text-foreground/80">
              {property.bathrooms} {t('properties.list.baths')}
            </span>
          </div>

          <div className="flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors">
              <Ruler className="h-5 w-5 text-primary" />
            </div>
            <span className="text-base font-bold text-foreground/80">
              {property.sqft} {t('properties.list.sqft')}²
            </span>
          </div>

          <div className="flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <span className="text-base font-bold text-foreground/80">{property.year_built}</span>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3 group lg:col-span-2">
            <div className="p-2.5 rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors mt-0.5">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-foreground/80 leading-tight">{property.address}</span>
              <span className="text-sm font-medium text-muted-foreground">
                {property.city}, {property.state} {property.zip_code}
              </span>
            </div>
          </div>

          {/* Financials Highlights */}
          <div className="flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-base font-bold text-foreground/80">
              {fmt(property.monthly_rent)} <span className="text-muted-foreground/60 font-medium">{t('properties.list.rent')}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <span className="text-base font-bold text-foreground/80">{property.property_type}</span>
          </div>
        </div>

        {/* Description Section */}
        <div className="space-y-4 pt-6 border-t border-border/40">
          <h4 className="text-2xl font-extrabold text-foreground">{t('admin.properties.form.fields.description')}</h4>
          <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium">
            {property.description}
          </p>
        </div>

        {/* PDF ONLY GALLERY - Hidden in UI, visible in PDF */}
        {hasImages && images.length > 1 && (
          <div className="hidden pt-10 border-t border-border/40" data-pdf-only="true">
            <h4 className="text-2xl font-extrabold text-foreground mb-6">Galería de Fotos</h4>
            <div className="grid grid-cols-2 gap-4">
              {images.slice(1).map((image, idx) => (
                <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-border/50">
                  <img src={image.url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons Section */}
        <div className="pt-8 pb-4 flex flex-col sm:flex-row gap-4 action-buttons" data-pdf-ignore="true">
          {/* Share Button - Visible to everyone */}
          <Button
            variant="outline"
            className="flex-1 gap-4 h-20 text-2xl font-black rounded-3xl border-2 border-primary/20 hover:bg-primary/5 transition-all hover:scale-[1.02] active:scale-95"
            onClick={() => sharePdf(id || `property-detail-${property.id}`, property.title)}
            disabled={isGenerating}
          >
            <Share2 className={`h-8 w-8 text-primary ${isGenerating ? 'animate-pulse' : ''}`} />
            {isGenerating ? t('properties.list.actions.sharing') : t('properties.list.actions.share')}
          </Button>

          {/* Interest Button (only for users and available properties) */}
          {user && user.role !== 'admin' && property.status === 'available' && (
            <Button
              variant={hasInterest ? "secondary" : "default"}
              className={`flex-1 gap-4 h-20 text-2xl font-black rounded-3xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95 ${!hasInterest ? 'gold-gradient' : 'bg-muted hover:bg-muted/80'}`}
              onClick={handleToggleInterest}
              disabled={isAddingInterest}
            >
              <Heart className={`h-8 w-8 transition-all ${hasInterest ? 'fill-red-500 text-red-500' : ''}`} />
              {hasInterest ? t('properties.list.actions.removeInterest') : t('properties.list.actions.interest')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (pureContent) {
    return Content;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 shadow-2xl bg-card rounded-2xl">
        {Content}
      </DialogContent>
    </Dialog >
  );
};

export default PropertyDetail;
