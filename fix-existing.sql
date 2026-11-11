-- Script de reparación - Versión para tabla existente

-- 1. Eliminar triggers existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS auto_confirm_admin_trigger ON auth.users;

-- 2. Eliminar funciones existentes
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.auto_confirm_admin();
DROP FUNCTION IF EXISTS public.verify_admin_code(TEXT);
DROP FUNCTION IF EXISTS public.use_admin_code(TEXT, UUID);
DROP FUNCTION IF EXISTS public.approve_user(UUID, UUID);
DROP FUNCTION IF EXISTS public.reject_user(UUID, UUID);

-- 3. Agregar columnas que faltan a la tabla profiles existente
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Crear tabla de códigos de administrador
CREATE TABLE IF NOT EXISTS public.admin_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. Crear índices
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_approved ON public.profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_admin_codes_code ON public.admin_codes(code);
CREATE INDEX IF NOT EXISTS idx_admin_codes_user_id ON public.admin_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_codes_is_used ON public.admin_codes(is_used);

-- 6. Crear función para manejo de usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar perfil sin aprobar automáticamente
  INSERT INTO public.profiles (id, email, full_name, role, is_approved)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Sin nombre'),
    COALESCE(new.raw_user_meta_data->>'role', 'investor'),
    FALSE -- No aprobado por defecto
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_approved = EXCLUDED.is_approved,
    updated_at = NOW();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Crear trigger para nuevo usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Función para aprobar usuario
CREATE OR REPLACE FUNCTION public.approve_user(user_id UUID, approved_by UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    is_approved = TRUE,
    approved_by = approve_user.approved_by,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = approve_user.user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Función para rechazar usuario
CREATE OR REPLACE FUNCTION public.reject_user(user_id UUID, rejected_by UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    is_approved = FALSE,
    approved_by = reject_user.rejected_by,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = reject_user.user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Aprobar manualmente tu cuenta de administrador
UPDATE public.profiles 
SET is_approved = TRUE 
WHERE email = 'diegoforerogarzon@gmail.com';

-- 11. Confirmar email de tu cuenta de administrador
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'diegoforerogarzon@gmail.com';
