-- SOLUCIÓN EMERGENCIA: Crear perfiles para usuarios existentes sin perfil
-- Ejecuta esto después de deshabilitar el trigger y crear usuarios

-- 1. Ver usuarios sin perfil
SELECT 
  au.id,
  au.email,
  au.created_at,
  'SIN PERFIL' as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 2. Crear perfiles para TODOS los usuarios que no tengan
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
WHERE p.id IS NULL;

-- 3. Verificar resultado
SELECT 
  COUNT(*) as total_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles
FROM auth.users;

-- 4. Ver últimos perfiles creados
SELECT id, email, full_name, role, is_approved, created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;
