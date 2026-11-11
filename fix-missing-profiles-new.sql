-- DIAGNÓSTICO: Usuario creado pero no aparece en el panel
-- ====================================================

-- 1. Verificar si el usuario NUEVO tiene perfil en la tabla
SELECT 
  au.id,
  au.email,
  au.created_at as user_created_at,
  p.id as profile_id,
  p.email as profile_email,
  p.full_name,
  p.role,
  p.is_approved,
  p.created_at as profile_created_at,
  CASE WHEN p.id IS NULL THEN 'SIN PERFIL' ELSE 'CON PERFIL' END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 10;

-- 2. Ver usuarios SIN perfil (los que no aparecen en el panel)
SELECT 
  au.id,
  au.email,
  au.created_at,
  'SIN PERFIL - No aparece en panel' as problema
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- 3. SOLUCIÓN: Crear perfiles faltantes
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

-- 4. Verificar que se arregló
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT COUNT(*) as total_users FROM auth.users;
