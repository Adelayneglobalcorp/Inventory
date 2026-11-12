import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Phone, Mail, Calendar, CheckCircle, XCircle, Clock, Users, Building2, MapPin } from 'lucide-react';
import { getAllInterests, updateInterestStatus } from '@/lib/interests';
import type { InterestWithDetails, InterestStatus } from '@/types/interest';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface PropertyInterestsProps {
  propertyId?: string;
  propertyTitle?: string;
}

const statusConfig = {
  pending: {
    label: 'pending',
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    icon: Clock
  },
  contacted: {
    label: 'contacted',
    className: 'bg-blue-500/10 text-blue-600 border-blue-200',
    icon: MessageCircle
  },
  rejected: {
    label: 'rejected',
    className: 'bg-red-500/10 text-red-600 border-red-200',
    icon: XCircle
  }
};

const PropertyInterests = ({ propertyId, propertyTitle }: PropertyInterestsProps) => {
  const { t, i18n } = useTranslation();
  const [interests, setInterests] = useState<InterestWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Cargar todos los intereses (para admin)
  const loadAllInterests = async () => {
    setLoading(true);
    try {
      const { error, data } = await getAllInterests();
      if (error) {
        toast.error(t('admin.interests.messages.loadingError') + ': ' + error.message);
      } else {
        setInterests(data || []);
      }
    } catch (err) {
      toast.error(t('admin.interests.messages.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  // Actualizar estado de un interés
  const updateStatus = async (interestId: string, newStatus: InterestStatus) => {
    setUpdatingId(interestId);
    try {
      const { error } = await updateInterestStatus(interestId, newStatus);
      if (error) {
        toast.error(t('admin.interests.messages.updateError') + ': ' + error.message);
      } else {
        toast.success(t('admin.interests.messages.updateSuccess'));
        loadAllInterests();
      }
    } catch (err) {
      toast.error(t('admin.interests.messages.updateError'));
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    loadAllInterests();
  }, []);

  const renderInterestCard = (interest: InterestWithDetails) => {
    const status = statusConfig[interest.status];
    const StatusIcon = status.icon;

    // Obtener imagen principal de la propiedad
    const propertyImage = interest.property.property_images?.find(img => img.is_primary)?.url ||
      interest.property.property_images?.[0]?.url ||
      interest.property.image_url ||
      '/inventory-bg.png';

    return (
      <Card key={interest.id} className="border-l-4 border-l-primary/50">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Imagen de la propiedad */}
            <div className="flex-shrink-0">
              <img
                src={propertyImage}
                alt={interest.property.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
            </div>

            {/* Contenido principal */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={interest.user.email} />
                    <AvatarFallback>
                      {interest.user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{interest.user.full_name}</h4>
                    <p className="text-sm text-muted-foreground">{interest.user.email}</p>
                    {interest.user.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {interest.user.phone}
                      </p>
                    )}
                  </div>
                </div>
                <Badge className={status.className} variant="outline">
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {t(`admin.interests.status.${status.label}`)}
                </Badge>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">{interest.property.title}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{interest.property.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{t('admin.interests.registeredOn', { date: new Date(interest.created_at).toLocaleDateString(i18n.resolvedLanguage === 'es' ? 'es-US' : 'en-US') })}</span>
                </div>
                {interest.notes && (
                  <p className="text-sm bg-muted p-2 rounded">
                    "{interest.notes.startsWith('dashboard.') ? t(interest.notes) : interest.notes}"
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {interest.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateStatus(interest.id, 'contacted')}
                      disabled={updatingId === interest.id}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {t('admin.interests.actions.contact')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(interest.id, 'rejected')}
                      disabled={updatingId === interest.id}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      {t('admin.interests.actions.reject')}
                    </Button>
                  </>
                )}
                {interest.status === 'contacted' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(interest.id, 'pending')}
                    disabled={updatingId === interest.id}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    {t('admin.interests.actions.markPending')}
                  </Button>
                )}
                {interest.status === 'rejected' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(interest.id, 'pending')}
                    disabled={updatingId === interest.id}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    {t('admin.interests.actions.reconsider')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Heart className="h-5 h-5 text-red-500" />
        <h3 className="text-lg font-semibold">
          {t('admin.interests.title')}
        </h3>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">{t('admin.interests.loading')}</p>
        </div>
      ) : interests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-semibold mb-2">{t('admin.interests.empty.title')}</h4>
            <p className="text-muted-foreground">
              {t('admin.interests.empty.description')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {interests.map(renderInterestCard)}
        </div>
      )}
    </div>
  );
};

export default PropertyInterests;
