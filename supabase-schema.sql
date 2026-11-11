-- ADVERTENCIA: REFERENCIA HISTORICA, NO MIGRACION VIGENTE.
-- NO EJECUTAR SOBRE EL SUPABASE PRODUCTIVO.
-- Consulte docs/SUPABASE_BASELINE.md y audite primero el esquema real.
-- =============================================
-- Tablas para el Sistema de Gestión de Propiedades
-- =============================================

-- 1. Tabla de Perfiles de Usuario (Profiles)
-- Se relaciona con auth.users de Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  company TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'investor' CHECK (role IN ('admin', 'investor', 'agent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Tabla de Propiedades (Properties)
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  arv DECIMAL(12,2), -- After Repair Value
  roi DECIMAL(5,2), -- Return on Investment percentage
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  sqft INTEGER NOT NULL,
  year_built INTEGER,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'on_sale', 'sold')),
  property_type TEXT,
  description TEXT,
  image_url TEXT,
  gallery TEXT[], -- Array de URLs de imágenes
  rehab_cost DECIMAL(12,2),
  monthly_rent DECIMAL(10,2),
  cap_rate DECIMAL(5,2), -- Capitalization Rate percentage
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Tabla de Imágenes de Propiedades (Property Images)
-- Para manejar múltiples imágenes por propiedad
CREATE TABLE IF NOT EXISTS public.property_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Tabla de Ofertas (Offers)
-- Para gestionar ofertas sobre propiedades
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. Tabla de Visitas (Property Tours)
-- Para agendar visitas a las propiedades
CREATE TABLE IF NOT EXISTS public.property_tours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  visitor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================
-- Índices para optimizar consultas
-- =============================================

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Índices para properties
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_state ON public.properties(state);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at);

-- Índices para property_images
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON public.property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_primary ON public.property_images(property_id, is_primary);

-- Índices para offers
CREATE INDEX IF NOT EXISTS idx_offers_property_id ON public.offers(property_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer_id ON public.offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status);

-- Índices para property_tours
CREATE INDEX IF NOT EXISTS idx_property_tours_property_id ON public.property_tours(property_id);
CREATE INDEX IF NOT EXISTS idx_property_tours_visitor_id ON public.property_tours(visitor_id);
CREATE INDEX IF NOT EXISTS idx_property_tours_scheduled_at ON public.property_tours(scheduled_at);

-- =============================================
-- Triggers para actualizar timestamps
-- =============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para cada tabla
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_property_tours_updated_at
  BEFORE UPDATE ON public.property_tours
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- Políticas de Seguridad (RLS - Row Level Security)
-- =============================================

-- Activar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_tours ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Políticas para properties
CREATE POLICY "Anyone can view properties"
  ON public.properties FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create properties"
  ON public.properties FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Property owners can update their properties"
  ON public.properties FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Property owners can delete their properties"
  ON public.properties FOR DELETE
  USING (auth.uid() = owner_id);

-- Políticas para property_images
CREATE POLICY "Anyone can view property images"
  ON public.property_images FOR SELECT
  USING (true);

CREATE POLICY "Property owners can manage images"
  ON public.property_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = property_images.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

-- Políticas para offers
CREATE POLICY "Users can view offers on their properties or their offers"
  ON public.offers FOR SELECT
  USING (
    auth.uid() = buyer_id OR
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = offers.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create offers"
  ON public.offers FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update their offers"
  ON public.offers FOR UPDATE
  USING (auth.uid() = buyer_id);

-- Políticas para property_tours
CREATE POLICY "Users can view tours on their properties or their tours"
  ON public.property_tours FOR SELECT
  USING (
    auth.uid() = visitor_id OR
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = property_tours.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create tours"
  ON public.property_tours FOR INSERT
  WITH CHECK (auth.uid() = visitor_id);

CREATE POLICY "Visitors can update their tours"
  ON public.property_tours FOR UPDATE
  USING (auth.uid() = visitor_id);

-- =============================================
-- Funciones de utilidad
-- =============================================

-- Función para crear perfil automáticamente después del registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Vistas útiles
-- =============================================

-- Vista de propiedades con información del propietario
CREATE OR REPLACE VIEW public.property_details AS
SELECT 
  p.*,
  pr.full_name as owner_name,
  pr.email as owner_email,
  pr.company as owner_company,
  pi.url as primary_image_url
FROM public.properties p
LEFT JOIN public.profiles pr ON p.owner_id = pr.id
LEFT JOIN public.property_images pi ON p.id = pi.property_id AND pi.is_primary = true;

-- Vista de ofertas con información del comprador y propiedad
CREATE OR REPLACE VIEW public.offer_details AS
SELECT 
  o.*,
  pr.full_name as buyer_name,
  pr.email as buyer_email,
  prop.title as property_title,
  prop.address as property_address
FROM public.offers o
JOIN public.profiles pr ON o.buyer_id = pr.id
JOIN public.properties prop ON o.property_id = prop.id;
