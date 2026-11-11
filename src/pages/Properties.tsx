import { useState } from 'react';
import PropertyDetail from '@/components/properties/PropertyDetail';
import { PropertyList } from '@/components/PropertyList';
import type { Property } from '@/types/property';
import { useTranslation } from 'react-i18next';

const Properties = () => {
  const { t } = useTranslation();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleViewProperty = (property: Property) => {
    console.log('🔍 Viewing property:', property);
    setSelectedProperty(property);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-[Montserrat] text-2xl font-bold">{t('properties.title')}</h1>
          <p className="max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            {t('properties.subtitle')}
          </p>
        </div>
      </div>

      <PropertyList
        key={refreshKey}
        adminMode={false}
        showAdminActions={false}
        onView={handleViewProperty}
      />

      <PropertyDetail
        property={selectedProperty}
        open={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
    </div>
  );
};

export default Properties;
