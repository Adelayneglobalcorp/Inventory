-- WORKAROUND TEMPORAL: Desactivar trigger desde SQL (si tienes permisos)
-- Si esto falla, usa el workaround del frontend

-- Intento 1: Desactivar trigger (probablemente falle sin owner)
-- ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Intento 2: Ver qué hace el trigger actual
SELECT 
  tgname as trigger_name,
  pg_get_triggerdef(oid) as definition,
  tgenabled as enabled
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgname = 'on_auth_user_created';

-- Intento 3: Si podemos ver la función del trigger, diagnosticar el error
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_trigger t ON t.tgfoid = p.oid
WHERE t.tgrelid = 'auth.users'::regclass
  AND t.tgname = 'on_auth_user_created';

-- Verificar si el trigger está habilitado o deshabilitado
SELECT 
  tgname,
  CASE tgenabled 
    WHEN 'O' THEN 'ENABLED (Origin)'
    WHEN 'D' THEN 'DISABLED'
    WHEN 'R' THEN 'ENABLED (Replica)'
    WHEN 'A' THEN 'ALWAYS'
  END as status
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;

-- Mensaje: Si el trigger está ENABLED pero falla, causa el error 500
SELECT 'Si el trigger está ENABLED pero tiene errores, causa el 500' as diagnosis;
