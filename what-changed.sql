-- DIAGNÓSTICO: Qué cambió que rompió el registro de usuarios
-- ====================================================

-- 1. Verificar si la tabla profiles tiene restricciones nuevas
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass;

-- 2. Verificar si hay índices únicos que puedan causar conflictos
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles' AND schemaname = 'public';

-- 3. Verificar políticas RLS recientes
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public';

-- 4. Verificar si el trigger en auth.users existe
SELECT 
  tgname,
  tgenabled,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;

-- 5. Verificar función del trigger
SELECT 
  proname,
  prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 6. Verificar últimos usuarios que SÍ se crearon (para ver cuándo falló)
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'role' as role
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 7. Verificar si hay usuarios SIN perfil (indica que el trigger falló)
SELECT 
  au.id,
  au.email,
  au.created_at,
  'SIN PERFIL' as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC
LIMIT 10;
