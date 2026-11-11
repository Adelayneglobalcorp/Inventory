-- Diagnóstico y arreglo del trigger de creación de usuarios

-- 1. Verificar si existe el trigger
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' 
  AND trigger_schema = 'auth';

-- 2. Verificar función del trigger
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%handle%';

-- 3. Eliminar y recrear el trigger (solución completa)
-- Primero eliminar trigger si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Eliminar función si existe
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Crear función mejorada
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insertar perfil solo si no existe
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
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
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'role', 'pendiente'),
      false,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error pero no fallar la creación del usuario
  RAISE WARNING 'Error creating profile: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Crear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Verificar que el trigger se creó correctamente
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users' 
  AND trigger_schema = 'auth';

-- 5. Probar creación de perfil manual para verificar estructura
-- SELECT public.handle_new_user();

-- 6. Verificar tabla profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;
