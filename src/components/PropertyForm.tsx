import React, { useState } from 'react';
import { Property, PropertyStatus } from '@/types/property';
import { createProperty, updateProperty, uploadPropertyImage, savePropertyImages } from '@/lib/properties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface PropertyFormProps {
  property?: Property;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PropertyForm: React.FC<PropertyFormProps> = ({
  property,
  onSuccess,
  onCancel
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<Array<File | { url: string, name?: string }>>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  // Inject Dropbox script
  React.useEffect(() => {
    if (!document.getElementById('dropboxjs')) {
      const script = document.createElement('script');
      script.src = 'https://www.dropbox.com/static/api/2/dropins.js';
      script.id = 'dropboxjs';
      script.setAttribute('data-app-key', import.meta.env.VITE_DROPBOX_APP_KEY || 'your_app_key_here');
      document.body.appendChild(script);
    }
  }, []);

  const handleDropboxUpload = () => {
    if ((window as any).Dropbox) {
      (window as any).Dropbox.choose({
        success: function (files: any[]) {
          const newImages = files.map(f => ({ url: f.link, name: f.name }));
          setImages(prev => [...prev, ...newImages]);
          setImagePreview(prev => [...prev, ...files.map(f => f.thumbnailLink || f.link)]);
        },
        linkType: "direct",
        multiselect: true,
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      });
    } else {
      console.error("Dropbox API not loaded");
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    title: property?.title || '',
    address: property?.address || '',
    city: property?.city || '',
    state: property?.state || '',
    zip_code: property?.zip_code || '',
    price: property?.price || '' as any,
    arv: property?.arv || '' as any,
    roi: property?.roi || 0,
    bedrooms: property?.bedrooms || '' as any,
    bathrooms: property?.bathrooms || '' as any,
    sqft: property?.sqft || '' as any,
    year_built: property?.year_built || '' as any,
    status: property?.status || 'available' as PropertyStatus,
    property_type: property?.property_type || '',
    description: property?.description || '',
    rehab_cost: property?.rehab_cost || '' as any,
    monthly_rent: property?.monthly_rent || '' as any,
    other_costs: property?.other_costs || '' as any,
    operating_expenses: property?.operating_expenses || '' as any,
    total_investment: property?.total_investment || 0,
    net_profit: property?.net_profit || 0,
    annual_income: property?.annual_income || 0,
    annual_noi: property?.annual_noi || 0,
    cap_rate: property?.cap_rate || 0,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);

    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file as File));
    setImagePreview(prev => [...prev, ...newPreviews]);
  };

  // Automated Calculations
  React.useEffect(() => {
    const price = parseFloat(formData.price as any) || 0;
    const rehab = parseFloat(formData.rehab_cost as any) || 0;
    const other = parseFloat(formData.other_costs as any) || 0;
    const arv = parseFloat(formData.arv as any) || 0;
    const rent = parseFloat(formData.monthly_rent as any) || 0;
    const expenses = parseFloat(formData.operating_expenses as any) || 0;

    // Fix & Flip Calculations
    const total_investment = price + rehab + other;
    const net_profit = arv - total_investment;
    const roi = total_investment > 0 ? (net_profit / total_investment) * 100 : 0;

    // Rental Calculations
    const annual_income = rent * 12;
    const annual_noi = annual_income - (expenses * 12);
    const cap_rate = price > 0 ? (annual_noi / price) * 100 : 0;

    setFormData(prev => ({
      ...prev,
      total_investment,
      net_profit,
      roi: parseFloat(roi.toFixed(2)),
      annual_income,
      annual_noi,
      cap_rate: parseFloat(cap_rate.toFixed(2))
    }));
  }, [formData.price, formData.rehab_cost, formData.other_costs, formData.arv, formData.monthly_rent, formData.operating_expenses]);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create or update property
      let propertyData;
      if (property) {
        const result = await updateProperty(property.id, formData);
        if (result.error) throw new Error(result.error);
        propertyData = result.data;
      } else {
        const result = await createProperty(formData as any);
        if (result.error) throw new Error(result.error);
        propertyData = result.data;
      }

      // Upload images if any
      if (images.length > 0 && propertyData) {
        const uploadedImages = [];

        for (const file of images) {
          if (file instanceof File) {
            const result = await uploadPropertyImage(file, propertyData.id);
            if (result.error) throw new Error(result.error);
            if (result.url) {
              uploadedImages.push({ url: result.url });
            }
          } else {
            // Fetch the image from Dropbox direct link and upload to our Supabase storage
            try {
              const res = await fetch(file.url);
              const blob = await res.blob();
              const tempFile = new File([blob], file.name || 'dropbox_image.jpg', { type: blob.type || 'image/jpeg' });

              const result = await uploadPropertyImage(tempFile, propertyData.id);
              if (result.error) throw new Error(result.error);
              if (result.url) {
                uploadedImages.push({ url: result.url });
              }
            } catch (err) {
              console.error("Error uploading Dropbox image to Supabase:", err);
              throw new Error("No se pudo descargar la imagen de Dropbox para subirla.");
            }
          }
        }

        // Save image references to database
        if (uploadedImages.length > 0) {
          const saveResult = await savePropertyImages(propertyData.id, uploadedImages);
          if (saveResult.error) throw new Error(saveResult.error);
        }
      }

      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{property ? t('admin.properties.form.titleEdit') : t('admin.properties.form.titleNew')}</CardTitle>
        <CardDescription>
          {t('admin.properties.form.description')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">{t('admin.properties.form.tabs.basic')}</TabsTrigger>
              <TabsTrigger value="financial">{t('admin.properties.form.tabs.financial')}</TabsTrigger>
              <TabsTrigger value="media">{t('admin.properties.form.tabs.media')}</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('admin.properties.form.fields.title')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder={t('admin.properties.form.fields.titlePlaceholder')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_type">{t('admin.properties.form.fields.type')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="property_type"
                    value={formData.property_type}
                    onChange={(e) => handleInputChange('property_type', e.target.value)}
                    placeholder={t('admin.properties.form.fields.typePlaceholder')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t('admin.properties.form.fields.address')} <span className="text-red-500">*</span></Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder={t('admin.properties.form.fields.addressPlaceholder')}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">{t('admin.properties.form.fields.city')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder={t('admin.properties.form.fields.city')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">{t('admin.properties.form.fields.state')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder={t('admin.properties.form.fields.state')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">{t('admin.properties.form.fields.zipCode')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => handleInputChange('zip_code', e.target.value)}
                    placeholder="12345"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">{t('admin.properties.form.fields.bedrooms')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', e.target.value === '' ? '' : parseInt(e.target.value))}
                    min="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">{t('admin.properties.form.fields.bathrooms')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    step="0.5"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    min="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sqft">{t('admin.properties.form.fields.sqft')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="sqft"
                    type="number"
                    value={formData.sqft}
                    onChange={(e) => handleInputChange('sqft', e.target.value === '' ? '' : parseInt(e.target.value))}
                    min="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year_built">{t('admin.properties.form.fields.yearBuilt')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="year_built"
                    type="number"
                    value={formData.year_built}
                    onChange={(e) => handleInputChange('year_built', e.target.value === '' ? '' : parseInt(e.target.value))}
                    min="1800"
                    max={new Date().getFullYear() + 5}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('admin.properties.form.fields.description')} <span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder={t('admin.properties.form.fields.descriptionPlaceholder')}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">{t('admin.properties.form.fields.status')}</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">{t('properties.list.status.available')}</SelectItem>
                    <SelectItem value="on_sale">{t('properties.list.status.onSale')}</SelectItem>
                    <SelectItem value="sold">{t('properties.list.status.sold')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-6">
              {/* Manual Inputs Section */}
              <div className="space-y-4">
                <h4 className="font-bold text-primary flex items-center gap-2 text-sm uppercase tracking-wider">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">A</span>
                  {t('admin.properties.form.sections.manualInputs')}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">{t('admin.properties.form.fields.price')} <span className="text-red-500">*</span></Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arv">{t('admin.properties.form.fields.arv')} <span className="text-red-500">*</span></Label>
                    <Input
                      id="arv"
                      type="number"
                      value={formData.arv}
                      onChange={(e) => handleInputChange('arv', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rehab_cost">{t('admin.properties.form.fields.rehab')} <span className="text-red-500">*</span></Label>
                    <Input
                      id="rehab_cost"
                      type="number"
                      value={formData.rehab_cost}
                      onChange={(e) => handleInputChange('rehab_cost', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="other_costs">{t('admin.properties.form.fields.otherCosts')} <span className="text-red-500">*</span></Label>
                    <Input
                      id="other_costs"
                      type="number"
                      value={formData.other_costs}
                      onChange={(e) => handleInputChange('other_costs', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      required
                      placeholder={t('uiFixes.formHoldingCost')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly_rent">{t('admin.properties.form.fields.rent')} <span className="text-red-500">*</span></Label>
                    <Input
                      id="monthly_rent"
                      type="number"
                      value={formData.monthly_rent}
                      onChange={(e) => handleInputChange('monthly_rent', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="operating_expenses">{t('admin.properties.form.fields.operatingExpenses')} <span className="text-red-500">*</span></Label>
                    <Input
                      id="operating_expenses"
                      type="number"
                      value={formData.operating_expenses}
                      onChange={(e) => handleInputChange('operating_expenses', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      required
                      placeholder={t('uiFixes.formOperatingMonthly')}
                    />
                  </div>
                </div>
              </div>

              {/* Fix & Flip Automated Results */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <h4 className="font-bold text-emerald-600 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs">B</span>
                  Fix & Flip (📊 {t('admin.properties.form.sections.fixAndFlip')})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 shadow-inner">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">{t('admin.properties.form.fields.totalInvestment')}</Label>
                    <p className="text-lg font-black text-foreground">${formData.total_investment.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">{t('admin.properties.form.fields.netProfit')}</Label>
                    <p className="text-lg font-black text-emerald-600">${formData.net_profit.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Rental Automated Results */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <h4 className="font-bold text-amber-600 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs">C</span>
                  🏢 {t('admin.properties.form.sections.rent')}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 shadow-inner">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">{t('admin.properties.form.fields.annualIncome')}</Label>
                    <p className="text-lg font-black text-foreground">${formData.annual_income.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">{t('admin.properties.form.fields.annualNoi')}</Label>
                    <p className="text-lg font-black text-amber-600">${formData.annual_noi.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <div className="space-y-4">
                <Label>{t('admin.properties.form.fields.images')}</Label>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Label htmlFor="images" className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 flex-1 sm:flex-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    {t('admin.properties.form.actions.uploadDesktop')}
                  </Label>
                  <Input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />

                  <Button type="button" variant="outline" onClick={handleDropboxUpload} className="text-[#0061FE] border-[#0061FE]/20 hover:bg-[#0061FE]/5 flex-1 sm:flex-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.01 2.825l-7.98 5.145 7.98 5.155 7.99-5.155-7.99-5.145zm-7.98 10.84l7.98 5.145 7.99-5.145-7.99-5.155-7.98 5.155zm7.98 6.015l-7.98-5.145V15.4l7.98 5.155 7.99-5.155v-.865l-7.99 5.145z" />
                    </svg>
                    {t('admin.properties.form.actions.uploadDropbox')}
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mt-2">
                  {t('admin.properties.form.fields.imagesHint')}
                </p>
              </div>

              {imagePreview.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreview.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      {index === 0 && (
                        <Badge className="absolute top-2 left-2">{t('admin.properties.form.fields.primary')}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? t('admin.properties.form.actions.saving') : property ? t('admin.properties.form.actions.update') : t('admin.properties.form.actions.create')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
