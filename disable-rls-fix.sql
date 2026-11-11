-- SOLUCIÓN DEFINITIVA: Desactivar RLS temporalmente y crear perfiles manualmente
-- ====================================================

-- 1. Desactivar RLS para permitir creación de perfiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Verificar que se desactivó
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- 3. Crear perfiles para todos los usuarios que no tienen
INSERT INTO public.profiles (id, email, full_name, role, is_approved, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'role', 'pendiente'),
  false,
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 4. Verificar resultado
SELECT 
  COUNT(*) as total_perfiles_creados
FROM public.profiles;

SELECT 
  email,
  full_name,
  role,
  is_approved,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;

-- 5. Mensaje
SELECT 'RLS desactivado - ahora prueba crear un usuario' as status;
