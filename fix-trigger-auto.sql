-- ARREGLAR TRIGGER: Hacer que funcione automáticamente
-- ====================================================

-- 1. Primero, diagnosticar el error real
-- Ver qué pasa si intentamos insertar manualmente
SELECT 
  'Diagnóstico: Verificar último usuario creado' as step,
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;

-- 2. ARREGLAR la función del trigger - Versión ROBUSTA
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_role TEXT;
BEGIN
  -- Extraer valores de metadata con defaults
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'pendiente');
  
  -- Intentar crear perfil
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
      v_full_name,
      v_role,
      false,
      NOW(),
      NOW()
    );
    
    -- Si llegamos aquí, todo salió bien
    RAISE LOG 'Profile created successfully for user %', NEW.id;
    
  EXCEPTION WHEN unique_violation THEN
    -- Usuario ya existe, ignorar
    RAISE LOG 'Profile already exists for user %', NEW.id;
    
  WHEN OTHERS THEN
    -- Loguear el error pero NO propagarlo
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    -- NO hacer RAISE EXCEPTION - eso cancela la creación del usuario
  END;
  
  -- SIEMPRE retornar NEW para permitir la creación del usuario
  RETURN NEW;
END;
$$;

-- 3. Crear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Verificar que se creó
SELECT 
  'Trigger recreado exitosamente' as status,
  tgname,
  tgenabled
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgname = 'on_auth_user_created';

-- 5. TEST: Verificar que funciona creando un perfil de prueba
-- (Opcional - descomenta para probar)
/*
-- Simular lo que haría el trigger
INSERT INTO public.profiles (id, email, full_name, role, is_approved, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'test@example.com',
  'Test User',
  'pendiente',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Limpiar test
DELETE FROM public.profiles WHERE email = 'test@example.com';
*/
