-- Script de reparación completa - Versión corregida para Supabase

-- 1. Eliminar triggers existentes que puedan causar conflictos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS auto_confirm_admin_trigger ON auth.users;

-- 2. Eliminar funciones existentes
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.auto_confirm_admin();
DROP FUNCTION IF EXISTS public.verify_admin_code(TEXT);
DROP FUNCTION IF EXISTS public.use_admin_code(TEXT, UUID);
DROP FUNCTION IF EXISTS public.approve_user(UUID, UUID);
DROP FUNCTION IF EXISTS public.reject_user(UUID, UUID);

-- 3. Eliminar tablas si existen para empezar desde cero (CUIDADO: esto eliminará datos existentes)
-- DROP TABLE IF EXISTS public.admin_codes CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- 4. Crear tabla profiles desde cero con estructura correcta
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'investor' CHECK (role IN ('admin', 'investor', 'agent')),
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  phone TEXT,
  company TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. Crear tabla de códigos de administrador
CREATE TABLE public.admin_codes (
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

-- 6. Crear índices
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_is_approved ON public.profiles(is_approved);
CREATE INDEX idx_admin_codes_code ON public.admin_codes(code);
CREATE INDEX idx_admin_codes_user_id ON public.admin_codes(user_id);
CREATE INDEX idx_admin_codes_is_used ON public.admin_codes(is_used);

-- 7. Crear función para manejo de usuarios
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
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Crear trigger para nuevo usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Función para aprobar usuario
CREATE OR REPLACE FUNCTION public.approve_user(user_id UUID, approved_by UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    is_approved = TRUE,
    approved_by = approve_user.approved_by,
    approved_at = NOW()
  WHERE id = approve_user.user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Función para rechazar usuario
CREATE OR REPLACE FUNCTION public.reject_user(user_id UUID, rejected_by UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    is_approved = FALSE,
    approved_by = reject_user.rejected_by,
    approved_at = NOW()
  WHERE id = reject_user.user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Función para generar y guardar códigos de administrador
CREATE OR REPLACE FUNCTION public.generate_admin_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1), 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 12. Guardar código de administrador
CREATE OR REPLACE FUNCTION public.save_admin_code(code TEXT, user_id UUID, created_by UUID)
RETURNS TABLE(
  success BOOLEAN,
  error TEXT
) AS $$
BEGIN
  INSERT INTO public.admin_codes (code, user_id, created_by, expires_at)
  VALUES (
    code, 
    user_id, 
    created_by,
    NOW() + INTERVAL '7 days' -- Expira en 7 días
  );
  
  RETURN ROW(TRUE, 'Código guardado exitosamente');
EXCEPTION WHEN OTHERS THEN
  RETURN ROW(FALSE, SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Aprobar manualmente tu cuenta de administrador
UPDATE public.profiles 
SET is_approved = TRUE 
WHERE email = 'diegoforerogarzon@gmail.com';

-- 14. Confirmar email de tu cuenta de administrador
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'diegoforerogarzon@gmail.com';
