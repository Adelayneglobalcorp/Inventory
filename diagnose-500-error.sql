-- DIAGNÓSTICO COMPLETO: Error 500 al crear usuario

-- 1. Verificar logs de errores recientes
SELECT 
  timestamp,
  severity,
  message
FROM pg_log 
WHERE timestamp > NOW() - INTERVAL '5 minutes'
  AND message LIKE '%error%'
ORDER BY timestamp DESC
LIMIT 10;

-- 2. Verificar si el trigger existe y está funcionando
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;

-- 3. Verificar función del trigger
SELECT 
  proname,
  prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 4. Verificar restricciones de la tabla profiles
SELECT 
  conname as constraint_name,
  contype as type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass;

-- 5. Verificar si hay datos corruptos
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN id IS NULL THEN 1 END) as null_ids,
  COUNT(CASE WHEN email IS NULL THEN 1 END) as null_emails
FROM public.profiles;

-- 6. Verificar últimos usuarios creados
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 7. SOLUCIÓN: Deshabilitar trigger temporalmente para probar
-- ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- 8. SOLUCIÓN: Si el trigger es el problema, recrearlo sin errores
-- (Descomenta las líneas siguientes si quieres recrear el trigger)
/*
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Usar INSERT con manejo de excepciones
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, is_approved, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'role', 'pendiente'),
      false,
      NOW(),
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log pero no fallar
    RAISE WARNING 'Could not create profile: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
*/
