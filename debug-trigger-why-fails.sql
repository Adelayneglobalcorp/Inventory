-- DEBUG: Verificar por qué el trigger no crea el perfil automáticamente
-- ====================================================

-- 1. Verificar el estado actual del trigger
SELECT 
  tgname,
  tgenabled,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgname = 'on_auth_user_created';

-- 2. Ver la función del trigger completa
SELECT 
  proname,
  prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 3. Verificar si hay error en los logs del trigger
-- (Simulamos un insert para ver el error)

-- 4. TEST: Intentar insertar manualmente como lo haría el trigger
-- Esto revelará el error exacto
DO $$
DECLARE
  test_user_id UUID;
  test_user_email TEXT;
BEGIN
  -- Obtener el último usuario creado
  SELECT id, email INTO test_user_id, test_user_email
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;
  
  RAISE NOTICE 'Usuario: %, %', test_user_id, test_user_email;
  
  -- Intentar crear perfil manualmente
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, is_approved, created_at, updated_at)
    VALUES (
      test_user_id,
      test_user_email,
      'Test User',
      'pendiente',
      false,
      NOW(),
      NOW()
    );
    RAISE NOTICE 'Perfil creado exitosamente';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: %', SQLERRM;
  END;
END $$;

-- 5. Verificar RLS policies que puedan bloquear el insert
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

-- 6. ARREGLAR: Recrear el trigger sin el bloque try-catch que lo silencia
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 7. Crear función SIMPLIFICADA sin manejo de errores (para ver el error real)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    COALESCE(NEW.raw_user_meta_data->>'is_approved', 'false')::boolean,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- 8. Crear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 9. Mensaje
SELECT 'Trigger recreado - prueba crear un usuario para ver el error real' as status;
