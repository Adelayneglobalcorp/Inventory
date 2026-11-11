-- FIX: Arreglar función handle_new_user con SET search_path
-- Esto resuelve el error "Function Search Path Mutable"

-- 1. Eliminar trigger temporalmente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Eliminar función existente
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Recrear función con SET search_path explícito
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- Esto arregla la alerta de seguridad
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    is_approved,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'pendiente'),
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 4. Recrear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Arreglar también las otras funciones con el mismo problema

-- approve_user
DROP FUNCTION IF EXISTS public.approve_user(UUID, UUID);
CREATE OR REPLACE FUNCTION public.approve_user(
  user_id UUID,
  approver_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    role = 'usuario',
    is_approved = true,
    approved_by = approver_id,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = user_id AND role = 'pendiente';
  
  RETURN FOUND;
END;
$$;

-- reject_user  
DROP FUNCTION IF EXISTS public.reject_user(UUID, UUID);
CREATE OR REPLACE FUNCTION public.reject_user(
  user_id UUID,
  approver_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    is_approved = false,
    approved_by = approver_id,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;

-- create_user_profile
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT,
  user_role TEXT DEFAULT 'pendiente'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, role, is_approved, created_at, updated_at
  )
  VALUES (
    user_id,
    user_email,
    COALESCE(user_full_name, split_part(user_email, '@', 1)),
    COALESCE(user_role, 'pendiente'),
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error creating profile: %', SQLERRM;
  RETURN FALSE;
END;
$$;

-- 6. Verificar que se arreglaron
SELECT 'Funciones arregladas con SET search_path' as status;

-- Verificar estado
SELECT 
  proname,
  prosecdef as security_definer
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace 
  AND proname IN ('handle_new_user', 'approve_user', 'reject_user', 'create_user_profile');
