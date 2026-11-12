import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PropertyFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  typeFilter: string;
  onTypeChange: (v: string) => void;
  sortBy: string;
  onSortChange: (v: string) => void;
}

const PropertyFilters = ({
  search, onSearchChange,
  statusFilter, onStatusChange,
  typeFilter, onTypeChange,
  sortBy, onSortChange,
}: PropertyFiltersProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('uiFixes.propertyFilterSearch')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder={t('uiFixes.propertyFilterStatus')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('uiFixes.propertyFilterAllStatuses')}</SelectItem>
          <SelectItem value="available">{t('properties.list.status.available')}</SelectItem>
          <SelectItem value="on_sale">{t('properties.list.status.onSale')}</SelectItem>
          <SelectItem value="sold">{t('properties.list.status.sold')}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={onTypeChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={t('uiFixes.propertyFilterType')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('uiFixes.propertyFilterAllTypes')}</SelectItem>
          <SelectItem value="Single Family">{t('uiFixes.typeSingleFamily')}</SelectItem>
          <SelectItem value="Multi Family">{t('uiFixes.typeMultiFamily')}</SelectItem>
          <SelectItem value="Condo">{t('uiFixes.typeCondo')}</SelectItem>
          <SelectItem value="Townhouse">{t('uiFixes.typeTownhouse')}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder={t('uiFixes.sortBy')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">{t('uiFixes.sortNewest')}</SelectItem>
          <SelectItem value="price_asc">{t('uiFixes.sortLow')}</SelectItem>
          <SelectItem value="price_desc">{t('uiFixes.sortHigh')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default PropertyFilters;
