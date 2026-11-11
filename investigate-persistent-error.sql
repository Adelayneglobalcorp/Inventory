-- INVESTIGACIÓN: Error "Database error creating new user" persiste
-- ====================================================

-- 1. Verificar si el trigger aún existe y está habilitado
SELECT 
  tgname,
  tgenabled,
  CASE tgenabled 
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    WHEN 'R' THEN 'REPLICA'
    ELSE tgenabled::text
  END as status,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgname = 'on_auth_user_created';

-- 2. Si el trigger sigue habilitado, ver su función
SELECT 
  proname,
  prosrc,
  prosecdef
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 3. Verificar si hay algún constraint que cause el error
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass;

-- 4. Verificar si la columna is_approved tiene valor por defecto
SELECT 
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'is_approved';

-- 5. SOLUCIÓN NUCLEAR: Si todo falla, desactivar trigger vía hack
-- (Actualizar el catalogo directamente - RIESGOSO)
-- Solo para emergencias:
/*
UPDATE pg_trigger 
SET tgenabled = 'D' 
WHERE tgrelid = 'auth.users'::regclass 
  AND tgname = 'on_auth_user_created';
*/

-- 6. Verificación alternativa: Intentar crear un usuario directo
-- Si esto funciona, el problema es específico de la app
-- Si falla, el problema es del backend/trigger

-- 7. Ver logs de errores recientes (si disponible)
-- Nota: Requiere acceso a logs de Supabase

-- Mensaje informativo
SELECT 'Investigando causa del error persistente...' as status;
