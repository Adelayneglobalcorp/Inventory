-- DIAGNÓSTICO: Error 500 en auth/signup
-- Verificar qué está causando el error

-- 1. Verificar triggers en auth.users (los que podemos ver)
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;

-- 2. Verificar si hay funciones que se ejecutan en auth
SELECT 
  proname,
  prosrc
FROM pg_proc
WHERE pronamespace = 'auth'::regnamespace
  OR prosrc LIKE '%auth.users%'
LIMIT 10;

-- 3. Verificar logs de errores (si tenemos acceso)
-- Nota: Esto solo funciona si tienes permisos de superusuario

-- 4. Verificar políticas RLS que puedan afectar
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

-- 5. Verificar si la tabla auth.users tiene restricciones
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'auth.users'::regclass;

-- 6. SOLUCIÓN TEMPORAL: Desactivar temporalmente el trigger problemático
-- (Solo si tienes permisos, probablemente fallará)
-- ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- 7. Verificar si el problema es una extensión
SELECT * FROM pg_extension WHERE extname LIKE '%auth%';

-- 8. Verificar configuración de Supabase Auth
-- Esto normalmente requiere acceso a las variables de entorno o dashboard
