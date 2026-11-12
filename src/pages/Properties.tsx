import { useState } from 'react';
import PropertyDetail from '@/components/properties/PropertyDetail';
import { PropertyList } from '@/components/PropertyList';
import type { Property } from '@/types/property';
import { useTranslation } from 'react-i18next';
import { usePortalContent } from '@/lib/portalContent';

const Properties = () => {
  const { t, i18n } = useTranslation();
  const portal = usePortalContent('inventory', i18n.language.startsWith('en') ? 'en' : 'es');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleViewProperty = (property: Property) => {
    console.log('🔍 Viewing property:', property);
    setSelectedProperty(property);
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="g360-section-header relative overflow-hidden rounded-[26px] border border-[#d4aa56]/20 bg-gradient-to-br from-[#183958] via-[#0c2440] to-[#07182f] p-6 shadow-[0_18px_55px_rgba(0,0,0,.15)] sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border border-[#f0bf52]/10 bg-[#edbf52]/[.05] blur-2xl" />
        <div className="relative">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[.22em] text-[#e7bf63]">Global 360 <span className="text-slate-300/65">/ Inventory</span></p>
          <h1 className="font-[Montserrat] text-2xl font-bold tracking-tight text-white sm:text-3xl">{portal('title', t('properties.title'))}</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-200/80 sm:text-base">{portal('subtitle', t('properties.subtitle'))}</p>
        </div>
      </header>

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
