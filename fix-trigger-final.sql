-- ARREGLAR: Trigger que crea perfil automáticamente
-- ====================================================

-- 1. ELIMINAR trigger y función existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. CREAR función optimizada que SIEMPRE funcione
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insertar perfil con manejo de duplicados
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'pendiente'),
    COALESCE((NEW.raw_user_meta_data->>'is_approved')::boolean, false),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- No fallar si ya existe
  
  RETURN NEW;
END;
$$;

-- 3. CREAR trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Verificar
SELECT 
  'Trigger recreado - ahora debería funcionar automáticamente' as status,
  tgname,
  tgenabled
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgname = 'on_auth_user_created';

-- 5. Arreglar perfiles faltantes de usuarios anteriores
INSERT INTO public.profiles (id, email, full_name, role, is_approved, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1), 'Usuario'),
  COALESCE(au.raw_user_meta_data->>'role', 'pendiente'),
  false,
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

SELECT 
  COUNT(*) as usuarios_sin_perfil_arreglados
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
