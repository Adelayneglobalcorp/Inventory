import type { Property } from '@/types/property';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BedDouble, Bath, Ruler, TrendingUp, DollarSign, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const statusConfig = {
  available: { label: 'Available', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  on_sale: { label: 'On Sale', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  sold: { label: 'Sold', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
}

const PropertyCard = ({ property, onClick }: PropertyCardProps) => {
  const { t, i18n } = useTranslation();
  const status = statusConfig[property.status];
  const statusLabel = property.status === 'available' ? t('properties.list.status.available') : property.status === 'on_sale' ? t('properties.list.status.onSale') : t('properties.list.status.sold');

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat(i18n.resolvedLanguage === 'es' ? 'es-US' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <Card
      className="group cursor-pointer overflow-hidden border transition-all hover:shadow-lg hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={property.image_url || '/inventory-bg.png'}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <Badge className={`absolute left-3 top-3 ${status.className}`}>{statusLabel}</Badge>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-2xl font-bold text-white">{formatCurrency(property.price)}</p>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="mb-1 text-lg font-semibold font-[Montserrat] line-clamp-1">{property.title}</h3>
        <p className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {property.address}, {property.city}, {property.state}
        </p>

        <div className="mb-3 grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <BedDouble className="h-4 w-4" /> {property.bedrooms} {t('uiFixes.bedroomsShort')}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Bath className="h-4 w-4" /> {property.bathrooms} {t('uiFixes.bathroomsShort')}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Ruler className="h-4 w-4" /> {property.sqft.toLocaleString(i18n.resolvedLanguage === 'es' ? 'es-US' : 'en-US')} ft²
          </div>
        </div>

        <div className="flex items-center border-t pt-3">
          <div className="flex items-center gap-1 text-sm">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="font-medium">ARV:</span>
            <span className="font-semibold text-primary">{formatCurrency(property.arv)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;
